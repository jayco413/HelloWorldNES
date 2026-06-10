import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createAllowedVisibleMask,
  createExpectedMask,
  createSceneMask,
  createUnderlineMask,
  height,
  helloColumn,
  originalWordRow,
  wordSpecs,
  width
} from "../hello_expectations.mjs";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const nesToolsRoot = path.resolve(process.env.NES_DEV_TOOLS || "C:\\CodexWorkspace\\Tools\\NES Development");
export const romPath = path.join(root, "build", "hello_world.nes");
export const runnerPath = path.join(root, "build", "run.html");
const jsnesModulePath = path.join(nesToolsRoot, "jsnes", "node_modules", "jsnes", "src", "index.js");
const jsnesModule = await import(pathToFileURL(jsnesModulePath).href);
export const expectedMask = createExpectedMask();
export const allowedVisibleMask = createAllowedVisibleMask();
export const underlineMasks = {
  Hello: createUnderlineMask("Hello"),
  World: createUnderlineMask("World")
};

export const rainbow = [
  { name: "Red", nes: 0x12, rgb: 0xdc0e22 },
  { name: "Orange", nes: 0x21, rgb: 0xffab3c },
  { name: "Yellow", nes: 0x2c, rgb: 0xe5e218 },
  { name: "Green", nes: 0x2a, rgb: 0x03f42b },
  { name: "Blue", nes: 0x27, rgb: 0x00b4f7 },
  { name: "Indigo", nes: 0x26, rgb: 0x476dff },
  { name: "Violet", nes: 0x25, rgb: 0xdf49ff }
];

export const initialColor = rainbow[3];
export const Controller = jsnesModule.Controller;
export const NES = jsnesModule.NES;
export { height, helloColumn, originalWordRow, width, wordSpecs };

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function hexColor(value) {
  return `#${(value >>> 0).toString(16).padStart(6, "0")}`;
}

export function loadRomBytes() {
  assert(fs.existsSync(romPath), `Missing ROM: ${romPath}`);
  return fs.readFileSync(romPath);
}

export function assertRomHeader(rom) {
  assert(rom.length === 16 + 16 * 1024 + 8 * 1024, `Unexpected ROM size: ${rom.length}`);
  assert(rom[0] === 0x4e && rom[1] === 0x45 && rom[2] === 0x53 && rom[3] === 0x1a, "Missing iNES magic");
  assert(rom[4] === 1, `Expected one 16 KB PRG bank, got ${rom[4]}`);
  assert(rom[5] === 1, `Expected one 8 KB CHR bank, got ${rom[5]}`);
  assert(((rom[6] >> 4) | (rom[7] & 0xf0)) === 0, "Expected mapper 0 / NROM");
}

export function createBootedNes(frameCount = 30) {
  let latestFrame = null;
  const rom = loadRomBytes();
  const nes = new NES({
    emulateSound: false,
    onFrame(frameBuffer) {
      latestFrame = Int32Array.from(frameBuffer);
    },
    onStatusUpdate() {},
    onAudioSample() {}
  });

  nes.loadROM(rom);

  function runFrames(count) {
    for (let i = 0; i < count; i += 1) {
      nes.frame();
    }
    return latestFrame;
  }

  runFrames(frameCount);
  return {
    nes,
    runFrames,
    getFrame() {
      return latestFrame;
    }
  };
}

export function analyzeHelloWorldFrame(frame) {
  assert(frame, "Emulator did not produce a video frame");
  assert(frame.length === width * height, `Unexpected frame size: ${frame.length}`);

  const background = frame[0];
  const textColors = new Map();
  let litPixels = 0;
  let mismatches = 0;

  for (let i = 0; i < frame.length; i += 1) {
    const isLit = frame[i] !== background;
    if (expectedMask[i]) {
      if (!isLit) {
        mismatches += 1;
      } else {
        litPixels += 1;
        textColors.set(frame[i], (textColors.get(frame[i]) || 0) + 1);
      }
    } else if (isLit && !allowedVisibleMask[i]) {
      mismatches += 1;
    }
  }

  return {
    background,
    litPixels,
    mismatches,
    textColors
  };
}

