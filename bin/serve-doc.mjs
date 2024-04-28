#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import readdirGlob from 'readdir-glob';
import core from '@actions/core';
import parseArgs from 'minimist';

const targets = parseArgs(process.argv.slice(2))._;
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

async function generateHostingDoc(basePath, outPath) {
  const hostingDocGenCommand = (target) =>
   `swift package --verbose \
     generate-documentation \
     --include-extended-types \
     --target ${target} \
     --disable-indexing \
     --transform-for-static-hosting \
     --hosting-base-path ${basePath}`;

  targets.forEach((target) => {
    core.info(`Generating Documentation for target ${target}`);
    execSync(hostingDocGenCommand(target), {
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf-8'
      }
    );
  });

  const doccGlobberer = readdirGlob('.', { pattern: '.build/plugins/Swift-DocC/outputs/*.doccarchive' });
  await new Promise((resolve, reject) => {
    doccGlobberer.on(
      'match',
      m => {
        fs.cpSync(m.absolute, outPath, { recursive: true });
      }
    );

    doccGlobberer.on('end', () => { resolve(); });
    doccGlobberer.on('error', err => { core.error(err); reject(err); });
  });
};

fs.rmSync('.docc-build', { recursive: true, force: true });
fs.mkdirSync('.docc-build', { recursive: true });

(async () => {
  core.startGroup(`Generating Documentation for Hosting Online`);
  await generateHostingDoc(`${pkg.name}`, '.docc-build');
  core.endGroup();
  core.startGroup(`Generating ${pkg.version} Specific Documentation for Hosting Online`);
  await generateHostingDoc(`${pkg.name}/${pkg.version}`, `.docc-build/${pkg.version}`);
  core.endGroup();
})();
