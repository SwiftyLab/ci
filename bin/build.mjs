#!/usr/bin/env node
import process from 'process';
import { execSync } from 'child_process';
import core from '@actions/core';

const args = process.argv.slice(2).join(' ');
const command = `swift build ${args} --verbose \
  -Xswiftc \
  -emit-symbol-graph \
  -Xswiftc \
  -emit-symbol-graph-dir \
  -Xswiftc .build`;

const buildMsg = 'Building package';
core.startGroup(args ? `${buildMsg} with arguments \`${args}\`` : buildMsg);
execSync(command, {
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf-8'
  }
);
core.endGroup();
