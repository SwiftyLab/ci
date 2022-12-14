#!/usr/bin/env node
const process = require('process');
const { execSync } = require('child_process');
const core = require('@actions/core');

const args = process.argv.slice(2).join(' ');
const command = `swift test ${args} --verbose \
  --enable-code-coverage \
  --enable-test-discovery`;

const testMsg = 'Running package tests';
core.startGroup(args ? `${testMsg} with arguments \`${args}\`` : testMsg);
execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8',
    timeout: 3.6e6,
  }
);
core.endGroup();
