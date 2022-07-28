#!/usr/bin/env node
const { exec } = require('child_process');
const process = require('process');
const open = require('open');

const target = require('minimist')(process.argv.slice(2))._.at(0);
const child = exec(
  `swift package --verbose \
    --disable-sandbox preview-documentation \
    --target ${target} \
    --fallback-display-name ${target} \
    --fallback-bundle-identifier com.SwiftyLab.${target} \
    --fallback-bundle-version 1 \
    --additional-symbol-graph-dir .build`, {
    encoding: 'utf-8'
  }
);

child.stdout.on('data', function (data) {
  const url = /https?:\/\/\S+/i.exec(data);
  if (url) { open(`${url}`); }
  console.log(data);
});
