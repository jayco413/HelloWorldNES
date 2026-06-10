import { assertHelloWorldShape, createBootedNes } from "../lib/nes_test_utils.mjs";

const system = createBootedNes();
assertHelloWorldShape(system.getFrame());

console.log("Text rendering requirement passed: Hello World pixels match the expected tile mask.");
