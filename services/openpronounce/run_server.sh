#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH=/data/thanhnd17/local_root/usr/bin:$PATH
export LD_LIBRARY_PATH=/data/thanhnd17/local_root/usr/lib/x86_64-linux-gnu:/data/thanhnd17/local_root/usr/lib/x86_64-linux-gnu/pulseaudio:$LD_LIBRARY_PATH
export ESPEAK_DATA_PATH=/data/thanhnd17/local_root/usr/lib/x86_64-linux-gnu/espeak-ng-data
export PHONEMIZER_ESPEAK_LIBRARY=/data/thanhnd17/local_root/usr/lib/x86_64-linux-gnu/libespeak-ng.so.1
export OPENPRONOUNCE_DEVICE=cpu
export OPENPRONOUNCE_TTS=espeak
export PULSE_SERVER=""
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export PYTHONPATH=$DIR

HOST="${OPENPRONOUNCE_HOST:-127.0.0.1}"
PORT="${OPENPRONOUNCE_PORT:-8000}"

echo "Starting OpenPronounce service on $HOST:$PORT..."
exec /data/thanhnd17/thanhnd-venv/bin/uvicorn server:app --app-dir "$DIR" --host "$HOST" --port "$PORT"
