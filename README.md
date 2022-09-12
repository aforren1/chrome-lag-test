See https://aforren1.github.io/chrome-lag-test/index.md.html for a long-form writeup.

The `roundtrip` directory contains microcontroller code and a sample site to assess any roundtrip delays associated with microcontroller <-> browser communication.

The `lag-tester` directory has code to assess the total display latency of the browser. The general idea is to toggle a white square in the upper-left corner of the display at some low rate, and to signal to the microcontroller whenever the dark -> light transition occurs. By measuring the delay between that signal and the rising edge of a phototransistor attached to the screen (indicating the square is physically visible), we can estimate the total display latency.

The `lag-tester` site can take few parameters (see https://github.com/aforren1/chrome-lag-test/blob/main/lag-tester/site/main.js#L3 for the latest):

 - `label`: string used to name the output JSON file
 - `on_frames`: number of frames to turn the square white per cycle
 - `off_frames`: number of frames to turn the square black per cycle
 - `cycles`: number of on-off cycles to show
 - `device`: Expect the recording device? 1 (yes) or 0 (no)

The device is a Teensy 4.0 with a phototransistor connected to one of the analog pins. See the `src/` subdirectories for code (uses PlatformIO to manage build tools/libraries).

This uses the WebHID API, and so will only work on Chromium-derived browsers.

TODO:
 - online latency estimation? Probably just need a median smoother for the photosensor to take out the N Hz flicker from the display? Otherwise looks like a pretty clean signal
 - Use shades of gray instead of white/black for faster phototransistor transitions? This doesn't need to turn into a test of the display's qualities
