#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import process from 'process';
import archiver from 'archiver';
import readdirGlob from 'readdir-glob';
import { exec } from 'child_process';
import core from '@actions/core';
import parseArgs from 'minimist';

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const products = parseArgs(process.argv.slice(2))._;
const doccarchiveCommand = (product) => `swift package --verbose generate-documentation \
  --include-extended-types \
  --target ${product} \
  --fallback-display-name ${product} \
  --fallback-bundle-identifier com.SwiftyLab.${product} \
  --fallback-bundle-version ${package.version} \
  --additional-symbol-graph-dir .build`;

core.startGroup(`Building documentation archive`);
(async () => {
  for (const product of products) {
    execSync(
      doccarchiveCommand(product), {
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf-8'
      }
    );
  }
  core.endGroup();

  core.startGroup(`Zipping documentation archive`);
  const archive = archiver('zip');
  const doccGlobberer = readdirGlob('.', { pattern: '.build/plugins/Swift-DocC/outputs/*.doccarchive' });
  doccGlobberer.on(
    'match',
    m => {
      const docc = path.basename(m.relative);
      archive.directory(m.absolute, docc);
    }
  );

  doccGlobberer.on(
    'end',
    () => {
      const archiveName = [package.name, package.version].join('-');
      const output = fs.createWriteStream(`${archiveName}-doccarchive.zip`);
      archive.pipe(output);
      archive.finalize();
      const archivePath = path.normalize(path.join(process.cwd(), output.path));
      core.info(`Created archive '${archivePath}'`);
      core.endGroup();
    }
  );

  doccGlobberer.on('error', err => { core.error(err); });
})();
