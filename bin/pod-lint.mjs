#!/usr/bin/env node
import core from '@actions/core';
import readdirGlob from 'readdir-glob';
import concurrently from 'concurrently';
import parseArgs from 'minimist';

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

    const defaultPlatforms = ['macos', 'ios', 'tvos', 'watchos'];
    const passedPlatforms = parseArgs(process.argv.slice(2))._;
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
  }
);

specGlobberer.on('error', err => { core.error(err); });
