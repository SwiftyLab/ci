#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const process = require('process');
const archiver = require('archiver');
const readdirGlob = require('readdir-glob');
const { exec } = require('child_process');
const core = require('@actions/core');

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const products = require('minimist')(process.argv.slice(2))._;
const doccarchiveCommand = (product) => `swift package --verbose generate-documentation \
  --target ${product} \
  --fallback-display-name ${product} \
  --fallback-bundle-identifier com.SwiftyLab.${product} \
  --fallback-bundle-version ${package.version} \
  --additional-symbol-graph-dir .build`;

core.startGroup(`Building documentation archive`);
(async () => {
  await Promise.all(
    products.map((product) => new Promise((resolve, reject) => {
      exec(
        doccarchiveCommand(product), {
          stdio: ['inherit', 'inherit', 'inherit'],
          encoding: 'utf-8'
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        }
      )
   }))
  );
  core.endGroup();
})();

const doccGlobberer = readdirGlob('.', { pattern: '.build/plugins/Swift-DocC/outputs/*.doccarchive' });
doccGlobberer.on(
  'match',
  m => {
    core.startGroup(`Zipping documentation archive`);
    const docc = path.basename(m.relative);
    const archiveName = [package.name, package.version].join('-');
    const output = fs.createWriteStream(`${archiveName}.doccarchive.zip`);
    const archive = archiver('zip');
    archive.directory(m.absolute, docc);
    archive.pipe(output);
    archive.finalize();
    const archivePath = path.normalize(path.join(process.cwd(), output.path));
    core.info(`Created archive '${archivePath}'`);
    core.endGroup();
  }
);

doccGlobberer.on('error', err => { core.error(err); });
