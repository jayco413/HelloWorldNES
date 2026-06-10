import { assertTextColor, Controller, createBootedNes, rainbow, tapButton } from "../lib/hello_world_test_utils.mjs";

const system = createBootedNes();
const expectedAfterLeftPresses = [
  rainbow[2],
  rainbow[1],
  rainbow[0],
  rainbow[6],
  rainbow[5],
  rainbow[4],
  rainbow[3]
];

for (const expectedColor of expectedAfterLeftPresses) {
  const frame = tapButton(system, Controller.BUTTON_LEFT);
  assertTextColor(frame, expectedColor);
}

console.log("Left input requirement passed: Left reverses ROYGBIV and wraps Red to Violet.");
