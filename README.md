
See https://aforren1.github.io/chrome-lag-test/index.md.html

General idea: we toggle a white square in the upper left corner of the display at some rate (a few Hz) and measure the onset/offset with a phototransistor attached to a microcontroller (MCU). We send a packet to the MCU when entering the `rAF` that will turn the square on, so we can get an idea of the delay between when the computer says the square will appear and when it is physically visible.

The following URL parameters are valid (see src/main.js for the most up-to-date):

 - `label`: string used to name the output JSON file
 - `on_frames`: number of frames to turn the square white per cycle
 - `off_frames`: number of frames to turn the square black per cycle
 - `cycles`: number of cycles to show
 - `device`: Expect the recording device? 1 (yes) or 0 (no)

The device is a Teensy 4.0 with a phototransistor connected to one of the analog pins (see the teensy/ folder for code).

This uses the WebHID API, and so will only work on Chromium-derived browsers.


TODO:
 - online latency estimation? Probably just need a median smoother for the photosensor to take out the N Hz flicker from the display? Otherwise looks like a pretty clean signal
 - Use shades of gray instead of white/black for faster phototransistor transitions? This doesn't need to turn into a test of the display's qualities
