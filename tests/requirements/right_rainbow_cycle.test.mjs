import { assertTextColor, Controller, createBootedNes, rainbow, tapButton } from "../lib/hello_world_test_utils.mjs";

const system = createBootedNes();
const expectedAfterRightPresses = [
  rainbow[4],
  rainbow[5],
  rainbow[6],
  rainbow[0],
  rainbow[1],
  rainbow[2],
  rainbow[3]
];

for (const expectedColor of expectedAfterRightPresses) {
  const frame = tapButton(system, Controller.BUTTON_RIGHT);
  assertTextColor(frame, expectedColor);
}

console.log("Right input requirement passed: Right advances ROYGBIV and wraps Violet to Red.");
