#include <Arduino.h>

uint8_t rx_buffer[64]; // incoming data
uint8_t tx_buffer[64]; // outgoing data
elapsedMicros time;

void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
}

/*
Gist:

1. Computer starts interaction (sends packet with single byte set)
2. Teensy records onset time, sends packet back
3. Computer receives packet (now we have roundtrip from computer), sends packet back to teensy
4. Teensy computes delta, sends delta packet back
5. Computer receives delta packet (now we have roundtrip from Teensy)
*/

uint32_t t0 = 0;
void loop() {
    // we spin as fast as possible
    if (RawHID.recv(rx_buffer, 0)) {
        uint32_t timestamp = time; // take approx time of packet reception
        uint8_t rx_state = rx_buffer[0]; // first byte indicates where we are in process
        // new run
        if (rx_state == 0x01) {
            t0 = timestamp;
            tx_buffer[0] = 0x02;
            RawHID.send(tx_buffer, 0);
            digitalWriteFast(LED_BUILTIN, HIGH); // I imagine this won't be visible?
        } 
        // second packet, compute the delta
        else if (rx_state == 0x03) {
            uint32_t dt = timestamp - t0; // *should* always be > 0?
            tx_buffer[0] = 0x04;
            memcpy(&tx_buffer[1], &dt, sizeof(dt));
            RawHID.send(tx_buffer, 0);
            digitalWriteFast(LED_BUILTIN, LOW);
        }
    }
}
