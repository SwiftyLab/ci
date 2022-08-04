#!/usr/bin/env node
const process = require('process');
const { execSync } = require('child_process');

const args = process.argv.slice(2).join(' ');
const command = `swift run swift-format ${args} \
  --in-place \
  --ignore-unparsable-files \
  --recursive Sources Tests`;

execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);