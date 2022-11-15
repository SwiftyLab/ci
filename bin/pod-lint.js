#!/usr/bin/env node
const core = require('@actions/core');
const concurrently = require('concurrently');

const defaultPlatforms = ['macos', 'ios', 'tvos', /* 'watchos' */];
const passedPlatforms = require('minimist')(process.argv.slice(2))._;
const platforms = passedPlatforms?.length ? passedPlatforms : defaultPlatforms;
const inputs = platforms
.map((platform) => {
  return {
    name: platform,
    command: `pod lib lint --no-clean --allow-warnings --verbose --platforms=${platform}`,
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
