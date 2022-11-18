#!/usr/bin/env node
const core = require('@actions/core');
const readdirGlob = require('readdir-glob');
const concurrently = require('concurrently');

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
    const command = (platform) => `pod lib lint --verbose --no-clean --allow-warnings \
      --platforms=${platform} \
      --include-podspecs=\\{${podspecs.join(',')}\\}`;

    const defaultPlatforms = ['macos', 'ios', 'tvos', /* 'watchos' */];
    const passedPlatforms = require('minimist')(process.argv.slice(2))._;
    const platforms = passedPlatforms?.length ? passedPlatforms : defaultPlatforms;
    const inputs = platforms
    .map((platform) => {
      return {
        name: platform,
        command: command(platform),
      };
    }).filter((input) => input);
    
    (async () => {
      core.startGroup(`Linting podspec`);
      try {
        await concurrently(inputs, { prefix: 'name', group: true }).result;
      } catch (error) {
        core.error(error);
      }
      core.endGroup();
    })();

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
