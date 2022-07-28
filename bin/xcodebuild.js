#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const semver = require('semver');
const core = require('@actions/core');

function destinations() {
  const out = execSync(
    'xcrun simctl list --json devices available', {
      encoding: 'utf-8'
    }
  );
  const devices = JSON.parse(out).devices;
  let rv = {}
  for (const opaqueIdentifier in devices) {
    const device = (devices[opaqueIdentifier] ?? []).at(0)
    if (!device) continue;
    const [type, ver] = parse(opaqueIdentifier)
    if (ver && (!rv[type] || semver.lt(rv[type].ver, ver))) {
      rv[type] = { ver: ver, id: device.udid };
    }
  }

  return rv;

  function parse(key) {
    const [type, ...verItems] = (key.split('.').pop() ?? '').split('-')
    const ver = semver.coerce(verItems.join('.'))
    return [type, ver]
  }
}

function getDestination(platform) {
  switch (platform) {
    case 'macOS':
      return `-destination  platform=macOS`
    case 'mac-catalyst':
      return `-destination "platform=macOS,variant=Mac Catalyst"`
    case undefined:
    case null:
      return `-destination  platform=macOS`
    default:
      const device = destinations()[platform]
      return `-destination "id=${device.id}"`
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

const argv = require('minimist')(process.argv.slice(2));
const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const project = `${package.name}.xcodeproj`
const platformArg = getDestination(argv.platform)
core.startGroup(`Run xcodebuild on project ${project} for sdk`);
execSync(
  `xcodebuild -project ${project} ${platformArg}`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();