#!/usr/bin/env bash
# simple wrapper to run ffmpeg to replace audio
VIDEO="$1"
AUDIO="$2"
OUT="$3"
ffmpeg -y -i "$VIDEO" -i "$AUDIO" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "$OUT"
