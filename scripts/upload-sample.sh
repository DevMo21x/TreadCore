#!/usr/bin/env bash
set -euo pipefail

# Upload a sample video + thumbnail to the admin upload endpoint.
# Usage: SERVER=http://localhost:3000 ./scripts/upload-sample.sh ./path/to/video.mp4 ./path/to/thumb.jpg "CategoryName"

SERVER=${SERVER:-http://localhost:3000}
VIDEO_PATH=${1:-./public/videos/Mix/shey.mp4}
THUMB_PATH=${2:-./public/images/Mix/shey.jpg}
CATEGORY=${3:-Mix}

echo "Uploading video=$VIDEO_PATH thumbnail=$THUMB_PATH to $SERVER/api/admin/upload (category=$CATEGORY)"

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq not found; raw response will be printed"
fi

resp=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$SERVER/api/admin/upload" \
  -F "categoryName=$CATEGORY" \
  -F "title=Automated upload" \
  -F "isVisible=true" \
  -F "video=@$VIDEO_PATH" \
  -F "thumbnail=@$THUMB_PATH")

status=$(echo "$resp" | sed -n 's/.*HTTP_STATUS:\([0-9]*\)/\1/p' | tail -n1)
body=$(echo "$resp" | sed '/HTTP_STATUS:/Q')

echo "HTTP status: $status"
if command -v jq >/dev/null 2>&1; then
  echo "$body" | jq . || echo "$body"
else
  echo "$body"
fi
