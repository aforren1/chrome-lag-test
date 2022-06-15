/*

we want our max sampling frequency to be ~5kHz (probably overkill)
The signal is <60 Hz (display probably updates 60-240 Hz, but we're only switching the display every N frames, N ~5)
but it's also nice to get a nice sampling of the rising/falling edge

*/
#include <Arduino.h>
#include <ADC.h>

elapsedMicros time;

constexpr int photo_pin = A0;

ADC *adc = new ADC();

void setup() {
    Serial.begin(256000);
    pinMode(photo_pin, INPUT_DISABLE);

    adc->adc0->setAveraging(16);
    adc->adc0->setResolution(16); // we're expecting 10 < x < 12 bits in reality?
    // TODO: what impact to these have?
    adc->adc0->setConversionSpeed(ADC_CONVERSION_SPEED::VERY_LOW_SPEED);
    adc->adc0->setSamplingSpeed(ADC_SAMPLING_SPEED::MED_SPEED);
    time = 0;
}

enum class State {
    idle, // no communication with computer
    sampling // 
};

auto current_state = State::idle;

struct obs {
    uint32_t counter;
    uint32_t sample_counter; // sample count; reset every 
    uint16_t photo; // raw phototransistor value, 0-2^16 (but probably more restricted than that)
};

// can buffer a max of ~512kB in RAM1?
constexpr uint32_t MAX_TIME_SEC = 5*60; // 5 minutes
constexpr uint32_t SAMPLING_FREQ_HZ = 5000; // 5kHz
constexpr uint32_t SAMPLING_PERIOD_US = 1'000'000 / SAMPLING_FREQ_HZ;
constexpr uint32_t MAX_BUFFER_SIZE = MAX_TIME_SEC * SAMPLING_FREQ_HZ;
obs samples[MAX_BUFFER_SIZE];

uint32_t counter = 0;
uint32_t sample_counter = 0;
uint32_t set_pt = 0;

void loop() {
    if (current_state == State::idle) {
    }

    if (current_state == State::sampling) {
        // spin (TODO: use TeensyTimers instead?)
        while (time < SAMPLING_PERIOD_US) {}
        time = 0;
        const auto idx = counter % MAX_BUFFER_SIZE;
        samples[idx].counter = counter;
        samples[idx].sample_counter = sample_counter;

    }
    uint16_t photo_val = adc->adc0->analogRead(photo_pin);
    Serial.println(photo_val);
    delay(10);

}
