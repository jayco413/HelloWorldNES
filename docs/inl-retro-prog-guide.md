# INL Retro-Prog Cartridge Programmer Guide

This document records what was discovered about the USB cartridge programmer connected to this machine, what cartridge was inserted, how the driver and tools are set up, and the exact safe workflow for backing up, flashing, verifying, and restoring the cartridge.

All commands assume they are run from the repository root:

```powershell
C:\Users\jcove\source\repos\HelloWorldNES
```

## Short Version

- The USB device is an INL Retro-Prog cartridge programmer/dumper.
- Windows sees it as USB device `VID_16C0&PID_05DC`.
- The installed driver is `libusb-win32`, service `libusb0`.
- The shared INL tool package is in `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump`.
- The host executable is `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\inlretro.exe`.
- Use `C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1` instead of running `inlretro.exe` directly. The wrapper captures logs and kills a stuck `inlretro.exe` after a timeout.
- The cartridge currently inserted was identified as a mapper-30 NES flash cartridge with 512 KB PRG flash and CHR-RAM.
- The original cartridge contents were backed up to `build\cart_mapper30_full_backup_before_hello_world.nes`.
- This project was flashed successfully to the cartridge using `build\hello_world_mapper30_prg.bin`.
- The post-flash readback was verified byte-for-byte against the expected PRG image.

## What The Device Is

The device on USB is the programmer, not the NES cartridge itself. It is an INL Retro-Prog device from Infinite NES Lives. It connects to the PC over USB and to a cartridge through the cartridge edge connector.

The software side is the INL retro-progdump package. It includes:

- A Windows host executable: `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\inlretro.exe`
- Lua scripts that know how to talk to different cartridge boards and mappers
- A Windows driver package under `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\WindowsDriverPackage`
- Source and scripts that can be modified locally

The official upstream repository used for the local copy is:

```text
https://gitlab.com/InfiniteNesLives/INL-retro-progdump
```

The cloned tool now lives under the shared NES development tools folder so other NES projects can use the same programmer setup.

## What The Cartridge Appears To Be

The cartridge inserted in the programmer is not a normal retail NROM cartridge. It was detected as a mapper-30 flash cartridge.

Observed details:

- Console: NES
- Mapper: mapper 30
- PRG flash size used here: 512 KB
- CHR: CHR-RAM, not CHR-ROM
- Mirroring reported by the INL scripts: vertical
- Programmer firmware reported by the host: `2.3.x`
- PRG flash ID seen by mapper-30 detection: `01/D5`
- CHR-RAM banking test passed during mapper-30 detection

Important distinction:

- Retail NES cartridges are usually mask ROM or one-time-manufactured boards and are not writable with this workflow.
- This cartridge is a flash development cartridge. It can be erased and reprogrammed.

## Installed Windows Driver

The device initially appeared as:

```text
INL Retro-Prog
USB\VID_16C0&PID_05DC
```

After running the driver installer, Windows reported:

```text
Class: libusb-win32 Usb Devices
Service: libusb0
Status: OK
Driver provider: libusb-win32
Driver version: 1.2.6.0
```

Driver installer path:

```text
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\WindowsDriverPackage\InstallDriver.exe
```

Run it elevated if Windows does not bind the driver automatically.

To inspect the device from PowerShell:

```powershell
Get-PnpDevice -PresentOnly |
    Where-Object {
        $_.InstanceId -like '*VID_16C0&PID_05DC*' -or
        $_.FriendlyName -like '*INL*'
    } |
    Format-Table Status,Class,FriendlyName,InstanceId -AutoSize
```

To inspect the installed driver:

```powershell
Get-CimInstance Win32_PnPSignedDriver |
    Where-Object { $_.DeviceID -like '*VID_16C0&PID_05DC*' } |
    Select-Object DeviceName,DriverProviderName,DriverVersion,InfName,IsSigned
```

## Local Tooling

Important files and directories:

```text
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\inlretro.exe
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\scripts\inlretro2.lua
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\scripts\hello_mapper30_notest.lua
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\scripts\nes\mapper30v2.lua
C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1
```

Local changes made for this project:

- Added `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\scripts\hello_mapper30_notest.lua`.
- Patched `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host\scripts\nes\mapper30v2.lua` so an already-erased chip does not stop the flash flow as a false failure.
- Added `C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1` to prevent stuck programmer processes from hanging indefinitely.

If the INL tool directory is replaced with a fresh upstream copy, preserve or reapply these local changes before flashing this cart again.

## Why The Wrapper Matters

