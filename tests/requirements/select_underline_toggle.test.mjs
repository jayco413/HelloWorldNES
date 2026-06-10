import {
  assert,
  assertTextColor,
  assertUnderlineTarget,
  Controller,
  createBootedNes,
  initialColor,
  tapButton
} from "../lib/nes_test_utils.mjs";

const system = createBootedNes();

assertTextColor(system.getFrame(), initialColor);
let underlineColor = assertUnderlineTarget(system.getFrame(), "Hello");
assert(underlineColor === initialColor.rgb, "Initial underline under Hello should use the current text color");

let frame = tapButton(system, Controller.BUTTON_SELECT);
assertTextColor(frame, initialColor);
underlineColor = assertUnderlineTarget(frame, "World");
assert(underlineColor === initialColor.rgb, "Underline under World should use the current text color");

frame = tapButton(system, Controller.BUTTON_SELECT);
assertTextColor(frame, initialColor);
underlineColor = assertUnderlineTarget(frame, "Hello");
assert(underlineColor === initialColor.rgb, "Underline under Hello should return after the second Select press");

console.log("Select underline requirement passed: Select toggles underline between Hello and World.");
