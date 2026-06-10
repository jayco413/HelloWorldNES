import path from "node:path";
import { pathToFileURL } from "node:url";

const nesToolsRoot = path.resolve(process.env.NES_DEV_TOOLS || "C:\\CodexWorkspace\\Tools\\NES Development");
const harness = await import(pathToFileURL(path.join(nesToolsRoot, "tests", "nes_test_harness.mjs")).href);

export const width = 256;
export const height = 240;
export const text = "Hello World";
export const originalWordRow = 14;
export const helloColumn = 10;
export const worldColumn = 16;
export const startX = helloColumn * 8;
export const startY = originalWordRow * 8;
export const underlineY = startY + 8;
export const helloUnderlineX = helloColumn * 8;
export const worldUnderlineX = worldColumn * 8;
export const underlineWidth = 5 * 8;

export const wordSpecs = {
  Hello: { text: "Hello", column: helloColumn },
  World: { text: "World", column: worldColumn }
};

export const expectedGlyphs = {
  H: [0x82, 0x82, 0x82, 0xfe, 0x82, 0x82, 0x82, 0x00],
  e: [0x00, 0x7c, 0x82, 0xfe, 0x80, 0x82, 0x7c, 0x00],
  l: [0x30, 0x10, 0x10, 0x10, 0x10, 0x10, 0x38, 0x00],
  o: [0x00, 0x7c, 0x82, 0x82, 0x82, 0x82, 0x7c, 0x00],
  W: [0x82, 0x82, 0x92, 0x92, 0xaa, 0xc6, 0x82, 0x00],
  r: [0x00, 0xbc, 0xc2, 0x80, 0x80, 0x80, 0x80, 0x00],
  d: [0x02, 0x02, 0x7e, 0x82, 0x82, 0x82, 0x7e, 0x00],
  " ": [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
};

/**
 * Creates the expected pixel mask for one HelloWorldNES word.
 */
export function createWordMask(word, tileRow = originalWordRow, column = wordSpecs[word]?.column) {
  const spec = wordSpecs[word];
  if (!spec) {
    throw new Error(`No word spec for ${word}`);
  }

  return harness.createTileTextMask({
    width,
    height,
    text: spec.text,
    glyphs: expectedGlyphs,
    tileRow,
    column
  });
}

/**
 * Merges lit pixels into an existing HelloWorldNES expectation mask.
 */
export function mergeMask(target, source) {
  return harness.mergeMask(target, source);
}

/**
 * Creates the expected starting HelloWorldNES text mask.
 */
export function createExpectedMask() {
  const expectedMask = new Uint8Array(width * height);
  mergeMask(expectedMask, createWordMask("Hello"));
  mergeMask(expectedMask, createWordMask("World"));
  return expectedMask;
}

/**
 * Creates the expected underline mask for one HelloWorldNES word.
 */
export function createUnderlineMask(word, row = originalWordRow, column = wordSpecs[word]?.column) {
  return harness.createHorizontalPixelLineMask({
    width,
    height,
    xStart: column * 8,
    y: (row + 1) * 8,
    pixelWidth: underlineWidth
  });
}

/**
 * Creates the expected full-scene mask for a HelloWorldNES word layout.
 */
export function createSceneMask({
  helloRow = originalWordRow,
  helloCol = helloColumn,
  worldRow = originalWordRow,
  worldCol = worldColumn,
  underlinedWord = "Hello"
} = {}) {
  const mask = new Uint8Array(width * height);
  mergeMask(mask, createWordMask("Hello", helloRow, helloCol));
  mergeMask(mask, createWordMask("World", worldRow, worldCol));

  if (underlinedWord === "Hello") {
    mergeMask(mask, createUnderlineMask("Hello", helloRow, helloCol));
  } else if (underlinedWord === "World") {
    mergeMask(mask, createUnderlineMask("World", worldRow, worldCol));
  } else {
    throw new Error(`No underline target for ${underlinedWord}`);
  }

  return mask;
}

/**
 * Creates the pixels allowed in the initial rendered frame.
 */
export function createAllowedVisibleMask() {
  const mask = createExpectedMask();
  for (const underlineMask of [createUnderlineMask("Hello"), createUnderlineMask("World")]) {
    mergeMask(mask, underlineMask);
  }
  return mask;
}
