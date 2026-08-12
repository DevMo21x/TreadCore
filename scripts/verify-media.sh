#!/usr/bin/env bash
set -euo pipefail

# Verify media serving and Range support.
# Usage: SERVER=http://localhost:3000 CATEGORY=Mix FILE=shey.mp4 MEDIA_DIR=/tmp/treadmill-media ./scripts/verify-media.sh

SERVER=${SERVER:-http://localhost:3000}
CATEGORY=${CATEGORY:-Mix}
FILE=${FILE:-shey.mp4}
MEDIA_DIR=${MEDIA_DIR:-"$(pwd)/media"}

echo "Verifying media for $CATEGORY/$FILE against $SERVER and MEDIA_DIR=$MEDIA_DIR"

echo "Checking file on disk..."
if [ -f "$MEDIA_DIR/videos/$CATEGORY/$FILE" ]; then
  echo "Found: $MEDIA_DIR/videos/$CATEGORY/$FILE"
else
  echo "Missing file on disk: $MEDIA_DIR/videos/$CATEGORY/$FILE" >&2
fi

URL="$SERVER/api/media/videos/$(python3 - <<PY
import urllib.parse
print(urllib.parse.quote('$CATEGORY'))
PY
)/$(python3 - <<PY
import urllib.parse
print(urllib.parse.quote('$FILE'))
PY
)"

echo "URL: $URL"

echo "HEAD / metadata:"
curl -I "$URL" || true

echo "Range request (expect 206):"
curl -H "Range: bytes=0-1023" -i "$URL" | sed -n '1,40p' || true

echo "If the above shows '200 OK' for HEAD and '206 Partial Content' for the Range request, seeking should work." 
