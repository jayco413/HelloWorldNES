import {
  assertSceneFrame,
  Controller,
  createBootedNes,
  tapButton
} from "../lib/hello_world_test_utils.mjs";

const system = createBootedNes();

let frame = tapButton(system, Controller.BUTTON_SELECT);
assertSceneFrame(frame, {
  helloRow: 14,
  worldRow: 14,
  underlinedWord: "World"
});

frame = tapButton(system, Controller.BUTTON_UP);
assertSceneFrame(frame, {
  helloRow: 14,
  worldRow: 13,
  underlinedWord: "World"
});

frame = tapButton(system, Controller.BUTTON_DOWN);
assertSceneFrame(frame, {
  helloRow: 14,
  worldRow: 14,
  underlinedWord: "World"
});

console.log("Selected word movement requirement passed: Up and Down move World after Select underlines it.");
