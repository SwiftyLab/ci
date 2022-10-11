#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const process = require('process');
const { execSync } = require('child_process');
const archiver = require('archiver');
const readdirGlob = require('readdir-glob');
const core = require('@actions/core');

try {
  execSync(
    `which carthage`, {
      encoding: 'utf-8'
    }
  );
} catch (error) {
  core.startGroup(`Installing Carthage with Homebrew`);
  execSync(
    `brew install carthage`, {
      stdio: ['inherit', 'inherit', 'inherit'],
      encoding: 'utf-8'
    }
  );
  core.endGroup();
}

core.startGroup(`Building XCFramework with Carthage`);
execSync(
  `carthage build \
    --verbose \
    --no-skip-current \
    --use-xcframeworks \
    --platform macOS,iOS,watchOS,tvOS`, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();

core.startGroup(`Zipping XCFramework`);
const archive = archiver('zip');
archive.file('package.json');
archive.file('LICENSE');
archive.directory('Helpers', '.');

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const xcframeworkGlobberer = readdirGlob('.', { pattern: 'Carthage/Build/*.xcframework' });
xcframeworkGlobberer.on(
  'match',
  m => {
    const xcframework = path.basename(m.relative);
    const name = path.basename(xcframework, path.extname(xcframework));
    archive.directory(m.absolute, xcframework);
    archive.directory(`Sources/${name}/${name}.docc`, `${name}.docc`);
  }
);

xcframeworkGlobberer.on(
  'end',
  () => {
    const archiveName = [package.name, package.version].join('-');
    const output = fs.createWriteStream(`${archiveName}.xcframework.zip`);
    archive.pipe(output);
    archive.finalize();
    const archivePath = path.normalize(path.join(process.cwd(), output.path));
    core.info(`Created archive '${archivePath}'`);
    core.endGroup();
  }
);

xcframeworkGlobberer.on('error', err => { core.error(err); });
