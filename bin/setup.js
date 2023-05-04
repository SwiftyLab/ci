#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs-extra');
const core = require('@actions/core');

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const destDir = `node_modules/${package.name}`;
const command = `git clone "${package.repository.url}" "${destDir}" \
 --branch "${package.version}" --single-branch`;
core.startGroup(`Cloning official ${package.name} repo`);
fs.removeSync(destDir);
execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();

core.startGroup(`Copy source files for ${package.name}`);
['Sources', 'Tests'].forEach((dir) => {
  const source = `${destDir}/${dir}`;
  fs.emptyDirSync(dir);
  fs.copySync(source, dir);
});
core.endGroup();
