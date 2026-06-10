# HelloWorldNES Hardware Record

This file records HelloWorldNES-specific hardware evidence. Reusable INL Retro-Prog and shared mapper-30 cartridge workflow rules belong in `C:\CodexWorkspace\Tools\Shared Guidelines\NES_INL_RETRO_PROG_GUIDE.md`.

## 2026-06-10 Shared Mapper-30 Cartridge Flash

- The inserted cartridge was identified as a 512 KB mapper-30 flash cartridge with CHR-RAM.
- The original cartridge contents were backed up before flashing HelloWorldNES.
- Backup path: `build\cart_mapper30_full_backup_before_hello_world.nes`.
- Flashed raw PRG image: `build\hello_world_mapper30_prg.bin`.
- Programmer verify readback: `build\cart_mapper30v2_verify_after_hello_world.bin`.
- Verified SHA-256 for the flashed PRG and readback: `3ED00BA26032B3D28577EF9E252A994DC1B1731E85716C4970E5DDCB16E86BEB`.

## Restore Note

The original backup includes a 16-byte iNES header. Extract the 512 KB raw PRG payload before using the mapper-30 v2 flash command to restore it.
