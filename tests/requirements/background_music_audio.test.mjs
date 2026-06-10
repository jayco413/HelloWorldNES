import { assert, loadRomBytes, NES } from "../lib/hello_world_test_utils.mjs";

const rom = loadRomBytes();
let sampleCount = 0;
let nonSilentSamples = 0;
let minSample = Number.POSITIVE_INFINITY;
let maxSample = Number.NEGATIVE_INFINITY;
let currentFrame = 0;
const apuWrites = [];

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

const originalApuWrite = nes.papu.writeReg.bind(nes.papu);
nes.papu.writeReg = (address, value) => {
  if (address === 0x4002 || address === 0x4003 || address === 0x400a || address === 0x400b) {
    apuWrites.push({ frame: currentFrame, address, value });
  }

  originalApuWrite(address, value);
};

for (let i = 0; i < 760; i += 1) {
  currentFrame = i;
  nes.frame();
}

function collectTimers(lowAddress, highAddress) {
  const timers = [];
  let pendingLow = null;

  for (const write of apuWrites) {
    if (write.address === lowAddress) {
      pendingLow = write;
    } else if (write.address === highAddress && pendingLow) {
      timers.push({
        frame: write.frame,
        timer: ((write.value & 0x07) << 8) | pendingLow.value
      });
      pendingLow = null;
    }
  }

  return timers;
}

const pulseTimers = collectTimers(0x4002, 0x4003);
const bassTimers = collectTimers(0x400a, 0x400b);
const expectedOpening = [0x21a, 0x193, 0x152];

assert(sampleCount > 0, "Expected JSNES to emit audio samples");
assert(nonSilentSamples > 0, "Expected background music to produce non-silent APU samples");
assert(minSample !== maxSample, "Expected background music samples to vary over time");
assert(pulseTimers.length >= 48, `Expected at least one full Moonlight pulse phrase, got ${pulseTimers.length} notes`);
assert(bassTimers.length >= 6, `Expected triangle bass movement, got ${bassTimers.length} bass notes`);

for (let i = 0; i < 12; i += 1) {
  const expectedTimer = expectedOpening[i % expectedOpening.length];
  assert(
    pulseTimers[i].timer === expectedTimer,
    `Expected opening pulse timer ${expectedTimer.toString(16)}, got ${pulseTimers[i].timer.toString(16)} at note ${i}`
  );
}

const pulseIntervals = pulseTimers.slice(1).map((timer, index) => timer.frame - pulseTimers[index].frame);
assert(pulseIntervals.includes(14), "Expected 14-frame triplet note timing");
assert(pulseIntervals.some((interval) => interval > 14), "Expected longer phrase-end timing");

const bassTimerValues = new Set(bassTimers.map((timer) => timer.timer));
for (const expectedBass of [0x326, 0x389, 0x3f8, 0x4b8, 0x434]) {
  assert(
    bassTimerValues.has(expectedBass),
    `Expected bass timer ${expectedBass.toString(16)} in Moonlight progression`
  );
}

console.log(`Background music audio requirement passed: ${nonSilentSamples}/${sampleCount} samples were non-silent across ${pulseTimers.length} pulse notes and ${bassTimers.length} bass notes.`);
