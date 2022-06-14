/*

we want our max sampling frequency to be ~5kHz (probably overkill)
The signal is <60 Hz (display probably updates 60-240 Hz, but we're only switching the display every N frames, N ~5)


*/
#include <Arduino.h>
#include <ADC.h>

elapsedMicros time;

constexpr int photo_pin = A0;

ADC *adc = new ADC();

void setup() {
    pinMode(photo_pin, INPUT_DISABLE);

    adc->adc0->setAveraging(16);
    adc->adc0->setResolution(16); // we're expecting 10 < x < 12 bits in reality?
    // TODO: what impact to these have?
    adc->adc0->setConversionSpeed(ADC_CONVERSION_SPEED::VERY_LOW_SPEED);
    adc->adc0->setSamplingSpeed(ADC_SAMPLING_SPEED::MED_SPEED);
}

enum class State {
    idle, // no communication with computer
    sampling // 
};

struct obs {
    uint32_t time;
    uint16_t photo;
};

// can buffer a max of ~512kB in RAM1?
constexpr uint32_t MAX_TIME_SEC = 10;
constexpr uint32_t SAMPLING_PERIOD_US = 200; // 5kHz


void loop() {
    uint16_t photo_val = adc->adc0->analogRead(photo_pin);
    Serial.println(photo_val);
    delay(10);

}
