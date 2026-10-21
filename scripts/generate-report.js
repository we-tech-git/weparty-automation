const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const reportsDir = path.join(root, 'cypress', 'reports')
const mergedPath = path.join(reportsDir, 'merged-report.json')
const outputPath = path.join(reportsDir, 'report.html')
const logoPath = path.join(__dirname, 'assets', 'weparty-logo.png')

const SPEC_LABELS = {
  'signup.cy.js': 'Cadastro',
  'login.cy.js': 'Login',
  'detalhes.cy.js': 'Detalhes do evento',
  'feed.cy.js': 'Feed',
}

if (!fs.existsSync(mergedPath)) {
  console.error('merged-report.json nao encontrado. Rode os testes antes de gerar o relatorio.')
  process.exit(1)
}

const merged = JSON.parse(fs.readFileSync(mergedPath, 'utf8'))
const stats = merged.stats || {}
const logo = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : ''

const esc = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

function collectTests (suite) {
  return [
    ...(suite.tests || []),
    ...(suite.suites || []).flatMap(collectTests),
  ]
}

function testStatus (test) {
  if (test.fail || test.state === 'failed') return 'failed'
  if (test.pass || test.state === 'passed') return 'passed'
  return 'pending'
}

function formatDuration (ms) {
  if (!ms || ms < 1000) return `${Math.max(0, Math.round(ms || 0))}ms`
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function parseTitle (title) {
  const match = String(title).match(/^(CT-\d+)-([^:]+):\s*(.+)$/i)
  if (!match) {
    return { code: '', slug: '', description: title }
  }
  return {
    code: match[1].toUpperCase(),
    slug: match[2].replace(/-/g, ' '),
    description: match[3],
  }
}

const specs = (merged.results || []).map((result) => {
  const suites = result.suites || []
  const tests = suites.flatMap(collectTests)
  const fileName = path.basename(String(result.fullFile || '').replace(/\\/g, '/'))
  const title = SPEC_LABELS[fileName] || suites[0]?.title || fileName.replace(/\.cy\.js$/, '')
  const counts = tests.reduce((acc, test) => {
    acc[testStatus(test)] += 1
    return acc
  }, { passed: 0, failed: 0, pending: 0 })
  const duration = tests.reduce((total, test) => total + (test.duration || 0), 0)
  const status = counts.failed > 0 ? 'failed' : counts.pending === tests.length ? 'pending' : 'passed'
  return {
    title,
    fileName,
    filePath: String(result.fullFile || '').replace(/\\/g, '/'),
    tests,
    counts,
    duration,
    status,
  }
})

const total = stats.tests || specs.reduce((sum, spec) => sum + spec.tests.length, 0)
const passed = stats.passes || 0
const failed = stats.failures || 0
const pending = (stats.pending || 0) + (stats.skipped || 0)
const passPercent = Math.round(stats.passPercent != null ? stats.passPercent : (total ? (passed / total) * 100 : 0))
const duration = formatDuration(stats.duration || 0)
const startedAt = stats.start ? new Date(stats.start) : new Date()
const finishedAt = stats.end ? new Date(stats.end) : new Date()
const dateLabel = startedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
const timeLabel = startedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const heroTitle = failed === 0
  ? 'Tudo pronto para a festa.'
  : `${failed} ${failed === 1 ? 'teste precisa' : 'testes precisam'} de atenção.`
const heroText = failed === 0
  ? `${total} testes executados em ${specs.length} specs, sem nenhuma falha. A suíte está verde e pronta para o deploy.`
  : `${passed} de ${total} testes passaram. Confira abaixo os detalhes antes de seguir para o deploy.`

function renderTest (test, specTitle) {
  const status = testStatus(test)
  const parsed = parseTitle(test.title)
  const search = `${specTitle} ${test.title}`.toLowerCase()
  const error = test.err || {}
  const errorMessage = error.message || ''
  const errorStack = error.stack || ''
  const safeTitle = esc(parsed.description)
  const code = parsed.code ? `<span class="ct">${esc(parsed.code)}</span>` : ''
  const slug = parsed.slug ? `<span class="slug">${esc(parsed.slug)}</span>` : ''
  const statusLabel = status === 'passed' ? 'Passou' : status === 'failed' ? 'Falhou' : 'Pendente'
  const details = status === 'failed' && (errorMessage || errorStack)
    ? `<details class="test-error">
        <summary>Ver detalhes do erro</summary>
        ${errorMessage ? `<p>${esc(errorMessage)}</p>` : ''}
        ${errorStack ? `<pre>${esc(errorStack)}</pre>` : ''}
      </details>`
    : ''

  return `<li class="test test--${status}" data-status="${status}" data-search="${esc(search)}">
    <div class="test-row">
      <span class="test-dot" aria-hidden="true"></span>
      <div class="test-main">
        <div class="test-title">${code}${code && slug ? ' ' : ''}${slug}<span class="test-desc">${safeTitle}</span></div>
      </div>
      <span class="test-status">${statusLabel}</span>
      <span class="test-duration">${formatDuration(test.duration)}</span>
    </div>
    ${details}
  </li>`
}

function renderSpec (spec) {
  const totalSpec = spec.tests.length
  const percent = totalSpec ? Math.round((spec.counts.passed / totalSpec) * 100) : 0
  const statusLabel = spec.status === 'passed' ? 'Verde' : spec.status === 'failed' ? 'Com falha' : 'Pendente'
  const initial = spec.title.trim().charAt(0).toUpperCase()
  const testRows = spec.tests.map((test) => renderTest(test, spec.title)).join('')

  return `<section class="spec card" data-spec data-status="${spec.status}">
    <header class="spec-head">
      <div class="spec-id">
        <span class="spec-avatar" aria-hidden="true">${esc(initial)}</span>
        <div>
          <h2>${esc(spec.title)}</h2>
          <p>${esc(spec.filePath || spec.fileName)}</p>
        </div>
      </div>
      <div class="spec-summary">
        <span class="badge badge--${spec.status}">${statusLabel}</span>
        <span class="spec-count"><b>${spec.counts.passed}</b>/${totalSpec} passaram</span>
        <span class="spec-time">${formatDuration(spec.duration)}</span>
      </div>
      <div class="spec-track" aria-hidden="true">
        <span class="spec-fill spec-fill--${spec.status}" data-width="${percent}" style="width:${percent}%"></span>
      </div>
    </header>
    <ul class="tests">${testRows}</ul>
  </section>`
}

const specsHtml = specs.map(renderSpec).join('')

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#ff9a4d">
${logo ? `<link rel="icon" href="${logo}">` : ''}
<title>WeParty Automation - Relatório de Testes</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+Thambi+2:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --pink:#ff5f8f;
  --pink-soft:#f472b6;
  --coral:#ff9a4d;
  --ink:#1a1c2e;
  --ink-soft:#555b77;
  --muted:#8b90a5;
  --line:#f2dfe5;
  --bg:#fff5f7;
  --card:#ffffff;
  --green:#10b981;
  --teal:#14b8a6;
  --teal-soft:#2dd4bf;
  --cyan:#06b6d4;
  --cyan-soft:#22d3ee;
  --red:#ef4444;
  --amber:#f59e0b;
  --grad:linear-gradient(90deg,#ff9a4d 0%,#ff5f8f 100%);
  --grad-hero:linear-gradient(115deg,#ff9a4d 0%,#ff6f86 30%,#ff5f8f 50%,#14b8a6 70%,#06b6d4 100%);
  --grad-cool:linear-gradient(90deg,#10b981 0%,#06b6d4 100%);
  --grad-soft:linear-gradient(135deg,#fff7f3 0%,#fff0f6 100%);
  --radius:26px;
  --shadow:0 24px 60px -32px rgba(255,95,143,.45);
  --font-display:"Baloo Thambi 2",system-ui,sans-serif;
  --font-body:Poppins,system-ui,sans-serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;
  min-height:100vh;
  font-family:var(--font-body);
  color:var(--ink);
  background:
    radial-gradient(900px 500px at 8% -10%,rgba(255,154,77,.18),transparent 60%),
    radial-gradient(900px 600px at 100% 0%,rgba(255,95,143,.16),transparent 55%),
    radial-gradient(820px 520px at 0% 100%,rgba(20,184,166,.18),transparent 62%),
    radial-gradient(820px 540px at 100% 100%,rgba(6,182,212,.16),transparent 60%),
    linear-gradient(160deg,#fff5f7 0%,#fff0f6 20%,#fce7f3 40%,#ecfdf5 60%,#d1fae5 76%,#cffafe 90%,#a5f3fc 100%);
}
body::before{
  content:"";
  position:fixed;
  inset:0;
  pointer-events:none;
  background-image:radial-gradient(rgba(255,95,143,.07) 1px,transparent 1px);
  background-size:26px 26px;
  mask-image:linear-gradient(to bottom,black,transparent 70%);
  z-index:0;
}
a{color:inherit}
.wrap{position:relative;z-index:1;width:min(1180px,calc(100% - 40px));margin:0 auto;padding:26px 0 60px}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:26px}
.brand{display:flex;align-items:center;gap:14px}
.brand img{width:58px;height:58px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(255,95,143,.25))}
.brand strong{display:block;font-family:var(--font-display);font-size:1.45rem;line-height:1;letter-spacing:-.02em}
.brand span{display:block;margin-top:4px;color:var(--muted);font-size:.72rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase}
.top-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.pill{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:9px 15px;background:#fff;border:1px solid var(--line);font-size:.78rem;font-weight:600;color:var(--ink-soft);box-shadow:0 8px 20px -16px rgba(26,28,46,.5)}
.pill--brand{background:var(--grad);border:0;color:#fff;box-shadow:0 12px 24px -12px rgba(255,95,143,.65)}
.pill--cool{background:var(--grad-cool);border:0;color:#fff;box-shadow:0 12px 24px -12px rgba(6,182,212,.6)}
.pill .dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(16,185,129,.15)}
.card{background:var(--card);border:1px solid rgba(255,95,143,.12);border-radius:var(--radius);box-shadow:var(--shadow)}
.hero{overflow:hidden;position:relative;display:grid;grid-template-columns:1.35fr .65fr;gap:24px;padding:38px 42px;background:var(--grad-hero);color:#fff;border:0}
.hero::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;background:rgba(255,255,255,.16);right:-120px;top:-180px;filter:blur(4px)}
.hero::before{content:"";position:absolute;width:260px;height:260px;border-radius:50%;background:rgba(255,255,255,.10);left:35%;bottom:-170px}
.hero-copy{position:relative;z-index:1}
.eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.35);border-radius:999px;padding:8px 14px;font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.hero h1{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.15rem);line-height:1.02;letter-spacing:-.03em;margin:18px 0 12px;max-width:15ch}
.hero p{margin:0;max-width:52ch;font-size:.98rem;line-height:1.7;color:rgba(255,255,255,.92)}
.hero-badges{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}
.hero-badges span{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.32);border-radius:14px;padding:10px 14px;font-size:.78rem;font-weight:600}
.hero-badges b{font-family:var(--font-display);font-size:1.05rem}
.score{position:relative;z-index:1;display:grid;place-items:center;min-height:230px}
.score-ring{position:relative;width:212px;height:212px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#fff calc(var(--pct,0) * 1%),rgba(255,255,255,.22) 0);transition:none}
.score-ring::before{content:"";position:absolute;inset:16px;border-radius:50%;background:linear-gradient(160deg,#14b8a6,#0891b2);box-shadow:inset 0 0 0 1px rgba(255,255,255,.28)}
.score-inner{position:relative;z-index:1;text-align:center}
.score-inner b{display:block;font-family:var(--font-display);font-size:3.2rem;line-height:1;letter-spacing:-.04em}
.score-inner span{display:block;margin-top:6px;font-size:.72rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.86)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:18px 0 22px}
.stat{position:relative;padding:20px 22px;overflow:hidden}
.stat::after{content:"";position:absolute;right:-28px;top:-28px;width:96px;height:96px;border-radius:50%;background:var(--tint,rgba(255,95,143,.08))}
.stat small{display:block;color:var(--muted);font-size:.7rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase}
.stat b{display:block;margin-top:8px;font-family:var(--font-display);font-size:2rem;line-height:1;letter-spacing:-.02em}
.stat span{display:block;margin-top:6px;color:var(--ink-soft);font-size:.78rem}
.stat--pass{--tint:rgba(16,185,129,.12)}
.stat--fail{--tint:rgba(239,68,68,.10)}
.stat--pending{--tint:rgba(245,158,11,.12)}
.stat--time{--tint:rgba(20,184,166,.14)}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:16px 18px;margin-bottom:20px;position:sticky;top:12px;z-index:20;backdrop-filter:blur(14px);background:rgba(255,255,255,.86)}
.filters{display:flex;gap:8px;flex-wrap:wrap}
.filter{border:1px solid var(--line);background:#fff;color:var(--ink-soft);border-radius:999px;padding:9px 14px;font-family:var(--font-body);font-size:.78rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:all .18s ease}
.filter b{font-family:var(--font-display);font-size:.9rem}
.filter:hover{border-color:rgba(255,95,143,.45);color:var(--ink);transform:translateY(-1px)}
.filter.is-active{background:var(--grad);border-color:transparent;color:#fff;box-shadow:0 12px 22px -14px rgba(255,95,143,.8)}
.search{position:relative;display:flex;align-items:center;min-width:260px;flex:1;max-width:380px}
.search svg{position:absolute;left:14px;width:16px;height:16px;color:var(--muted)}
.search input{width:100%;border:1px solid var(--line);background:#fff;border-radius:14px;padding:11px 14px 11px 40px;font-family:var(--font-body);font-size:.82rem;color:var(--ink);outline:none;transition:border-color .18s,box-shadow .18s}
.search input::placeholder{color:#b3b7c8}
.search input:focus{border-color:var(--pink);box-shadow:0 0 0 4px rgba(255,95,143,.14)}
.visible-count{margin:0 0 14px;color:var(--ink-soft);font-size:.8rem}
.specs{display:grid;gap:18px}
.spec{padding:0;overflow:hidden;opacity:0;transform:translateY(14px);transition:opacity .55s ease,transform .55s ease}
.spec.is-visible{opacity:1;transform:none}
.spec-head{display:grid;grid-template-columns:1.2fr auto;gap:14px 24px;align-items:center;padding:22px 26px 16px}
.spec-id{display:flex;align-items:center;gap:14px;min-width:0}
.spec-avatar{flex:none;width:46px;height:46px;border-radius:16px;display:grid;place-items:center;background:var(--grad);color:#fff;font-family:var(--font-display);font-size:1.25rem;box-shadow:0 12px 22px -14px rgba(255,95,143,.85)}
.spec-head h2{font-family:var(--font-display);font-size:1.28rem;margin:0;letter-spacing:-.01em;line-height:1.1}
.spec-head p{margin:5px 0 0;color:var(--muted);font-size:.72rem;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;word-break:break-all}
.spec-summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:flex-end}
.badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:6px 12px;font-size:.7rem;font-weight:700;letter-spacing:.04em}
.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.badge--passed{background:rgba(16,185,129,.11);color:#0b8a61}
.badge--failed{background:rgba(239,68,68,.11);color:#c62c2c}
.badge--pending{background:rgba(245,158,11,.13);color:#a16207}
.spec-count{color:var(--ink-soft);font-size:.78rem}
.spec-count b{font-family:var(--font-display);font-size:1rem;color:var(--ink)}
.spec-time{color:var(--muted);font-size:.76rem;font-variant-numeric:tabular-nums}
.spec-track{grid-column:1/-1;height:8px;border-radius:999px;background:#fbe7ee;overflow:hidden}
.spec-fill{display:block;height:100%;width:0;border-radius:inherit;background:var(--grad-hero);transition:width .9s cubic-bezier(.2,.8,.2,1)}
.spec-fill--failed{background:linear-gradient(90deg,#f59e0b,#ef4444)}
.spec-fill--pending{background:linear-gradient(90deg,#fbbf24,#f59e0b)}
.spec:nth-child(even){border-color:rgba(20,184,166,.18)}
.spec:nth-child(even) .spec-track{background:#dcfaf7}
.spec:nth-child(even) .spec-avatar{background:var(--grad-cool);box-shadow:0 12px 22px -14px rgba(6,182,212,.8)}
.spec:nth-child(even) .ct{background:#ecfeff;color:#0e7490}
.spec:nth-child(even) .test-row:hover{background:#f0fdfa}
.tests{list-style:none;margin:0;padding:4px 14px 16px}
.test{border-top:1px solid #f8edf1}
.test-row{display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;padding:14px 12px;border-radius:14px;transition:background .16s}
.test-row:hover{background:#fff8fa}
.test-dot{width:9px;height:9px;border-radius:50%;background:var(--green);box-shadow:0 0 0 4px rgba(16,185,129,.12)}
.test--failed .test-dot{background:var(--red);box-shadow:0 0 0 4px rgba(239,68,68,.12)}
.test--pending .test-dot{background:var(--amber);box-shadow:0 0 0 4px rgba(245,158,11,.14)}
.test-main{min-width:0}
.test-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.86rem;font-weight:500;line-height:1.45}
.ct{display:inline-flex;align-items:center;border-radius:8px;padding:2px 7px;background:#fff0f5;color:#d6396b;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.68rem;font-weight:700;letter-spacing:.03em}
.slug{color:var(--muted);font-size:.68rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.test-desc{color:var(--ink);font-weight:500}
.test-status{font-size:.68rem;font-weight:700;color:#0b8a61;letter-spacing:.06em;text-transform:uppercase}
.test--failed .test-status{color:#c62c2c}
.test--pending .test-status{color:#a16207}
.test-duration{font-size:.74rem;color:var(--muted);font-variant-numeric:tabular-nums;min-width:48px;text-align:right}
.test-error{margin:0 12px 14px 35px;border:1px solid rgba(239,68,68,.2);background:#fff5f5;border-radius:14px;overflow:hidden}
.test-error summary{cursor:pointer;padding:11px 14px;font-size:.76rem;font-weight:600;color:#b42323;list-style:none}
.test-error summary::-webkit-details-marker{display:none}
.test-error summary::before{content:"+";display:inline-block;width:16px;font-weight:700}
.test-error[open] summary::before{content:"-"}
.test-error p{margin:0;padding:0 16px 10px;color:#7f1d1d;font-size:.78rem;line-height:1.6}
.test-error pre{margin:0;padding:12px 16px 16px;overflow:auto;font-size:.7rem;line-height:1.55;color:#6b2020;background:rgba(239,68,68,.04);max-height:280px}
.empty{display:none;text-align:center;padding:46px 24px;color:var(--ink-soft)}
.empty.is-visible{display:block}
.empty b{display:block;font-family:var(--font-display);font-size:1.4rem;color:var(--ink);margin-bottom:6px}
.footer{margin-top:28px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:.72rem}
.footer b{color:var(--ink-soft)}
#confetti{position:fixed;inset:0;pointer-events:none;z-index:99}
@media (max-width:920px){
  .hero{grid-template-columns:1fr;padding:30px 26px}
  .score{min-height:auto;margin-top:6px}
  .stats{grid-template-columns:repeat(2,1fr)}
  .spec-head{grid-template-columns:1fr;gap:12px}
  .spec-summary{justify-content:flex-start}
  .toolbar{position:static}
}
@media (max-width:560px){
  .wrap{width:min(100% - 24px,1180px);padding-top:16px}
  .stats{grid-template-columns:1fr 1fr;gap:10px}
  .stat{padding:16px}
  .test-row{grid-template-columns:auto 1fr auto;gap:10px}
  .test-status{display:none}
  .test-duration{min-width:0}
  .search{max-width:none;min-width:0;width:100%}
}
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{transition:none!important;animation:none!important;scroll-behavior:auto!important}
}
@media print{
  body{background:#fff}
  .toolbar,#confetti{display:none}
  .card{box-shadow:none}
}
</style>
</head>
<body>
<div class="wrap">
  <header class="topbar">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="WeParty">` : ''}
      <div><strong>WeParty</strong><span>Automation</span></div>
    </div>
    <div class="top-meta">
      <span class="pill pill--brand"><span class="dot"></span>E2E Cypress</span>
      <span class="pill pill--cool">Ambiente: Produção</span>
      <span class="pill">${esc(dateLabel)} · ${esc(timeLabel)}</span>
    </div>
  </header>

  <section class="hero card">
    <div class="hero-copy">
      <span class="eyebrow">Relatório de testes</span>
      <h1>${esc(heroTitle)}</h1>
      <p>${esc(heroText)}</p>
      <div class="hero-badges">
        <span><b>${passed}</b> passaram</span>
        <span><b>${failed}</b> falharam</span>
        <span><b>${pending}</b> pendentes</span>
        <span><b>${esc(duration)}</b> de execução</span>
      </div>
    </div>
    <div class="score">
      <div class="score-ring" id="scoreRing" style="--pct:${passPercent}">
        <div class="score-inner">
          <b id="scoreValue">${passPercent}%</b>
          <span>sucesso</span>
        </div>
      </div>
    </div>
  </section>

  <section class="stats" aria-label="Resumo da execução">
    <article class="stat card"><small>Total</small><b data-count="${total}">${total}</b><span>testes executados</span></article>
    <article class="stat stat--pass card"><small>Passaram</small><b data-count="${passed}">${passed}</b><span>${passPercent}% de sucesso</span></article>
    <article class="stat stat--fail card"><small>Falharam</small><b data-count="${failed}">${failed}</b><span>${failed ? 'revisar antes do deploy' : 'nenhuma falha'}</span></article>
    <article class="stat stat--time card"><small>Duração</small><b>${esc(duration)}</b><span>${specs.length} specs · ${esc(dateLabel)}</span></article>
  </section>

  <section class="toolbar card" aria-label="Filtros do relatório">
    <div class="filters" role="tablist" aria-label="Filtrar por status">
      <button class="filter is-active" data-filter="all" role="tab" aria-selected="true">Todos <b>${total}</b></button>
      <button class="filter" data-filter="passed" role="tab" aria-selected="false">Passaram <b>${passed}</b></button>
      <button class="filter" data-filter="failed" role="tab" aria-selected="false">Falharam <b>${failed}</b></button>
      <button class="filter" data-filter="pending" role="tab" aria-selected="false">Pendentes <b>${pending}</b></button>
    </div>
    <label class="search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input id="search" type="search" placeholder="Buscar teste, CT ou spec..." autocomplete="off" aria-label="Buscar teste">
    </label>
  </section>

  <p class="visible-count" id="visibleCount" aria-live="polite">Mostrando ${total} de ${total} testes</p>

  <section class="specs" id="specs">
    ${specsHtml}
    <div class="empty card" id="empty">
      <b>Nenhum teste por aqui</b>
      <span>Ajuste a busca ou o filtro para ver outros resultados.</span>
    </div>
  </section>

  <footer class="footer">
    <span>Gerado em ${esc(finishedAt.toLocaleString('pt-BR'))} · <b>weparty-automation</b></span>
    <span>${specs.length} specs · ${total} testes · Cypress</span>
  </footer>
</div>
<canvas id="confetti" aria-hidden="true"></canvas>
<script>
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  var passPercent = ${passPercent}

  function animateCount (el, target, duration) {
    var start = performance.now()
    function frame (now) {
      var progress = Math.min((now - start) / duration, 1)
      var eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = Math.round(target * eased)
      if (progress < 1) requestAnimationFrame(frame)
      else el.textContent = target
    }
    requestAnimationFrame(frame)
  }

  var ring = document.getElementById('scoreRing')
  var scoreValue = document.getElementById('scoreValue')

  function finalize () {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = el.getAttribute('data-count')
    })
    ring.style.setProperty('--pct', passPercent)
    scoreValue.textContent = passPercent + '%'
    document.querySelectorAll('.spec-fill').forEach(function (fill) {
      fill.style.width = fill.getAttribute('data-width') + '%'
    })
  }

  if (!reduceMotion) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = '0'
      animateCount(el, Number(el.getAttribute('data-count')), 900)
    })
    ring.style.setProperty('--pct', 0)
    scoreValue.textContent = '0%'
    var start = performance.now()
    function frameRing (now) {
      var progress = Math.min((now - start) / 1100, 1)
      var eased = 1 - Math.pow(1 - progress, 3)
      var value = Math.round(passPercent * eased)
      ring.style.setProperty('--pct', value)
      scoreValue.textContent = value + '%'
      if (progress < 1) requestAnimationFrame(frameRing)
    }
    requestAnimationFrame(frameRing)
    setTimeout(finalize, 1800)
  }

  window.addEventListener('beforeprint', finalize)

  document.querySelectorAll('.spec').forEach(function (spec, index) {
    var fill = spec.querySelector('.spec-fill')
    if (fill && !reduceMotion) {
      fill.style.width = '0%'
      setTimeout(function () {
        fill.style.width = fill.getAttribute('data-width') + '%'
      }, 260 + index * 90)
    }
    setTimeout(function () { spec.classList.add('is-visible') }, reduceMotion ? 0 : 120 + index * 90)
  })

  var activeFilter = 'all'
  var searchInput = document.getElementById('search')
  var visibleCount = document.getElementById('visibleCount')
  var empty = document.getElementById('empty')

  function applyFilters () {
    var term = (searchInput.value || '').trim().toLowerCase()
    var visible = 0
    document.querySelectorAll('.spec').forEach(function (spec) {
      var specVisible = 0
      spec.querySelectorAll('.test').forEach(function (test) {
        var matchesStatus = activeFilter === 'all' || test.getAttribute('data-status') === activeFilter
        var matchesSearch = !term || test.getAttribute('data-search').indexOf(term) !== -1
        var show = matchesStatus && matchesSearch
        test.style.display = show ? '' : 'none'
        if (show) specVisible += 1
      })
      spec.style.display = specVisible ? '' : 'none'
      visible += specVisible
    })
    visibleCount.textContent = 'Mostrando ' + visible + ' de ' + ${total} + ' testes'
    empty.classList.toggle('is-visible', visible === 0)
  }

  document.querySelectorAll('.filter').forEach(function (button) {
    button.addEventListener('click', function () {
      activeFilter = button.getAttribute('data-filter')
      document.querySelectorAll('.filter').forEach(function (item) {
        var isActive = item === button
        item.classList.toggle('is-active', isActive)
        item.setAttribute('aria-selected', String(isActive))
      })
      applyFilters()
    })
  })

  searchInput.addEventListener('input', applyFilters)
  document.addEventListener('keydown', function (event) {
    if (event.key === '/' && document.activeElement !== searchInput) {
      event.preventDefault()
      searchInput.focus()
    }
  })

  if (!reduceMotion && passPercent === 100) {
    var canvas = document.getElementById('confetti')
    var context = canvas.getContext('2d')
    var particles = []
    var colors = ['#ff9a4d', '#ff5f8f', '#f472b6', '#14b8a6', '#22d3ee', '#34d399']
    var width = canvas.width = window.innerWidth
    var height = canvas.height = window.innerHeight

    window.addEventListener('resize', function () {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    })

    for (var i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * width,
        y: -20 - Math.random() * height * 0.5,
        size: 5 + Math.random() * 7,
        speed: 1.5 + Math.random() * 3,
        drift: -0.8 + Math.random() * 1.6,
        rotation: Math.random() * Math.PI,
        spin: -0.08 + Math.random() * 0.16,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        life: 1
      })
    }

    var started = performance.now()
    function draw (now) {
      var elapsed = now - started
      context.clearRect(0, 0, width, height)
      particles.forEach(function (particle) {
        particle.x += particle.drift
        particle.y += particle.speed
        particle.rotation += particle.spin
        if (elapsed > 1600) particle.life = Math.max(0, particle.life - 0.012)
        context.save()
        context.globalAlpha = particle.life
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        if (particle.shape === 'rect') {
          context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2)
        } else {
          context.beginPath()
          context.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
          context.fill()
        }
        context.restore()
      })
      if (now - started < 4200) requestAnimationFrame(draw)
      else context.clearRect(0, 0, width, height)
    }
    requestAnimationFrame(draw)
  }
})()
</script>
</body>
</html>`

fs.writeFileSync(outputPath, html)
console.log(`Relatorio HTML gerado em ${path.relative(root, outputPath)}`)
