# HelloWorldNES Progress and NES Notes

## Progress Log

- 2026-06-10: Created the requested lowercase `code`, `build`, and project tooling layout.
- 2026-06-10: Installed the cc65 snapshot; `ca65` and `ld65` are used to assemble and link the ROM.
- 2026-06-10: Installed JSNES; it is the open-source emulator used by both the browser runner and the automated test.
- 2026-06-10: Implemented a mapper 0 / NROM-128 NES ROM in `code/main.asm`.
- 2026-06-10: Added `build_and_run.bat`, PowerShell build/test/run scripts, and an emulator HTML runner generated into `build/run.html`.
- 2026-06-10: Verified `build_and_run.bat`; it builds `build/hello_world.nes`, runs the JSNES framebuffer test, and opens the generated emulator runner.
- 2026-06-10: Installed global npm packages `puppeteer@25.1.0` and `selenium-webdriver@4.44.0`.
- 2026-06-10: Added a Puppeteer browser test that opens `build/run.html` in headless Chrome and verifies the emulator canvas pixels.
- 2026-06-10: Added local Bootstrap for the browser runner, a framed debugger UI, runtime controls, ROM metrics, input log, and a controller visual that reflects buttons sent to JSNES.
- 2026-06-10: Fixed the runner grid and controller sizing so the two-column debug layout keeps right-side padding and has no horizontal overflow at desktop width.
- 2026-06-10: Changed the ROM so `Hello World` starts green, Left cycles backward through ROYGBIV, and Right cycles forward through ROYGBIV with wrapping.
- 2026-06-10: Split tests into requirement-focused scripts under `tests/requirements`, with shared helpers under `tests/lib`, similar to separate test classes in a C# test project.
- 2026-06-10: Added Select behavior: underline starts under `Hello`, toggles to `World` on Select, and toggles back on the next Select press.
- 2026-06-10: Added Up/Down behavior: the currently underlined word moves vertically, boundary presses disable input, and the word follows a return path back to its original position before input is enabled again.
- 2026-06-10: Added requirement tests for Up movement, Down movement, moving `World` after Select, top-boundary return/input lock, and bottom-boundary return/input lock.
- 2026-06-10: Installed the INL Retro-Prog Windows driver and verified the INL host tool can connect to the USB cartridge programmer.
- 2026-06-10: Identified the inserted cartridge as a 512 KB mapper-30 flash cart with CHR-RAM, backed up its original contents to `build/cart_mapper30_full_backup_before_hello_world.nes`, built a mapper-30 cartridge image, flashed it, and verified the readback byte-for-byte.
- 2026-06-10: Added `docs/inl-retro-prog-guide.md` with detailed device identification, driver notes, mapper-30 backup/flash/verify commands, restore instructions, and troubleshooting guidance.
- 2026-06-10: Moved reusable NES development tooling to `C:\CodexWorkspace\Tools\NES Development` so future NES games can share cc65, JSNES, Bootstrap, Puppeteer, emulator templates, INL Retro-Prog tooling, and the PowerShell wrappers.

## How This Project Builds

- Source code lives in `code/main.asm`.
- Linker memory layout lives in `code/nes.cfg`.
- The ROM output is `build/hello_world.nes`.
- The mapper-30 cartridge build artifacts are `build/hello_world_mapper30_bank.bin`, `build/hello_world_mapper30_prg.bin`, and `build/hello_world_mapper30.nes`.
- Shared NES tools live in `C:\CodexWorkspace\Tools\NES Development`; set `NES_DEV_TOOLS` to override that location for tests.
- The emulator page is generated from `C:\CodexWorkspace\Tools\NES Development\emulator\runner.template.html` into `build/run.html`.
- `build_and_run.bat` builds the ROM, runs the emulator and browser automated tests, then opens `build/run.html` in the default browser.

## NES Development Lessons

- A basic `.nes` file starts with a 16-byte iNES header. This project declares one 16 KB PRG ROM bank, one 8 KB CHR ROM bank, and mapper 0.
- NROM-128 uses one 16 KB PRG ROM bank. The NES mirrors it into both `$8000-$BFFF` and `$C000-$FFFF`, so the linker places code at `$C000` and vectors at `$FFFA-$FFFF`.
- The CPU reset vector must point at the reset routine. Without valid vectors, the emulator has no stable place to begin execution.
- PPU registers are memory-mapped at `$2000-$2007`. The program waits for vblank twice, disables rendering while writing VRAM, clears the nametable, writes palette data, writes text tile IDs, then enables background rendering.
- Background text on the NES is tile-based. `Hello World` is represented by tile IDs in the nametable, and the letter shapes live in CHR ROM as 8x8 bitplane graphics.
- Palette `$0F` is black. The text uses background palette entry 1 at `$3F01`, starting with NES color `$2A` for green.
- The rainbow table is stored as ROYGBIV palette indices: red `$12`, orange `$21`, yellow `$2C`, green `$2A`, blue `$27`, indigo `$26`, violet `$25`.
- After writing palette RAM at `$3Fxx`, restore `PPUCTRL` nametable bits and scroll. Palette writes go through `PPUADDR`, and leaving the render address pointed at palette space can blank the expected nametable output in emulators and on hardware-sensitive code.
- Moving text in this ROM is done by erasing and redrawing only the affected word and underline tiles during vblank. That keeps the write count small enough for hardware-oriented timing instead of clearing the whole nametable every frame.
- The topmost and bottommost tile rows are poor gameplay targets in the JSNES framebuffer and can be fragile on real displays because of overscan. This ROM keeps movable words between tile rows 1 and 27 so both the word and underline stay fully visible.
- Input lock is easiest to reason about as a game state: the controller is still read each frame, but gameplay input handlers are skipped until the return animation clears the lock. That prevents held buttons from being applied immediately after the lock ends.
- Retail NROM cartridges are not writable; INL/NESmaker-style flash cartridges often use mapper 30 with 512 KB PRG flash and CHR-RAM. A game built for CHR-ROM must copy its tile data into CHR-RAM at boot before it will display correctly on that board.
- Mapper-30 boards map a switchable 16 KB bank at `$8000-$BFFF` and a fixed 16 KB bank at `$C000-$FFFF`. For this tiny game the cartridge image repeats the same fixed-bank program into all 32 banks so the reset vector is present in the final fixed bank.
- Always make a full cartridge backup before flashing. The first NROM write attempt was the wrong mapper and failed safely after erase/program setup; the full mapper-30 backup made recovery possible.
- Hardware programmer commands can hang in polling loops. Use `C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1` for bounded INL operations because it captures logs and kills `inlretro.exe` if the timeout is exceeded.
- Automated testing can boot a ROM in a headless emulator and compare the framebuffer against expected pixels. This catches header, mapper, PPU setup, CHR, palette, and nametable mistakes.
- A browser-level test is still useful after a ROM-level test because it validates the generated HTML runner, script loading, canvas updates, and installed browser integration.
