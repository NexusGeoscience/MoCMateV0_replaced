#!/usr/bin/env bash
# Vendors the subscription Lambda's Python dependencies for the Lambda runtime
# (python3.12, x86_64). Run before `terraform apply`.
set -euo pipefail
cd "$(dirname "$0")"
rm -rf vendor
pip install \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  --target vendor \
  -r requirements.txt
