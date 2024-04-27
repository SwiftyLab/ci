#!/usr/bin/env node
import fs from 'fs';
import { execSync } from 'child_process';
import core from '@actions/core';

const package = JSON.parse(fs.readFileSync('package.json', 'utf8'));
package.podspecs.forEach((spec) => {
  core.startGroup(`Pushing ${spec} to CocoapPods trunk`);
  execSync(`pod trunk push --allow-warnings --synchronous --skip-tests --verbose ${spec}`, {
      stdio: ['inherit', 'inherit', 'inherit'],
      encoding: 'utf-8'
    }
  );
  core.endGroup();
});