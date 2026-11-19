#include "Adafruit_PWMServoDriver.h"
#include <chrono>
#include <csignal>
#include <cstring>
#include <fcntl.h>
#include <linux/gpio.h>
#include <linux/i2c-dev.h>
#include <poll.h>
#include <sys/ioctl.h>
#include <thread>
#include <unistd.h>
#include <unordered_map>

namespace {
bool simulated = false;
int chip = -1, i2c = -1, outputEnable = -1;
std::unordered_map<int, int> inputs;
volatile std::sig_atomic_t stopping = 0;
const auto started = std::chrono::steady_clock::now();

void stopSignal(int) { stopping = 1; }
void checked(bool ok, const char* operation) {
  if (!ok) throw std::runtime_error(std::string(operation) + ": " + std::strerror(errno));
}
int requestLine(int pin, bool output) {
  gpio_v2_line_request request{};
  request.offsets[0] = pin;
  request.num_lines = 1;
  std::strcpy(request.consumer, "mault-controller");
  request.config.flags = output ? GPIO_V2_LINE_FLAG_OUTPUT :
    GPIO_V2_LINE_FLAG_INPUT | GPIO_V2_LINE_FLAG_BIAS_PULL_UP;
  if (output) {
    request.config.num_attrs = 1;
    request.config.attrs[0].mask = 1;
    request.config.attrs[0].attr.id = GPIO_V2_LINE_ATTR_ID_OUTPUT_VALUES;
    request.config.attrs[0].attr.values = 1; // OE high: no servo output during startup.
  }
  checked(ioctl(chip, GPIO_V2_GET_LINE_IOCTL, &request) == 0, "request GPIO line");
  return request.fd;
}
void outputDisabled(bool disabled) {
  if (outputEnable < 0) return;
  gpio_v2_line_values values{};
  values.mask = 1;
  values.bits = disabled ? 1 : 0;
  checked(ioctl(outputEnable, GPIO_V2_LINE_SET_VALUES_IOCTL, &values) == 0, "set PCA9685 OE");
}
void writeRegister(uint8_t reg, uint8_t value) {
  const uint8_t data[] = {reg, value};
  checked(::write(i2c, data, sizeof(data)) == sizeof(data), "write PCA9685 register");
}
}

namespace hardware {
void initialize(bool mock) {
  simulated = mock;
  std::signal(SIGTERM, stopSignal);
  std::signal(SIGINT, stopSignal);
  std::signal(SIGPIPE, SIG_IGN);
  if (simulated) return;
  chip = ::open("/dev/gpiochip0", O_RDONLY | O_CLOEXEC);
  checked(chip >= 0, "open /dev/gpiochip0");
  outputEnable = requestLine(22, true);
}
void checkStop() {
  if (stopping) throw Stopped{};
}
void enableOutputs() {
  checkStop();
  outputDisabled(false);
}
void shutdown() noexcept {
  try { outputDisabled(true); } catch (...) {}
  if (i2c >= 0) {
    try { writeRegister(0xFD, 0x10); } catch (...) {} // ALL_LED_OFF_H: full off.
    ::close(i2c);
    i2c = -1;
  }
  for (const auto& entry : inputs) ::close(entry.second);
  inputs.clear();
  if (outputEnable >= 0) ::close(outputEnable);
  if (chip >= 0) ::close(chip);
  outputEnable = chip = -1;
}
}

