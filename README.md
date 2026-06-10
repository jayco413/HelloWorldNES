# HelloWorldNES

A small NES ROM that renders `Hello World`, cycles text colors with Left/Right, toggles the active word with Select, and moves the active word vertically with Up/Down before returning it to the starting row at the screen boundaries.

## Requirements

- PowerShell
- Node.js and npm for JSNES and browser tests
- Chrome or Edge for the Puppeteer browser runner test
- Shared NES tools at `C:\CodexWorkspace\Tools\NES Development`

Set `NES_DEV_TOOLS` if the shared NES tools folder is intentionally relocated.

## Build And Test

From the repository root:

```powershell
.\build_and_run.bat
```

To run build and tests without opening the browser runner:

```powershell
& "C:\CodexWorkspace\Tools\NES Development\scripts\build.ps1" -ProjectRoot .
& "C:\CodexWorkspace\Tools\NES Development\scripts\test.ps1" -ProjectRoot . -SkipBuild
```

The normal emulator ROM is generated at `build\hello_world.nes`. Generated files under `build\` are intentionally ignored by Git.

## Layout

- `code\main.asm`: NES program source.
- `code\nes.cfg`: mapper 0 / NROM linker configuration.
- `tests\requirements`: requirement-focused ROM and browser runner tests.
- `tests\lib`: shared test helpers.
- `docs\inl-retro-prog-guide.md`: INL Retro-Prog backup, flash, verify, and restore workflow notes.
- `Project Specific Guidelines`: project-local guidance for future agents.

## Hardware Note

The INL Retro-Prog workflow is documented, but flashing a cartridge changes external hardware state. Back up first, use the bounded shared wrapper, and verify readbacks byte-for-byte.