Raw `inlretro.exe` can hang in hardware polling loops if the wrong mapper is selected or USB communication stalls. That happened during early investigation with an incorrect NROM write path.

Use this wrapper:

```powershell
C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1
```

The wrapper:

- Runs `inlretro.exe` from the correct host directory.
- Redirects stdout and stderr to files in `build`.
- Enforces a timeout.
- Kills the child process on timeout.
- Cleans up any lingering `inlretro.exe` process in a `finally` block.

General shape:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1" `
    -ProjectRoot . `
    -TimeoutSeconds 120 `
    -LogName inlretro-operation.log `
    -ArgumentString '-s scripts\\inlretro2.lua -c NES -m mapper30 -x 512 -y 0'
```

The INL host expects paths relative to `C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\host` for scripts, which is why script paths begin with `scripts\\...`.

## Safe Hardware Checklist

Before any flash operation:

1. Confirm the driver is installed and the device is present.
2. Confirm the cartridge is seated firmly in the programmer.
3. Back up the cartridge before writing anything.
4. Use the correct mapper. For this cartridge, use mapper 30, not NROM.
5. Use the bounded wrapper, not raw `inlretro.exe`.
6. Do not remove the cartridge or unplug the programmer while erase, program, or verify is running.
7. Keep the verify readback file after flashing.

## Identify Or Probe The Cartridge

This command was useful for mapper-30 detection:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1" `
    -ProjectRoot . `
    -TimeoutSeconds 90 `
    -LogName inlretro-map30-test.log `
    -ArgumentString '-s scripts\\inlretro2.lua -c NES -m mapper30v2 -x 512 -y 0'
```

Expected useful output includes lines like:

```text
Successfully found and connected to INL retro-prog
Device firmware version: 2.3.x
Testing MAP30
detected RAM @ PPU $1000
PRG-ROM manf ID: 01
PRG-ROM prod ID: D5
CHR-RAM BANKING TEST PASSED
```

Note: the upstream mapper-30 v2 test path may exit with an error if optional test files under `host\ignore` are missing. The hardware-identification lines above are still useful.

## Back Up The Cartridge

The full backup that was made before flashing this project is:

```text
build\cart_mapper30_full_backup_before_hello_world.nes
```

It is an iNES file with a 16-byte header plus 512 KB PRG data.

The command that produced it:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1" `
    -ProjectRoot . `
    -TimeoutSeconds 120 `
    -LogName inlretro-map30-backup.log `
    -ArgumentString "-s scripts\\inlretro2.lua -c NES -m mapper30 -x 512 -y 0 -d $((Resolve-Path .).Path)\\build\\cart_mapper30_full_backup_before_hello_world.nes"
```

The resulting backup size was:

```text
524304 bytes = 16-byte iNES header + 524288-byte PRG image
```

Keep this backup. It is the recovery point for whatever was on the cartridge before this project was flashed.

## Build The Normal Emulator ROM

The normal emulator ROM is mapper 0 / NROM and uses CHR-ROM:

```text
build\hello_world.nes
```

Build and test it with:

```powershell
.\build_and_run.bat
```

or:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\build_and_run.ps1" `
    -ProjectRoot .
```

That path builds the ROM, runs the automated tests, and opens the browser emulator runner.

## Build The Mapper-30 Cartridge Image

The physical mapper-30 cartridge is different from the normal emulator ROM:

- It uses mapper 30, not mapper 0.
- It has CHR-RAM, not CHR-ROM.
- The game must copy its tile graphics into PPU pattern memory at boot.
- The cartridge image needs 512 KB of PRG data.

For this small game, the build creates one 16 KB bank linked for the fixed `$C000-$FFFF` region, then repeats that same bank 32 times to fill 512 KB. This keeps the reset vector present in the final fixed bank.

Current mapper-30 artifacts:

```text
build\hello_world_mapper30_bank.bin
build\hello_world_mapper30_prg.bin
build\hello_world_mapper30.nes
```

If those need to be regenerated manually, run:

```powershell
$root = (Get-Location).Path
$toolsRoot = 'C:\CodexWorkspace\Tools\NES Development'
$ca65 = Join-Path $toolsRoot 'cc65\bin\ca65.exe'
$ld65 = Join-Path $toolsRoot 'cc65\bin\ld65.exe'

& $ca65 code\main.asm `
    -o build\main_mapper30.o `
    --debug-info `
    -D CART_PRG_ONLY `
    -D CHR_RAM

