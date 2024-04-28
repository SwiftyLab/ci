#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs-extra';
import core from '@actions/core';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const destDir = `node_modules/${pkg.name}`;
const command = `git clone "${pkg.repository.url}" "${destDir}" \
 --branch "${pkg.version}" --single-branch`;
core.startGroup(`Cloning official ${pkg.name} repo`);
fs.removeSync(destDir);
execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();

core.startGroup(`Copy source files for ${pkg.name}`);
['Sources', 'Tests'].forEach((dir) => {
  const source = `${destDir}/${dir}`;
  fs.emptyDirSync(dir);
  fs.copySync(source, dir);
});
core.endGroup();
