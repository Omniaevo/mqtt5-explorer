#!/bin/bash

echo '>> Cleaning...'
set +e
rm -rf com.omniaevo.mqtt5-explorer.tar.gz
set -e

echo '>> Installing dependencies...'
npm install

echo '>> Building resources...'
npm run electron:icons

echo '>> Building app...'
npm run electron:build -- --linux dir

echo '>> Compressing...'
tar -czf com.omniaevo.mqtt5-explorer.tar.gz dist_electron/linux-unpacked linux-resources
