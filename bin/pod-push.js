#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const core = require('@actions/core');

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