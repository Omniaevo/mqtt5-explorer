#!/bin/bash

echo '>> Cleaning...'
set +e
rm -rf io.github.Omniaevo.mqtt5_explorer.tar.gz
set -e

echo '>> Installing dependencies...'
npm install

echo '>> Building resources...'
npm run electron:icons

echo '>> Building app...'
npm run electron:build -- --linux dir

echo '>> Compressing...'
tar -czf io.github.Omniaevo.mqtt5_explorer.tar.gz dist_electron/linux-unpacked linux-resources

echo '>> Computing checksum...'
sha256sum io.github.Omniaevo.mqtt5_explorer.tar.gz
