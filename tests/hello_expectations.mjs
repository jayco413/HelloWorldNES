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

export function createWordMask(word, tileRow = originalWordRow, column = wordSpecs[word]?.column) {
  const spec = wordSpecs[word];
  if (!spec) {
    throw new Error(`No word spec for ${word}`);
  }

  const expectedMask = new Uint8Array(width * height);
  for (let charIndex = 0; charIndex < spec.text.length; charIndex += 1) {
    const glyph = expectedGlyphs[spec.text[charIndex]];
    if (!glyph) {
      throw new Error(`No expected glyph for ${spec.text[charIndex]}`);
    }

    for (let glyphRow = 0; glyphRow < 8; glyphRow += 1) {
      for (let col = 0; col < 8; col += 1) {
        if ((glyph[glyphRow] & (0x80 >> col)) !== 0) {
          const x = column * 8 + charIndex * 8 + col;
          const y = tileRow * 8 + glyphRow;
          expectedMask[y * width + x] = 1;
        }
      }
    }
  }

  return expectedMask;
}

export function mergeMask(target, source) {
  for (let i = 0; i < target.length; i += 1) {
    target[i] ||= source[i];
  }
  return target;
}

export function createExpectedMask() {
  const expectedMask = new Uint8Array(width * height);
  mergeMask(expectedMask, createWordMask("Hello"));
  mergeMask(expectedMask, createWordMask("World"));
  return expectedMask;
}

export function createUnderlineMask(word, row = originalWordRow, column = wordSpecs[word]?.column) {
  const mask = new Uint8Array(width * height);
  const xStart = column * 8;
  const y = (row + 1) * 8;
  for (let x = xStart; x < xStart + underlineWidth; x += 1) {
    mask[y * width + x] = 1;
  }
  return mask;
}

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

export function createAllowedVisibleMask() {
  const mask = createExpectedMask();
  for (const underlineMask of [createUnderlineMask("Hello"), createUnderlineMask("World")]) {
    mergeMask(mask, underlineMask);
  }
  return mask;
}