unsigned long millis() {
  return std::chrono::duration_cast<std::chrono::milliseconds>(
    std::chrono::steady_clock::now() - started).count();
}
void delay(unsigned long ms) {
  const auto end = std::chrono::steady_clock::now() + std::chrono::milliseconds(ms);
  do {
    hardware::checkStop();
    std::this_thread::sleep_for(std::chrono::milliseconds(2));
  } while (std::chrono::steady_clock::now() < end);
}
void pinMode(int pin, int mode) {
  if (mode != INPUT_PULLUP) throw std::runtime_error("unsupported GPIO mode");
  if (!simulated) inputs.emplace(pin, requestLine(pin, false));
}
int digitalRead(int pin) {
  hardware::checkStop();
  if (simulated) {
    // Integration tests can change the simulated active-low GPIOs between commands.
    const char* path = std::getenv("MAULT_SIM_INPUTS");
    if (!path) return HIGH;
    FILE* file = std::fopen(path, "r");
    if (!file) return HIGH;
    int activePin;
    bool active = false;
    while (std::fscanf(file, "%d", &activePin) == 1) active |= activePin == pin;
    std::fclose(file);
    return active ? LOW : HIGH;
  }
  gpio_v2_line_values values{};
  values.mask = 1;
  checked(ioctl(inputs.at(pin), GPIO_V2_LINE_GET_VALUES_IOCTL, &values) == 0, "read IR sensor");
  return (values.bits & 1) ? HIGH : LOW;
}
int ConsoleSerial::available() {
  hardware::checkStop();
  pollfd fd{STDIN_FILENO, POLLIN, 0};
  const int result = ::poll(&fd, 1, 0);
  if (result < 0 && errno == EINTR) { hardware::checkStop(); return 0; }
  checked(result >= 0, "poll controller input");
  if (fd.revents & POLLIN) return 1;
  if (fd.revents & (POLLHUP | POLLERR | POLLNVAL)) throw hardware::Stopped{};
  return 0;
}
char ConsoleSerial::read() {
  char value;
  if (::read(STDIN_FILENO, &value, 1) != 1) throw hardware::Stopped{};
  return value;
}
void Adafruit_PWMServoDriver::begin() {
  if (simulated) return;
  i2c = ::open("/dev/i2c-1", O_RDWR | O_CLOEXEC);
  checked(i2c >= 0, "open /dev/i2c-1");
  checked(ioctl(i2c, I2C_SLAVE, 0x40) == 0, "select PCA9685 at 0x40");
  writeRegister(0x00, 0x30); // Sleep with auto-increment while configuring outputs.
  writeRegister(0x01, 0x04); // Totem-pole output, OE high drives outputs low.
  writeRegister(0xFA, 0);
  writeRegister(0xFB, 0);
  writeRegister(0xFC, 0);
  writeRegister(0xFD, 0x10);
  for (int channel = 0; channel < 16; ++channel) setPin(channel, 0);
  writeRegister(0xFD, 0);
}
void Adafruit_PWMServoDriver::setPWMFreq(int frequency) {
  if (frequency != 50) throw std::runtime_error("expected 50 Hz servo frequency");
  if (simulated) return;
  writeRegister(0x00, 0x10);
  writeRegister(0xFE, 121); // round(25 MHz / (4096 * 50 Hz)) - 1.
  writeRegister(0x00, 0x20);
  delay(5);
  writeRegister(0x00, 0xA0);
}
void Adafruit_PWMServoDriver::setPWM(int channel, int on, int off) {
  hardware::checkStop();
  if (channel < 0 || channel > 15 || on < 0 || on > 4096 || off < 0 || off > 4096)
    throw std::runtime_error("invalid PCA9685 output");
  if (simulated) {
    std::cerr << "PWM " << channel << ' ' << on << ' ' << off << '\n';
    return;
  }
  const uint8_t data[] = {static_cast<uint8_t>(0x06 + 4 * channel),
    static_cast<uint8_t>(on), static_cast<uint8_t>(on >> 8),
    static_cast<uint8_t>(off), static_cast<uint8_t>(off >> 8)};
  checked(::write(i2c, data, sizeof(data)) == sizeof(data), "write PCA9685 pulse");
}
void Adafruit_PWMServoDriver::setPin(int channel, int value) {
  if (value != 0) throw std::runtime_error("only full-off setPin is used by the sketch");
  setPWM(channel, 0, 4096);
}
