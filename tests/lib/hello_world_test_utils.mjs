import path from "node:path";
import { pathToFileURL } from "node:url";
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

export const nesToolsRoot = path.resolve(process.env.NES_DEV_TOOLS || "C:\\CodexWorkspace\\Tools\\NES Development");
const harnessPath = path.join(nesToolsRoot, "tests", "nes_test_harness.mjs");
const harness = await import(pathToFileURL(harnessPath).href);

export const root = harness.resolveProjectRoot(import.meta.url, "../..");
export const romPath = path.join(root, "build", "hello_world.nes");
export const runnerPath = path.join(root, "build", "run.html");
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
export const assert = harness.assert;
export const assertBrowserRunnerRendersMaskAndRoutesKeyboardInput = harness.assertBrowserRunnerRendersMaskAndRoutesKeyboardInput;
export const Controller = harness.Controller;
export const NES = harness.NES;
export const hexColor = harness.hexColor;
export const holdButton = harness.holdButton;
export const rgbToArray = harness.rgbToArray;
export const tapButton = harness.tapButton;
export { height, helloColumn, originalWordRow, width, wordSpecs };

/**
 * Loads the normal HelloWorldNES emulator ROM.
 */
export function loadRomBytes() {
  return harness.loadRomBytes(romPath);
}

/**
 * Asserts the normal HelloWorldNES ROM is mapper 0 / NROM.
 */
export function assertRomHeader(rom) {
  harness.assertINesHeader(rom, {
    expectedSize: 16 + 16 * 1024 + 8 * 1024,
    prgBanks: 1,
    chrBanks: 1,
    mapper: 0
  });
}

/**
 * Boots the normal HelloWorldNES ROM in JSNES.
 */
export function createBootedNes(frameCount = 30) {
  return harness.createBootedNes(romPath, frameCount);
}

/**
 * Analyzes the rendered HelloWorldNES text pixels.
 */
export function analyzeHelloWorldFrame(frame) {
  const analysis = harness.analyzeFrameAgainstMask(frame, {
    width,
    height,
    expectedMask,
    allowedVisibleMask
  });

  return {
    background: analysis.background,
    litPixels: analysis.litPixels,
    mismatches: analysis.mismatches,
    textColors: analysis.colors
  };
}

/**
 * Asserts the rendered frame contains the expected Hello World text.
 */
export function assertHelloWorldShape(frame) {
  const analysis = harness.assertFrameMatchesMask(frame, {
    width,
    height,
    expectedMask,
    allowedVisibleMask
  }, "Rendered frame");

  return {
    background: analysis.background,
    litPixels: analysis.litPixels,
    mismatches: analysis.mismatches,
    textColors: analysis.colors
  };
}

/**
 * Asserts the rendered frame matches a HelloWorldNES scene state.
 */
export function assertSceneFrame(frame, scene, expectedColor = initialColor) {
  const sceneMask = createSceneMask(scene);
  const analysis = harness.assertSingleColorFrameMask(frame, {
    width,
    height,
    expectedMask: sceneMask
  }, undefined, "Rendered frame");

  assert(
    analysis.actualColor === expectedColor.rgb,
    `Expected ${expectedColor.name} ${hexColor(expectedColor.rgb)}, got ${hexColor(analysis.actualColor)}`
  );

  return {
    background: analysis.background,
    colors: analysis.colors,
    litPixels: analysis.litPixels
  };
}

/**
 * Asserts the underline is visible under exactly one target word.
 */
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

/**
 * Asserts the HelloWorldNES text is rendered in the expected color.
 */
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
