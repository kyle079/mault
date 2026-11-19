cmake_minimum_required(VERSION 3.18)
project(mault_controller LANGUAGES CXX)
include(FetchContent)
FetchContent_Declare(ArduinoJson
  GIT_REPOSITORY https://github.com/bblanchon/ArduinoJson.git
  GIT_TAG v7.4.2
  GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(ArduinoJson)
add_executable(mault-controller main.cpp hardware.cpp)
target_compile_features(mault-controller PRIVATE cxx_std_17)
target_compile_definitions(mault-controller PRIVATE MAULT_PI)
target_include_directories(mault-controller PRIVATE include)
target_link_libraries(mault-controller PRIVATE ArduinoJson)
target_compile_options(mault-controller PRIVATE -Wall -Wextra -Werror)
install(TARGETS mault-controller RUNTIME DESTINATION bin)
