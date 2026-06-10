import {
  assertSceneFrame,
  Controller,
  createBootedNes,
  holdButton,
  initialColor,
  rainbow,
  tapButton
} from "../lib/nes_test_utils.mjs";

const system = createBootedNes();

for (let row = 13; row >= 1; row -= 1) {
  const frame = tapButton(system, Controller.BUTTON_UP);
  assertSceneFrame(frame, {
    helloRow: row,
    worldRow: 14,
    underlinedWord: "Hello"
  });
}

holdButton(system, Controller.BUTTON_UP, 1);
let frame = system.runFrames(1);
assertSceneFrame(frame, {
  helloRow: 2,
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
  helloRow: 5,
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

frame = tapButton(system, Controller.BUTTON_RIGHT);
assertSceneFrame(frame, {
  helloRow: 14,
  helloCol: 10,
  worldRow: 14,
  underlinedWord: "Hello"
}, rainbow[4]);

console.log("Top boundary requirement passed: offscreen Up locks input, spirals home, then enables input again.");
