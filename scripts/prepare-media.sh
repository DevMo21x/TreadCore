#!/usr/bin/env bash
set -euo pipefail

# Prepare MEDIA_DIR and copy existing public assets into it (one-time migration)
# Usage: MEDIA_DIR=/tmp/treadmill-media ./scripts/prepare-media.sh

MEDIA_DIR=${MEDIA_DIR:-"$(pwd)/media"}

echo "Using MEDIA_DIR=$MEDIA_DIR"
mkdir -p "$MEDIA_DIR/videos" "$MEDIA_DIR/images"

if [ -d "public/videos" ]; then
  echo "Copying public/videos -> $MEDIA_DIR/videos"
  cp -a public/videos/. "$MEDIA_DIR/videos/" || true
fi

if [ -d "public/images" ]; then
  echo "Copying public/images -> $MEDIA_DIR/images"
  cp -a public/images/. "$MEDIA_DIR/images/" || true
fi

echo "Setting permissions for $MEDIA_DIR"
chmod -R u+rwX "$MEDIA_DIR"

echo "Resulting files:"
ls -la "$MEDIA_DIR" | sed -n '1,200p'

echo "Done"

chmod +x ./scripts/upload-sample.sh ./scripts/verify-media.sh || true
