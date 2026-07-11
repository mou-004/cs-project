#!/usr/bin/env sh
cd "$(dirname "$0")" || exit 1
printf '%s\n' 'Starting Sentinel Bank at http://localhost:5500'
python3 -m http.server 5500
