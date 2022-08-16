#!/usr/bin/env node
const { execSync } = require('child_process');
const core = require('@actions/core');


const args = process.argv.slice(2).join(' ');
const command = `pod lib lint ${args} \
  --no-clean \
  --allow-warnings \
  --verbose`;

core.startGroup(`Linting podspec`);
core.info(`Running command: ${command}`);
execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();
