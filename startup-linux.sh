#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AREA_DIR="$ROOT_DIR/area"
SRC_BIN="$ROOT_DIR/src/rom"
AREA_BIN="$AREA_DIR/rom"
PORT="${1:-4000}"

if [[ -x "$SRC_BIN" ]]; then
  ROM_BIN="$SRC_BIN"
elif [[ -x "$AREA_BIN" ]]; then
  ROM_BIN="$AREA_BIN"
else
  echo "No ROM binary found. Build with: cd $ROOT_DIR/src && make -f Makefile.linux rom" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/log"
cd "$AREA_DIR"

rm -f shutdown.txt

echo "Starting ROM from: $ROM_BIN"
echo "Area dir: $AREA_DIR"
echo "Port: $PORT"

while true; do
  index=1000
  while [[ -f "$ROOT_DIR/log/$index.log" ]]; do
    index=$((index + 1))
  done

  logfile="$ROOT_DIR/log/$index.log"

  "$ROM_BIN" "$PORT" >"$logfile" 2>&1 || true

  if [[ -f shutdown.txt ]]; then
    rm -f shutdown.txt
    exit 0
  fi

  sleep 10
done
