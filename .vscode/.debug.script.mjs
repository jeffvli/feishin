import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { spawn } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const pkg = require('../package.json')

// write .debug.env
const envContent = Object.entries(pkg.debug.env).map(([key, val]) => `${key}=${val}`)
fs.writeFileSync(path.join(__dirname, '.debug.env'), envContent.join('\n'))

// bootstrap
spawn(
  // TODO: terminate `npm run dev` when Debug exits.
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev'],
  {
    stdio: 'inherit',
    env: Object.assign(process.env, { VSCODE_DEBUG: 'true' }),
  },
)
