
#include <Arduino.h>
#include <ADC.h>
#include "TeensyTimerTool.h"

namespace ttt = TeensyTimerTool;
// use TMR channel with 4x prescaling

// drives sampling from the ADC
ttt::PeriodicTimer t1(ttt::GPT1); // max period ~1.747 ms (see include/userConfig.h)

// ADC init
constexpr int photo_pin = A0;
ADC *adc = new ADC();

/*
we can probably describe the data in ~8 bytes
that means up to 8 observations per 64-byte packet

At 1kHz sampling, we can send data at ~125Hz (which should prevent a significant load on the computer?)
options: 
 - just use RawHID for send/recv. Send data, recv periodic messages
 - Use Serial for send, RawHID for recv. Bounded latency for commands, possible to do bulk data
     transfer at the end? Also more complex browser config (both WebSerial & WebHID simultaneously)
 - Just use serial. Unknown latency for recv (but probably fine?), and just bulk transfer at the end

I'm feeling just RawHID for now, for simplicity and to avoid any quirky device-is-serial-but-not-really stuff

Ideally we'd have the 512-byte packet version (since we can at high speed), but that would take a little more work:
https://forum.pjrc.com/threads/68620-T4-x-support-for-Raw-HID-512-wonder-if-it-makes-sense-to-add-to-system?p=292697
*/

struct obs {
    uint32_t time_us; // monotonically increasing counter in microseconds (good up to ~71 minutes)
    uint16_t sample_counter; // reset when byte received from computer (for delay est/alignment)
    uint16_t photo; // raw photosensor value
};
#define EXPECT_OBS_SIZE (sizeof(uint32_t) + sizeof(uint16_t) + sizeof(uint16_t))
static_assert(sizeof(obs) == EXPECT_OBS_SIZE, "Padded!");

// we can buffer a max of ~512 kB in RAM1, and should be 480 kB

constexpr uint32_t MAX_TIME_SEC = 60; // 60 sec
constexpr uint32_t SAMPLING_FREQ_HZ = 1000; // 1kHz
constexpr uint32_t SAMPLING_PERIOD_US = 1'000'000 / SAMPLING_FREQ_HZ;
constexpr uint32_t MAX_BUFFER_SIZE = MAX_TIME_SEC * SAMPLING_FREQ_HZ;
obs samples[MAX_BUFFER_SIZE];

void setup() {
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(photo_pin, INPUT_DISABLE);
    adc->adc0->setAveraging(32);
    adc->adc0->setResolution(8); // we're expecting 10 < x < 12 bits in reality?
    // TODO: what impact to these have?
    adc->adc0->setConversionSpeed(ADC_CONVERSION_SPEED::MED_SPEED);
    adc->adc0->setSamplingSpeed(ADC_SAMPLING_SPEED::MED_SPEED);
}

// 0 = idle, 1 = sampling
volatile bool current_state = false;
volatile uint8_t rx_data = 0;
volatile bool new_rx = false;
volatile uint32_t idx = 0; // index into samples[]
volatile uint32_t sample_counter = 0; // approx alignment to browser rAF
elapsedMicros time; // microsecond timestamp

uint8_t rx_buffer[64]; // incoming data
uint8_t tx_buffer[64]; // outgoing data


void adc_cb() {
    uint32_t loc_time = time;
    uint16_t photo_val = adc->adc0->analogRead(photo_pin);
    // don't totally fail if we roll over the MAX_BUFFER_SIZE
    samples[idx % MAX_BUFFER_SIZE].time_us = loc_time;
    samples[idx % MAX_BUFFER_SIZE].sample_counter = sample_counter;
    samples[idx % MAX_BUFFER_SIZE].photo = photo_val;
    idx++;
    sample_counter++;
}

void loop() {
    /*
    Expected commands:
    0x00 = return to idle state, and dump data
    0x01 = start sampling from idle
    0x02 = rAF started (reset the sample counter)
    */
    int n = RawHID.recv(rx_buffer, 50); // wait for up to 50 ms
    if (n > 0) {
        new_rx = true;
        rx_data = rx_buffer[0]; // only single-byte commands
    }

    if (new_rx && current_state && rx_data == 0x02) {
        // going black->white this frame, approx align with rAF
        // I imagine this won't be perfect?
        sample_counter = 0;
    } else if (new_rx && current_state && rx_data == 0x00) {
        // all done, stop sampling and send data to computer
        digitalWriteFast(LED_BUILTIN, LOW);
        t1.stop();
        current_state = false;

        // first, send a 32-bit uint to warn how many samples to expect
        uint32_t n_samples = idx; // TODO: why do we need to copy out of volatile
        memset(tx_buffer, 0, 64 * sizeof(tx_buffer[0]));
        memcpy(tx_buffer, &n_samples, sizeof(idx));
        RawHID.send(tx_buffer, 10);

        // now we'll start streaming the remaining data
        uint32_t tmp_idx = 0;
        while (tmp_idx < idx) {
            // wait until request from computer
            int n = RawHID.recv(rx_buffer, 100);
            if (!(n > 0 && rx_buffer[0] == 0x03)) {
                break;
            }
            // we can fit 8 samples per packet
            uint32_t leftover = idx - tmp_idx;
            if (leftover < 8) {
                break;
            }
            uint32_t n_send = 8;
            memcpy(tx_buffer, &samples[tmp_idx], n_send * sizeof(obs));
            RawHID.send(tx_buffer, 5);
            tmp_idx += n_send;
        }
        digitalWriteFast(LED_BUILTIN, HIGH);
        delay(100);
        digitalWriteFast(LED_BUILTIN, LOW);
    } else if (new_rx && !current_state && rx_data == 0x01) {
        // idle, but should start sampling
        digitalWriteFast(LED_BUILTIN, HIGH);
        sample_counter = 0;
        time = 0;
        idx = 0;
        current_state = true;
        t1.begin(adc_cb, SAMPLING_PERIOD_US, false);
        t1.start();
    }
    new_rx = false; // reset for next comm
}
