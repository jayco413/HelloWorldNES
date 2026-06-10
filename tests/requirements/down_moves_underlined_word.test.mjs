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

const frame = tapButton(system, Controller.BUTTON_DOWN);
assertSceneFrame(frame, {
  helloRow: 15,
  worldRow: 14,
  underlinedWord: "Hello"
});

console.log("Down input requirement passed: Down moves the currently underlined word down one tile row.");