& $ld65 `
    -C code\mapper30_prg.cfg `
    build\main_mapper30.o `
    -o build\hello_world_mapper30_bank.bin `
    -m build\hello_world_mapper30.map `
    --dbgfile build\hello_world_mapper30.dbg

$bank = [IO.File]::ReadAllBytes('build\hello_world_mapper30_bank.bin')
if ($bank.Length -ne 16384) {
    throw "Mapper-30 bank must be 16384 bytes, got $($bank.Length)"
}

$prg = New-Object byte[] (512 * 1024)
for ($i = 0; $i -lt 32; $i++) {
    [Array]::Copy($bank, 0, $prg, $i * $bank.Length, $bank.Length)
}
[IO.File]::WriteAllBytes('build\hello_world_mapper30_prg.bin', $prg)

$header = [byte[]](
    0x4E, 0x45, 0x53, 0x1A,
    0x20, 0x00, 0xE1, 0x10,
    0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00
)

$rom = New-Object byte[] ($header.Length + $prg.Length)
[Array]::Copy($header, 0, $rom, 0, $header.Length)
[Array]::Copy($prg, 0, $rom, $header.Length, $prg.Length)
[IO.File]::WriteAllBytes('build\hello_world_mapper30.nes', $rom)
```

The raw PRG file is what gets flashed:

```text
build\hello_world_mapper30_prg.bin
```

The `.nes` wrapper is useful for archival and emulator tooling that can support mapper 30:

```text
build\hello_world_mapper30.nes
```

JSNES does not support mapper 30, so do not use JSNES as proof that the mapper-30 `.nes` file boots. For this project, the CHR-RAM boot path was sanity-tested through a mapper-0 CHR-RAM wrapper:

```text
build\hello_world_chrram_test.nes
```

## Flash This Game To The Cartridge

The command that successfully flashed this project was:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1" `
    -ProjectRoot . `
    -TimeoutSeconds 600 `
    -LogName inlretro-map30v2-flash-retry.log `
    -ArgumentString "-s scripts\\hello_mapper30_notest.lua -c NES -m mapper30v2 -x 512 -y 0 -p $((Resolve-Path .).Path)\\build\\hello_world_mapper30_prg.bin -v $((Resolve-Path .).Path)\\build\\cart_mapper30v2_verify_after_hello_world.bin"
```

Successful output included:

```text
erasing MAP30
Programming PRG-ROM flash
Done Programming PRG-ROM flash
SUCCESS! Flash verified
```

The verify readback file is:

```text
build\cart_mapper30v2_verify_after_hello_world.bin
```

## Verify A Flash Manually

The programmer verify step already succeeded, but this PowerShell check compares the readback file against the expected PRG file again:

```powershell
$expected = [IO.File]::ReadAllBytes('build\hello_world_mapper30_prg.bin')
$actual = [IO.File]::ReadAllBytes('build\cart_mapper30v2_verify_after_hello_world.bin')

if ($expected.Length -ne $actual.Length) {
    throw "Length mismatch. Expected $($expected.Length), got $($actual.Length)"
}

$mismatches = 0
for ($i = 0; $i -lt $expected.Length; $i++) {
    if ($expected[$i] -ne $actual[$i]) {
        $mismatches++
        if ($mismatches -le 10) {
            Write-Host ("Mismatch at 0x{0:X6}: expected 0x{1:X2}, got 0x{2:X2}" -f $i, $expected[$i], $actual[$i])
        }
    }
}

if ($mismatches -ne 0) {
    throw "$mismatches mismatches found"
}

Write-Host "Flash readback matches expected PRG image."
```

Known good SHA-256 for the flashed PRG and readback:

```text
3ED00BA26032B3D28577EF9E252A994DC1B1731E85716C4970E5DDCB16E86BEB
```

You can confirm it with:

```powershell
Get-FileHash -Algorithm SHA256 build\hello_world_mapper30_prg.bin
Get-FileHash -Algorithm SHA256 build\cart_mapper30v2_verify_after_hello_world.bin
```

## Restore The Original Cartridge Backup

The original backup file includes a 16-byte iNES header. The mapper-30 v2 flash command should receive raw PRG bytes, so first extract the 512 KB PRG payload:

```powershell
$backup = [IO.File]::ReadAllBytes('build\cart_mapper30_full_backup_before_hello_world.nes')
if ($backup.Length -ne 524304) {
    throw "Unexpected backup length: $($backup.Length)"
}

$raw = New-Object byte[] ($backup.Length - 16)
[Array]::Copy($backup, 16, $raw, 0, $raw.Length)
[IO.File]::WriteAllBytes('build\cart_mapper30_full_backup_before_hello_world_prg.bin', $raw)
```

