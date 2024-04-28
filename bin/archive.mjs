#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import { execSync } from 'child_process';
import archiver from 'archiver';
import readdirGlob from 'readdir-glob';
import core from '@actions/core';

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

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
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
    const archiveName = [pkg.name, pkg.version].join('-');
    const output = fs.createWriteStream(`${archiveName}.xcframework.zip`);
    archive.pipe(output);
    archive.finalize();
    const archivePath = path.normalize(path.join(process.cwd(), output.path));
    core.info(`Created archive '${archivePath}'`);
    core.endGroup();
  }
);

xcframeworkGlobberer.on('error', err => { core.error(err); });
