#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const source = process.env.ZZQ_DEV_KIT_SOURCE || '__KIT_SOURCE__';
const candidates = [
  process.env.npm_execpath,
  path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'),
  path.resolve(path.dirname(process.execPath), '../lib/node_modules/npm/bin/npm-cli.js'),
];
for (const dir of (process.env.PATH || '').split(path.delimiter)) {
  candidates.push(path.join(dir, 'node_modules/npm/bin/npm-cli.js'));
  if (process.platform !== 'win32') {
    try { candidates.push(fs.realpathSync(path.join(dir, 'npm'))); } catch {}
  }
}
const npmCli = candidates.find(p => p && path.basename(p) === 'npm-cli.js' && fs.existsSync(p));
if (!npmCli) {
  console.error('未找到npm-cli.js。请安装Node.js/npm，或在项目目录运行 npx zzq-dev-kit openspec <参数>。');
  process.exitCode = 1;
} else {
  const result = spawnSync(process.execPath, [npmCli, 'exec', '--yes', '--package=' + source, '--', 'zzq-dev-kit', 'openspec', ...process.argv.slice(2)], {
    cwd: path.resolve(__dirname, '..'), stdio: 'inherit', windowsHide: true,
  });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.error ? 1 : result.status == null ? 1 : result.status;
}