export function assertHelloWorldShape(frame) {
  const analysis = analyzeHelloWorldFrame(frame);
  assert(analysis.litPixels > 0, "No lit text pixels were rendered");
  assert(analysis.mismatches === 0, `Rendered frame did not match expected Hello World pixels; mismatches=${analysis.mismatches}`);
  return analysis;
}

export function assertSceneFrame(frame, scene, expectedColor = initialColor) {
  assert(frame, "Emulator did not produce a video frame");
  assert(frame.length === width * height, `Unexpected frame size: ${frame.length}`);

  const sceneMask = createSceneMask(scene);
  const background = frame[0];
  const colors = new Map();
  let litPixels = 0;
  let mismatches = 0;

  for (let i = 0; i < frame.length; i += 1) {
    const isLit = frame[i] !== background;
    if (sceneMask[i]) {
      if (!isLit) {
        mismatches += 1;
      } else {
        litPixels += 1;
        colors.set(frame[i], (colors.get(frame[i]) || 0) + 1);
      }
    } else if (isLit) {
      mismatches += 1;
    }
  }

  assert(litPixels > 0, "No lit scene pixels were rendered");
  assert(mismatches === 0, `Rendered frame did not match expected scene pixels; mismatches=${mismatches}`);
  assert(colors.size === 1, `Expected one scene color, got ${colors.size}`);

  const actualColor = colors.keys().next().value;
  assert(
    actualColor === expectedColor.rgb,
    `Expected ${expectedColor.name} ${hexColor(expectedColor.rgb)}, got ${hexColor(actualColor)}`
  );

  return {
    background,
    colors,
    litPixels
  };
}

export function assertUnderlineTarget(frame, targetWord) {
  assert(frame, "Emulator did not produce a video frame");
  const background = frame[0];
  const targetMask = underlineMasks[targetWord];
  const otherWord = targetWord === "Hello" ? "World" : "Hello";
  const otherMask = underlineMasks[otherWord];
  let targetPixels = 0;
  let missingTargetPixels = 0;
  let wrongWordPixels = 0;
  const underlineColors = new Map();

  for (let i = 0; i < frame.length; i += 1) {
    if (targetMask[i]) {
      if (frame[i] === background) {
        missingTargetPixels += 1;
      } else {
        targetPixels += 1;
        underlineColors.set(frame[i], (underlineColors.get(frame[i]) || 0) + 1);
      }
    }

    if (otherMask[i] && frame[i] !== background) {
      wrongWordPixels += 1;
    }
  }

  assert(targetPixels > 0, `No underline pixels were rendered under ${targetWord}`);
  assert(missingTargetPixels === 0, `Underline under ${targetWord} is incomplete; missing=${missingTargetPixels}`);
  assert(wrongWordPixels === 0, `Underline should not appear under ${otherWord}; pixels=${wrongWordPixels}`);
  assert(underlineColors.size === 1, `Expected one underline color, got ${underlineColors.size}`);
  return underlineColors.keys().next().value;
}

export function assertTextColor(frame, expectedColor) {
  const analysis = assertHelloWorldShape(frame);
  assert(analysis.textColors.size === 1, `Expected one text color, got ${analysis.textColors.size}`);
  const actualColor = analysis.textColors.keys().next().value;
  assert(
    actualColor === expectedColor.rgb,
    `Expected ${expectedColor.name} ${hexColor(expectedColor.rgb)}, got ${hexColor(actualColor)}`
  );
  return actualColor;
}

export function tapButton(system, button) {
  system.nes.buttonDown(1, button);
  system.runFrames(3);
  system.nes.buttonUp(1, button);
  return system.runFrames(3);
}

export function holdButton(system, button, frames = 1) {
  system.nes.buttonDown(1, button);
  const frame = system.runFrames(frames);
  system.nes.buttonUp(1, button);
  return frame;
}
