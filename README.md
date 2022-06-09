
General idea: We trigger a white square being drawn on the screen
Every N frames, we trigger a white square

If we trigger from Teensy w/ rAF-aligned input event, then we have rock-solid event times for both trigger & visual event
 - but even if it's rAF-aligned, 
If we trigger from browser (& tell Teensy via packet), clearer which frame the start actually landed on

Teensy 4 has a phototransistor

1. Initial screen overlay
 - flash square in upper left corner of monitor at ~0.5Hz (to show mount point)
 - options:
   - fullscreen/not
   - Expect teensy or not (& get WebHID validation out of the way? https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API)
   - desynchronized canvas
   - save data? (download json)
   
