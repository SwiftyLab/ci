#!/usr/bin/env node
import { exec } from 'child_process';
import process from 'process';
import open from 'open';
import parseArgs from 'minimist';

const target = parseArgs(process.argv.slice(2))._.at(0);
const child = exec(
  `swift package --verbose \
    --disable-sandbox preview-documentation \
    --include-extended-types \
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
