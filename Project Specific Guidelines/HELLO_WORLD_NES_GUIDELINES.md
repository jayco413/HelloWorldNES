# HelloWorldNES Project Guidelines

## Tooling

- Reusable NES development tools live in `C:\CodexWorkspace\Tools\NES Development`.
- Do not add project-local copies of cc65, JSNES, browser-test dependencies, Bootstrap, INL Retro-Prog, or shared PowerShell wrappers.
- Use `NES_DEV_TOOLS` only as an override for test/runtime resolution when the shared tools folder is intentionally relocated.

## Source And Build Layout

- Keep NES source under `code/`.
- Keep generated ROMs, maps, debug files, object files, cartridge images, hardware readbacks, and logs under `build/`.
- Keep `build/` ignored by Git; do not commit generated ROMs or cartridge backups.
- The normal emulator build is mapper 0 / NROM from `code/main.asm` and `code/nes.cfg`.

## Validation

- Use `C:\CodexWorkspace\Tools\NES Development\scripts\build.ps1 -ProjectRoot .` to build.
- Use `C:\CodexWorkspace\Tools\NES Development\scripts\test.ps1 -ProjectRoot . -SkipBuild` after a successful build to run requirement tests.
- Requirement tests live under `tests/requirements/`; shared test helpers live under `tests/lib/`.

## Cartridge Programming

- Treat flash operations as hardware-changing actions.
- Always back up a cartridge before writing to it.
- Use `C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1` for INL Retro-Prog commands so stuck programmer processes are bounded by a timeout.
- Do not run raw `inlretro.exe` for normal project workflows.
- Verify flash readbacks byte-for-byte before treating a hardware flash as successful.
