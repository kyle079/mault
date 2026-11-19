#pragma once
#include <algorithm>
#include <cstdint>
#include <iostream>
#include <stdexcept>
#include <string>

#define F(value) value
constexpr int LOW = 0, HIGH = 1, INPUT_PULLUP = 2;
inline int constrain(int value, int low, int high) { return std::clamp(value, low, high); }
unsigned long millis();
void delay(unsigned long ms);
void pinMode(int pin, int mode);
int digitalRead(int pin);

class ConsoleSerial {
public:
  void begin(int) {}
  explicit operator bool() const { return true; }
  int available();
  char read();
  void write(char value) { std::cout.put(value); }
  template<typename T> void print(const T& value) { std::cout << value; }
  template<typename T> void println(const T& value) { std::cout << value << std::endl; }
};
inline ConsoleSerial Serial;

namespace hardware {
struct Stopped {};
void initialize(bool simulated);
void enableOutputs();
void shutdown() noexcept;
void checkStop();
}