Then flash the raw backup PRG back to the cartridge:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass `
    -File "C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1" `
    -ProjectRoot . `
    -TimeoutSeconds 600 `
    -LogName inlretro-map30v2-restore.log `
    -ArgumentString "-s scripts\\hello_mapper30_notest.lua -c NES -m mapper30v2 -x 512 -y 0 -p $((Resolve-Path .).Path)\\build\\cart_mapper30_full_backup_before_hello_world_prg.bin -v $((Resolve-Path .).Path)\\build\\cart_mapper30_restore_verify.bin"
```

After restore, compare the raw backup to the restore verify file:

```powershell
$expected = [IO.File]::ReadAllBytes('build\cart_mapper30_full_backup_before_hello_world_prg.bin')
$actual = [IO.File]::ReadAllBytes('build\cart_mapper30_restore_verify.bin')

if ($expected.Length -ne $actual.Length) {
    throw "Length mismatch. Expected $($expected.Length), got $($actual.Length)"
}

for ($i = 0; $i -lt $expected.Length; $i++) {
    if ($expected[$i] -ne $actual[$i]) {
        throw ("Mismatch at 0x{0:X6}" -f $i)
    }
}

Write-Host "Restore verified."
```

## If A Programmer Process Hangs

First, prefer the wrapper so this should not happen:

```powershell
C:\CodexWorkspace\Tools\NES Development\scripts\run_inlretro.ps1
```

If a raw `inlretro.exe` process is already stuck, inspect it:

```powershell
Get-Process inlretro -ErrorAction SilentlyContinue
```

If it is clearly stale and no flash operation should still be running, kill it:

```powershell
Stop-Process -Name inlretro -Force
```

Then unplug and replug the programmer if the device stops responding, and rerun the device/driver inspection commands above.

## Troubleshooting

### Device Not Found

Check the USB device:

```powershell
Get-PnpDevice -PresentOnly |
    Where-Object {
        $_.InstanceId -like '*VID_16C0&PID_05DC*' -or
        $_.FriendlyName -like '*INL*'
    }
```

If Windows reports no driver or a failed install, rerun:

```text
C:\CodexWorkspace\Tools\NES Development\INL-retro-progdump\WindowsDriverPackage\InstallDriver.exe
```

Run it elevated.

### Wrong Mapper

The earliest NROM write attempt was wrong for this cartridge. It did not produce the final working flash. Do not use NROM for this cart.

Use mapper 30:

```text
-m mapper30v2 -x 512 -y 0
```

### Legacy Mapper-30 Write Fails

The legacy `mapper30` path could read the cartridge and make a backup, but its write path failed with a USB I/O error in this setup.

Use the local mapper-30 v2 no-test script for writes:

```text
scripts\hello_mapper30_notest.lua
```

### Already-Erased Flash

After a failed write attempt, the chip may already be erased. The local `mapper30v2.lua` patch treats that state as acceptable and continues programming.

If a future fresh tool checkout reintroduces an erase failure when the chip is already blank, compare it with the local patched script.

### Mapper-30 ROM Does Not Boot In JSNES

JSNES does not support mapper 30. That is an emulator limitation, not proof that the cart image is bad.

For browser testing, use the normal mapper-0 ROM:

```text
build\hello_world.nes
```

For validating CHR-RAM boot behavior in JSNES, use the CHR-RAM test wrapper if it exists:

```text
build\hello_world_chrram_test.nes
```

### Cartridge Does Not Boot On Real NES

Check these first:

- Confirm the flash readback matched the PRG image.
- Confirm the NES cartridge edge contacts are clean.
- Confirm the board is inserted in the correct orientation.
- Power-cycle the console after flashing.
- Confirm the game build used `-D CHR_RAM` for the physical cart.
- Confirm the cart image used 512 KB raw PRG data, not a 16-byte-header `.nes` file passed as raw PRG.

## Lessons Learned

- The programmer and the cartridge are separate things. The USB device is the INL Retro-Prog; the inserted cartridge is a mapper-30 flash cartridge.
- Always identify the mapper before writing.
- Always dump a full backup before writing.
- Mapper-30 development cartridges commonly use CHR-RAM, so a CHR-ROM emulator build is not enough for hardware.
- A tiny 16 KB fixed-bank program can be repeated across all mapper-30 PRG banks to make a simple 512 KB flash image.
- Programmer tools can hang when hardware is in an unexpected state, so bounded wrappers are part of the workflow, not just convenience.
- Readback verification is the final authority after flashing.
