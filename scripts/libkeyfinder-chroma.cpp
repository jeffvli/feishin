// Prints libkeyfinder's chroma of the reference signal in src/renderer/utils/key-detection.test.ts,
// the values that pin the TypeScript port in src/renderer/utils/key-detection.ts to the original.
//
// macOS:
//   brew install libkeyfinder
//   c++ -std=c++17 scripts/libkeyfinder-chroma.cpp -I"$(brew --prefix libkeyfinder)/include" \
//       -L"$(brew --prefix libkeyfinder)/lib" -lkeyfinder -o /tmp/libkeyfinder-chroma
//   /tmp/libkeyfinder-chroma
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <keyfinder/keyfinder.h>
#include <vector>

// Keep in sync with REFERENCE_TONES in key-detection.test.ts: frequency in Hz, amplitude
static const double TONES[][2] = {
    {47.3, 0.5},   {55.0, 1.0},   {97.0, 0.6},   {110.0, 0.8},  {130.81, 0.6},
    {164.81, 0.7}, {220.0, 1.0},  {262.7, 0.5},  {285.3, 0.4},  {329.63, 0.7},
    {440.0, 0.9},  {523.25, 0.5}, {742.0, 0.4},  {880.0, 0.6},  {1234.5, 0.3},
    {1318.5, 0.4}, {1600.0, 0.2}, {1900.0, 0.2},
};

int main() {
    const unsigned int rate = 4410;
    const unsigned int length = rate * 6;
    const double pi = 3.14159265358979323846;
    const size_t toneCount = sizeof(TONES) / sizeof(TONES[0]);

    KeyFinder::AudioData audio;
    audio.setChannels(1);
    audio.setFrameRate(rate);
    audio.addToSampleCount(length);

    for (unsigned int i = 0; i < length; i++) {
        const double time = (double)i / rate;
        double sample = 0;
        for (size_t k = 0; k < toneCount; k++) {
            const double tremolo = 1 + 0.5 * std::sin((2 * pi * time) / (1.5 + k));
            sample += TONES[k][1] * tremolo * std::sin(2 * pi * TONES[k][0] * time);
        }
        // The test feeds a Float32Array
        audio.setSample(i, (double)(float)sample);
    }

    KeyFinder::KeyFinder finder;
    KeyFinder::Workspace workspace;
    finder.progressiveChromagram(audio, workspace);
    finder.finalChromagram(workspace);

    const std::vector<double> chroma = workspace.chromagram->collapseToOneHop();
    const double max = *std::max_element(chroma.begin(), chroma.end());

    std::printf("[");
    for (size_t band = 0; band < chroma.size(); band++) {
        std::printf("%s%.6f", band == 0 ? "" : ", ", chroma[band] / max);
    }
    std::printf("]\n");

    return 0;
}
