import path from "node:path";
import { assertRomHeader, loadRomBytes, romPath, root } from "../lib/hello_world_test_utils.mjs";

const rom = loadRomBytes();
assertRomHeader(rom);

console.log(`ROM file requirement passed: ${path.relative(root, romPath)} is valid mapper 0 iNES.`);
