# HelloWorldNES

## Game Manual

HelloWorldNES is a small NES ROM that displays `Hello World` in colored text. It demonstrates controller input, palette changes, word selection, vertical movement, and boundary-return behavior.

Controls:

- Left: cycle the text color backward through ROYGBIV.
- Right: cycle the text color forward through ROYGBIV.
- Select: toggle the underline between `Hello` and `World`.
- Up: move the underlined word up one tile row.
- Down: move the underlined word down one tile row.

`Hello` starts underlined and the text starts green. When the selected word reaches the top or bottom movement boundary, input temporarily locks while the word returns to its starting row.

## How to Run

Requirements:

- PowerShell
- Node.js and npm for JSNES and browser tests
- Chrome or Edge for the Puppeteer browser runner test
- Shared NES tools at `C:\CodexWorkspace\Tools\NES Development`

Set `NES_DEV_TOOLS` only if the shared NES tools folder is intentionally relocated.

From the repository root, build, test, generate the browser runner, and open it:

```powershell
.\run.bat
```

To build and test without opening the browser runner:

```powershell
.\scripts\build.ps1
.\scripts\test.ps1 -SkipBuild
```

The normal emulator ROM is generated at `build\hello_world.nes`. Generated files under `build\` are intentionally ignored by Git.

## Code Layout

- `src\main.asm`: NES program source.
- `config\nrom.cfg`: mapper 0 / NROM linker configuration.
- `config\mapper30_prg.cfg`: mapper-30 raw PRG linker configuration.
- `assets`: game-owned source assets.
- `scripts`: project-local wrappers around shared NES tools.
- `tests\requirements`: requirement-focused ROM and browser runner tests.
- `tests\lib`: HelloWorldNES-specific test assertions and adapters.
- `User Documentation`: additional user-facing gameplay and run documentation.
- `Project Specific Guidelines`: project-local guidance and hardware evidence for future agents.
