import {
  assertSceneFrame,
  Controller,
  createBootedNes,
  holdButton,
  initialColor,
  tapButton
} from "../lib/hello_world_test_utils.mjs";

const system = createBootedNes();

for (let row = 15; row <= 27; row += 1) {
  const frame = tapButton(system, Controller.BUTTON_DOWN);
  assertSceneFrame(frame, {
    helloRow: row,
    worldRow: 14,
    underlinedWord: "Hello"
  });
}

holdButton(system, Controller.BUTTON_DOWN, 1);
let frame = system.runFrames(1);
assertSceneFrame(frame, {
  helloRow: 26,
  helloCol: 6,
  worldRow: 14,
  underlinedWord: "Hello"
});

system.nes.buttonDown(1, Controller.BUTTON_RIGHT);
system.nes.buttonDown(1, Controller.BUTTON_SELECT);
frame = system.runFrames(3);
system.nes.buttonUp(1, Controller.BUTTON_RIGHT);
system.nes.buttonUp(1, Controller.BUTTON_SELECT);

assertSceneFrame(frame, {
  helloRow: 23,
  helloCol: 8,
  worldRow: 14,
  underlinedWord: "Hello"
}, initialColor);

frame = system.runFrames(20);
assertSceneFrame(frame, {
  helloRow: 14,
  helloCol: 10,
  worldRow: 14,
  underlinedWord: "Hello"
}, initialColor);

frame = tapButton(system, Controller.BUTTON_SELECT);
assertSceneFrame(frame, {
  helloRow: 14,
  helloCol: 10,
  worldRow: 14,
  underlinedWord: "World"
}, initialColor);

console.log("Bottom boundary requirement passed: offscreen Down locks input, spirals home, then enables input again.");
