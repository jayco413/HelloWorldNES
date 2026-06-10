import {
  assertSceneFrame,
  Controller,
  createBootedNes,
  tapButton
} from "../lib/hello_world_test_utils.mjs";

const system = createBootedNes();

assertSceneFrame(system.getFrame(), {
  helloRow: 14,
  worldRow: 14,
  underlinedWord: "Hello"
});

const frame = tapButton(system, Controller.BUTTON_UP);
assertSceneFrame(frame, {
  helloRow: 13,
  worldRow: 14,
  underlinedWord: "Hello"
});

console.log("Up input requirement passed: Up moves the currently underlined word up one tile row.");
