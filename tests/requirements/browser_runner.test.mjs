import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import {
  assert,
  expectedMask,
  initialColor,
  nesToolsRoot,
  rainbow,
  root,
  runnerPath
} from "../lib/nes_test_utils.mjs";
import { height, width } from "../hello_expectations.mjs";

const browserPackagePath = path.join(nesToolsRoot, "browser-test", "package.json");
const requireFromBrowserTools = createRequire(browserPackagePath);
const puppeteer = requireFromBrowserTools("puppeteer-core");

function findBrowserExecutable() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Microsoft\\Edge\\Application\\msedge.exe")
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

assert(fs.existsSync(runnerPath), `Missing emulator runner: ${runnerPath}`);

const executablePath = findBrowserExecutable();
assert(executablePath, "No Chrome or Edge executable found for the Puppeteer browser test");

const pageErrors = [];
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--allow-file-access-from-files", "--disable-gpu", "--no-sandbox"]
});

function rgbToArray(rgb) {
  return [(rgb >> 16) & 0xff, (rgb >> 8) & 0xff, rgb & 0xff];
}

try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => pageErrors.push(error.message || String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      pageErrors.push(message.text());
    }
  });

  const maskArray = Array.from(expectedMask);
  await page.goto(pathToFileURL(runnerPath).href, { waitUntil: "load" });
  await page.waitForFunction(({ expectedMask, width, height, expectedRgb }) => {
    const canvas = document.getElementById("screen");
    const context = canvas && canvas.getContext("2d");
    if (!context) {
      return false;
    }

    const data = context.getImageData(0, 0, width, height).data;
    let litPixels = 0;
    let mismatches = 0;
    for (let pixel = 0; pixel < expectedMask.length; pixel += 1) {
      const offset = pixel * 4;
      const isExpected = expectedMask[pixel] === 1;
      const isExpectedColor =
        data[offset] === expectedRgb[0] &&
        data[offset + 1] === expectedRgb[1] &&
        data[offset + 2] === expectedRgb[2];

      if (isExpected) {
        if (isExpectedColor) {
          litPixels += 1;
        } else {
          mismatches += 1;
        }
      }
    }

    return litPixels > 0 && mismatches === 0;
  }, { timeout: 5000 }, {
    expectedMask: maskArray,
    width,
    height,
    expectedRgb: rgbToArray(initialColor.rgb)
  });

  const inputResult = await page.evaluate(({ blueRgb }) => {
    const button = document.querySelector('[data-nes-button="RIGHT"]');
    document.dispatchEvent(new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "ArrowRight",
      key: "ArrowRight"
    }));
    const down = button.classList.contains("is-pressed") &&
      window.__nesDebugState.pressedButtons.includes("RIGHT");

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            code: "ArrowRight",
            key: "ArrowRight"
          }));

          const canvas = document.getElementById("screen");
          const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
          let bluePixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === blueRgb[0] && data[i + 1] === blueRgb[1] && data[i + 2] === blueRgb[2]) {
              bluePixels += 1;
            }
          }

          resolve({
            down,
            up: !button.classList.contains("is-pressed") &&
              !window.__nesDebugState.pressedButtons.includes("RIGHT"),
            bluePixels,
            lastInput: window.__nesDebugState.lastInput,
            status: document.getElementById("status")?.textContent || ""
          });
        });
      });
    });
  }, { blueRgb: rgbToArray(rainbow[4].rgb) });

  assert(pageErrors.length === 0, `Browser runner emitted errors: ${pageErrors.join("; ")}`);
  assert(inputResult.status === "", `Browser runner status error: ${inputResult.status}`);
  assert(inputResult.down, "Controller visual did not show Right pressed for ArrowRight");
  assert(inputResult.up, "Controller visual did not release Right after ArrowRight keyup");
  assert(inputResult.lastInput.includes("RIGHT up"), `Unexpected last input text: ${inputResult.lastInput}`);
  assert(inputResult.bluePixels > 0, "Browser runner did not send Right to the emulator and render blue text");

  console.log("Browser runner requirement passed: page renders green text and routes Right input to the ROM.");
} finally {
  await browser.close();
}
