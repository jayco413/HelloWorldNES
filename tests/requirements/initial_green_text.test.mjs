import { assertTextColor, createBootedNes, initialColor } from "../lib/nes_test_utils.mjs";

const system = createBootedNes();
assertTextColor(system.getFrame(), initialColor);

console.log("Initial color requirement passed: Hello World starts green.");
