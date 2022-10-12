#!/usr/bin/env node
const { execSync } = require('child_process');
const readdirGlob = require('readdir-glob');
const core = require('@actions/core');

let podspecs = [];
const specGlobberer = readdirGlob('.', { pattern: '*.podspec' });
specGlobberer.on(
  'match',
  m => {
    podspecs.push(m.relative);
  }
);

specGlobberer.on(
  'end',
  () => {
    const args = process.argv.slice(2).join(' ');
    const command = `pod lib lint ${args} \
      --no-clean \
      --allow-warnings \
      --verbose \
      --include-podspecs=\\{${podspecs.join(',')}\\}`;

    core.startGroup(`Linting podspec`);
    core.info(`Running command: ${command}`);
    execSync(command, {
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf-8'
      }
    );
    core.endGroup();
  }
);

specGlobberer.on('error', err => { core.error(err); });
