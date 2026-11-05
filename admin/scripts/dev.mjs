// Starts the admin in development with the repo's shared .env.local, the same file the website and the worker use.
// (Next only reads .env files from its own folder, and node's --env-file flag cannot be passed on to Next's child processes.)
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const adminDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const root = path.resolve(adminDir, '..')

try {
  process.loadEnvFile(path.join(root, '.env.local'))
} catch {
  console.warn('admin: no .env.local at the repo root. Copy .env.example to .env.local and fill it in.')
}

const next = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
const child = spawn(process.execPath, [next, 'dev', '--turbopack', '-p', '3100'], { stdio: 'inherit', cwd: adminDir, env: process.env })
child.on('exit', (code) => process.exit(code ?? 0))
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
