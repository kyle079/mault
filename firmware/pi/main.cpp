#include "hardware.h"
#include <csignal>
#include <sys/prctl.h>
#include <unistd.h>
#include "../main/main.ino"

int main(int argc, char** argv) {
  try {
    const bool simulated = argc == 2 && std::string(argv[1]) == "--simulate";
    if (argc > 1 && !simulated) throw std::runtime_error("usage: mault-controller [--simulate]");
    hardware::initialize(simulated);
    // Do not leave the feeder running if the network service itself crashes.
    if (prctl(PR_SET_PDEATHSIG, SIGTERM) != 0 || getppid() == 1)
      throw std::runtime_error("controller needs a supervising process");
    setup();
    hardware::enableOutputs();
    while (true) {
      loop();
      delay(2);
    }
  } catch (const hardware::Stopped&) {
    hardware::shutdown();
    return 0;
  } catch (const std::exception& error) {
    std::cerr << "Controller stopped: " << error.what() << std::endl;
    hardware::shutdown();
    return 1;
  }
}
