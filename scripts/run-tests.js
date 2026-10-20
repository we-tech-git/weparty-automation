const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const reportsDir = path.join(root, 'cypress', 'reports')
const isWindows = process.platform === 'win32'

fs.rmSync(reportsDir, { recursive: true, force: true })

const cypressBin = path.join(root, 'node_modules', '.bin', isWindows ? 'cypress.cmd' : 'cypress')
const run = spawnSync(cypressBin, ['run', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  shell: isWindows,
})

const report = spawnSync(isWindows ? 'npm.cmd' : 'npm', ['run', 'report'], {
  cwd: root,
  stdio: 'inherit',
  shell: isWindows,
})

if (report.status !== 0) {
  console.error('Falha ao gerar o relatorio HTML em cypress/reports/report.html')
}

process.exit(run.status === null ? 1 : run.status)
