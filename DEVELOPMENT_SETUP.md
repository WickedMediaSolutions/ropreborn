# ROM MUD 2.4 Development Environment Setup (Linux/Chromebook Penguin)

## Current Environment

- **Platform**: Linux (Chromebook Penguin)
- **Runtime**: Native host process (no Docker)
- **Default Port**: `4000`
- **Code Paths**: `src/`, `area/`, `startup`

---

## Native Build & Run

### 1) Build the server binary

```bash
cd src
make -f Makefile.linux clean
make -f Makefile.linux rom
cp rom ../area/rom
```

### 2) Start the server loop

```bash
./startup
```

The `startup` script rotates logs and restarts the server process unless `shutdown.txt` exists.

### 3) Connect a client

```bash
telnet localhost 4000
```

---

## Logs & Process Checks (Native)

```bash
# Recent logs
ls -1 log | tail

# Tail latest server log
tail -f log/*.log

# Confirm listener on port 4000
ss -ltnp | grep :4000
```

---

## Known Build Compatibility Note

If compilation fails on modern Linux due to old system prototypes, ensure your local branch includes current compatibility fixes in `src/comm.c` (legacy `gettimeofday` declaration removed for Linux builds).

---

## Development Workflow

1. Edit C sources in `src/`
2. Rebuild with `make -f Makefile.linux rom`
3. Copy binary to `area/rom`
4. Restart via `shutdown` in-game, then run `./startup` again
5. Validate behavior and logs in `log/`

---

**Last updated**: March 4, 2026
**Environment target**: Linux (Chromebook Penguin), no Docker
