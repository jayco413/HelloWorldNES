# HelloWorldNES Project Guidelines

## Tooling

- Reusable NES development tools live in `C:\CodexWorkspace\Tools\NES Development`.
- Do not add project-local copies of cc65, JSNES, browser-test dependencies, Bootstrap, INL Retro-Prog, or shared PowerShell wrappers.
- Use `NES_DEV_TOOLS` only as an override for test/runtime resolution when the shared tools folder is intentionally relocated.

## Source And Build Layout

- Keep NES source under `src/`.
- Keep linker configuration under `config/`.
- Keep game-owned source assets under `assets/`.
- Keep project-local shared-tool wrappers under `scripts/`.
- Keep generated ROMs, maps, debug files, object files, cartridge images, hardware readbacks, and logs under `build/`.
- Keep `build/` ignored by Git; do not commit generated ROMs or cartridge backups.
- The normal emulator build is mapper 0 / NROM from `src/main.asm` and `config/nrom.cfg`.
- The mapper-30 raw PRG build uses `config/mapper30_prg.cfg` and the shared mapper-30 build script.

## Validation

- Use `.\scripts\build.ps1` to build.
- Use `.\scripts\test.ps1 -SkipBuild` after a successful build to run requirement tests.
- Use `.\run.bat` or `.\scripts\run.ps1` to build, test, generate the browser runner, and open it.
- Requirement tests live under `tests/requirements/`.
- HelloWorldNES-specific test adapters and assertions live under `tests/lib/`.
- Reusable emulator, controller, mask, and browser harness code lives in the shared NES tools folder, not this repository.

## Cartridge Programming

- Treat flash operations as hardware-changing actions.
- Always back up a cartridge before writing to it.
- Follow `C:\CodexWorkspace\Tools\Shared Guidelines\NES_INL_RETRO_PROG_GUIDE.md` for shared INL Retro-Prog and mapper-30 cartridge procedures.
- Use `.\scripts\build_mapper30.ps1` to create the HelloWorldNES mapper-30 artifacts.
- Use `.\scripts\flash_mapper30.ps1` only after validation requirements are satisfied; the shared flash script creates a backup before writing and verifies the readback afterward.
- Do not run raw `inlretro.exe` for normal project workflows.
- Verify flash readbacks byte-for-byte before treating a hardware flash as successful.
- Keep HelloWorldNES-specific hardware evidence in `Project Specific Guidelines/HELLO_WORLD_NES_HARDWARE_RECORD.md`.
