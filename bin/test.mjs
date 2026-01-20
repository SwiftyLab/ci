#!/usr/bin/env node
import process from 'process';
import { execSync } from 'child_process';
import core from '@actions/core';

const args = process.argv.slice(2).join(' ');
const command = `swift test ${args} --disable-experimental-prebuilts --verbose \
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
