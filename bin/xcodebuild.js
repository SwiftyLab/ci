#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');
const core = require('@actions/core');
const concurrently = require('concurrently');

function destinations() {
  const out = execSync(
    'xcrun simctl list --json devices available', {
      encoding: 'utf-8'
    }
  );
  const devices = JSON.parse(out).devices;
  let rv = {};
  for (const opaqueIdentifier in devices) {
    const device = (devices[opaqueIdentifier] ?? []).at(0);
    if (!device) continue;
    const [type, ver] = parse(opaqueIdentifier);
    if (ver && (!rv[type] || semver.lt(rv[type].ver, ver))) {
      rv[type] = { ver: ver, id: device.udid };
    }
  }

  return rv;

  function parse(key) {
    const [type, ...verItems] = (key.split('.').pop() ?? '').split('-');
    const ver = semver.coerce(verItems.join('.'));
    return [type, ver];
  }
}

function getDestination(platform) {
  switch (platform) {
    case 'macOS':
      return `-destination  platform=macOS`;
    case 'mac-catalyst':
      return `-destination "platform=macOS,variant=Mac Catalyst"`;
    case undefined:
    case null:
      return `-destination  platform=macOS`;
    default:
      const device = destinations()[platform];
      return device ? `-destination "id=${device.id}"` : null;
  }
}

core.startGroup(`Installing dependencies for swift package`);
execSync(
  `swift package resolve`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();

const defaultPlatforms = ['macOS', 'iOS', 'mac-catalyst', 'tvOS', 'watchOS'];
const argv = require('minimist')(process.argv.slice(2));
const passedPlatforms = argv._;
const platforms = passedPlatforms?.length ? passedPlatforms : defaultPlatforms;
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const project = `${package.name}.xcodeproj`;
const scheme = argv.scheme ?? `${package.name}-Package`;
const toolchainArg = process.env.TOOLCHAINS ? `-toolchain ${process.env.TOOLCHAINS}` : ''
const inputs = platforms
.map((platform) => {
  const destArg = getDestination(platform);
  if (!destArg) {
    core.info(`Skipping build for ${platform} simulator due to absense`);
    return nil;
  }
  const derivedDataPath = path.join('build', 'xcodebuild', scheme, platform, process.arch);
  const input = {
    name: platform,
    command: `xcodebuild ${toolchainArg} -project "${project}" -scheme "${scheme}" -derivedDataPath "${derivedDataPath}" ${destArg}`,
  };
  return input;
}).filter((input) => input);

(async () => {
  core.startGroup(`Run xcodebuild on project ${project}`);
  try {
    await concurrently(inputs, { prefix: 'name', group: true }).result;
  } catch (error) {
    core.error(error);
  }
  core.endGroup();
})();