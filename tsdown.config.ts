import { defineConfig } from 'tsdown'

export default defineConfig([
  // 原有库入口
  {
    entry: { index: 'src/index.ts' },
    exports: true,
    dts: true,
  },
  // CLI 入口
  {
    entry: { cli: 'src/cli.ts' },
    platform: 'node',
    dts: false,
    banner: { js: '#!/usr/bin/env node' },
  },
])
