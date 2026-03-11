#!/bin/bash
set -e

cd "$(dirname "$0")/src"
make clean
make
cp rom ../area/rom
cd ..
echo "Build complete. Binary copied to area/rom."
