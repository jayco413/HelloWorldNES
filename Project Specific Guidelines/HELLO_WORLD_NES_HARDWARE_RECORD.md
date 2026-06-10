# HelloWorldNES Hardware Record

This file records HelloWorldNES-specific hardware evidence. Reusable INL Retro-Prog and shared mapper-30 cartridge workflow rules belong in `C:\CodexWorkspace\Tools\Shared Guidelines\NES_INL_RETRO_PROG_GUIDE.md`.

## Current Cartridge State

As of 2026-06-10, the shared mapper-30 cartridge is intentionally flashed with the mapper-30 save test image prepared during the saved-game guideline experiment, not the HelloWorldNES game image.

- Current flashed raw PRG image: `build\save-experiment\mapper30_flash_save_test_512k_prg.bin`.
- Current flashed image SHA-256: `99126525AE04B5AD22C7B3A76E33A4F184247E8CE51598A34B9EE553AB8C6CCE`.
- Programmer verify readback: `build\save-experiment\cart_mapper30_verify_after_flash_save_test.bin`.
- Human real-NES save-test result: pending.
- Post-console-run byte-level readback: pending; perform only if the cartridge is reconnected after the human NES test and readback verification is requested.

To restore HelloWorldNES to the cartridge, rebuild if needed and run:

```powershell
.\scripts\flash_mapper30.ps1 -ImagePath "build\hello_world_mapper30_prg.bin"
```

## 2026-06-10 Shared Mapper-30 Cartridge Flash

- The inserted cartridge was identified as a 512 KB mapper-30 flash cartridge with CHR-RAM.
- The original cartridge contents were backed up before flashing HelloWorldNES.
- Backup path: `build\cart_mapper30_full_backup_before_hello_world.nes`.
- Flashed raw PRG image: `build\hello_world_mapper30_prg.bin`.
- Programmer verify readback: `build\cart_mapper30v2_verify_after_hello_world.bin`.
- Verified SHA-256 for the flashed PRG and readback: `3ED00BA26032B3D28577EF9E252A994DC1B1731E85716C4970E5DDCB16E86BEB`.

## Restore Note

Backups made by the dump workflow include a 16-byte iNES header. Extract the 512 KB raw PRG payload before using a mapper-30 v2 flash command directly. Prefer `.\scripts\flash_mapper30.ps1` for normal restore work because it creates a fresh backup and verifies readback.
