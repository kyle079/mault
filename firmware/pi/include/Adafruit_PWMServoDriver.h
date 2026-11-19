#pragma once
#include "hardware.h"

// Only the sketch's four hardware operations are needed on Linux.
class Adafruit_PWMServoDriver {
public:
  void begin();
  void setPWMFreq(int frequency);
  void setPWM(int channel, int on, int off);
  void setPin(int channel, int value);
};
