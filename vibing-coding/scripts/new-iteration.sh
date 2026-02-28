#!/usr/bin/env sh
set -e

name="$1"
if [ -z "$name" ]; then
  echo "Usage: ./vibing-coding/scripts/new-iteration.sh \"YYYY-MM-DD-vX.Y.Z-短标题\""
  exit 1
fi

base_dir="$(cd "$(dirname "$0")/.." && pwd)"
source_dir="$base_dir/templates/iteration"
output_dir="$base_dir/iterations/$name"

if [ -e "$output_dir" ]; then
  echo "Target already exists: $output_dir"
  exit 1
fi

mkdir -p "$output_dir"
cp -R "$source_dir/." "$output_dir/"

echo "Created: $output_dir"
