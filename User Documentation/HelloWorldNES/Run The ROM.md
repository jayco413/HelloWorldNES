# Run The ROM

From the repository root, run:

```powershell
.\run.bat
```

That builds the ROM, runs the requirement tests, generates `build\run.html`, and opens the browser emulator runner.

To build and test without opening the browser runner:

```powershell
.\scripts\build.ps1
.\scripts\test.ps1 -SkipBuild
```

Generated ROMs, maps, debug files, browser runners, hardware backups, readbacks, and logs are written under `build\` and are not committed.
