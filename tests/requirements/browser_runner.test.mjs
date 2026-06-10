import {
  assertBrowserRunnerRendersMaskAndRoutesKeyboardInput,
  expectedMask,
  initialColor,
  rainbow,
  rgbToArray,
  runnerPath
} from "../lib/hello_world_test_utils.mjs";
import { height, width } from "../hello_expectations.mjs";

await assertBrowserRunnerRendersMaskAndRoutesKeyboardInput({
  runnerPath,
  expectedMask,
  width,
  height,
  initialRgb: rgbToArray(initialColor.rgb),
  key: "ArrowRight",
  code: "ArrowRight",
  buttonName: "RIGHT",
  inputRgb: rgbToArray(rainbow[4].rgb)
});

console.log("Browser runner requirement passed: page renders green text and routes Right input to the ROM.");
