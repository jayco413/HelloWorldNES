import { assert, loadRomBytes, NES } from "../lib/hello_world_test_utils.mjs";

const rom = loadRomBytes();
let sampleCount = 0;
let nonSilentSamples = 0;
let minSample = Number.POSITIVE_INFINITY;
let maxSample = Number.NEGATIVE_INFINITY;

const nes = new NES({
  emulateSound: true,
  onFrame() {},
  onStatusUpdate() {},
  onAudioSample(left, right) {
    sampleCount += 1;
    minSample = Math.min(minSample, left, right);
    maxSample = Math.max(maxSample, left, right);

    if (Math.abs(left) > 0.0001 || Math.abs(right) > 0.0001) {
      nonSilentSamples += 1;
    }
  }
});

nes.loadROM(rom);

for (let i = 0; i < 90; i += 1) {
  nes.frame();
}

assert(sampleCount > 0, "Expected JSNES to emit audio samples");
assert(nonSilentSamples > 0, "Expected background music to produce non-silent APU samples");
assert(minSample !== maxSample, "Expected background music samples to vary over time");

console.log(`Background music audio requirement passed: ${nonSilentSamples}/${sampleCount} samples were non-silent.`);
