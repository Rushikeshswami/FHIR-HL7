'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CURRICULUM,
  JOB_INDEX,
  TARGET_ORGS,
  COMP_LADDER,
  LINKEDIN_TEMPLATES,
  PYTHON_SIDECAR,
} from '@/lib/fhir-curriculum'
import {
  RESOURCE_CATALOG,
  FHIRPATH_CHEATS,
  TERMINOLOGY_SYSTEMS,
  OPERATIONS_CATALOG,
  IMPLEMENTATION_GUIDES,
  SMART_SCOPES,
  HL7V2_MESSAGE_TYPES,
  PRODUCTION_GOTCHAS,
  TOOLING,
  INTERVIEW_QUESTIONS,
  READINESS_CHECKLIST,
} from '@/lib/fhir-reference'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckCircle2, Circle, Code2, Copy, ExternalLink, FileJson, GraduationCap,
  ListChecks, Target, Trophy, XCircle, Zap, Rocket, BookOpen, Wrench,
  Library, AlertTriangle, Sparkles, MessageCircleQuestion,
} from 'lucide-react'

// ---------- helpers ----------
const getByPath = (obj, path) => {
  if (!obj) return undefined
  const parts = String(path).split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    const idx = /^\d+$/.test(p) ? Number(p) : p
    cur = cur[idx]
  }
  return cur
}

const flattenCodings = (obj, acc = []) => {
  if (!obj || typeof obj !== 'object') return acc
  if (Array.isArray(obj)) { obj.forEach((x) => flattenCodings(x, acc)); return acc }
  if (obj.system && obj.code !== undefined) acc.push({ system: obj.system, code: String(obj.code) })
  Object.values(obj).forEach((v) => flattenCodings(v, acc))
  return acc
}

const collectExtensionUrls = (obj, acc = []) => {
  if (!obj || typeof obj !== 'object') return acc
  if (Array.isArray(obj)) { obj.forEach((x) => collectExtensionUrls(x, acc)); return acc }
  if (obj.url && (obj.valueCode !== undefined || obj.valueString !== undefined || obj.valueCoding !== undefined || obj.valueQuantity !== undefined || Array.isArray(obj.extension))) {
    acc.push(obj.url)
  }
  Object.values(obj).forEach((v) => collectExtensionUrls(v, acc))
  return acc
}

const findBundleResource = (bundle, type) => {
  if (!bundle?.entry) return null
  const e = bundle.entry.find((x) => x?.resource?.resourceType === type)
  return e?.resource || null
}

// ---------- validation engine ----------
const validateChallenge = (raw, v) => {
  const failures = [], wins = []
  if (!raw || !raw.trim()) return { ok: false, failures: ['Empty submission.'], wins: [] }

  if (v.type === 'text') {
    const text = raw.trim()
    v.regexAll.forEach((pat) => {
      try { new RegExp(pat).test(text) ? wins.push(`Matched: ${pat}`) : failures.push(`Missing pattern: ${pat}`) }
      catch { failures.push(`Invalid pattern: ${pat}`) }
    })
    return { ok: failures.length === 0, failures, wins }
  }

  let parsed
  try { parsed = JSON.parse(raw) } catch (e) { return { ok: false, failures: [`Invalid JSON: ${e.message}`], wins: [] } }

  if (v.requiredKeys) v.requiredKeys.forEach((k) => {
    if (parsed[k] === undefined || parsed[k] === null) failures.push(`Missing required key: ${k}`)
    else wins.push(`Has key: ${k}`)
  })

  if (v.equals) Object.entries(v.equals).forEach(([k, val]) => {
    if (parsed[k] !== val) failures.push(`Expected ${k}=${JSON.stringify(val)}, got ${JSON.stringify(parsed[k])}`)
    else wins.push(`${k} matches`)
  })

  if (v.regex) v.regex.forEach((r) => {
    const val = getByPath(parsed, r.path)
    if (val === undefined) failures.push(`Path not found: ${r.path}`)
    else if (!new RegExp(r.pattern).test(String(val))) failures.push(`Path ${r.path} fails /${r.pattern}/ (got "${val}")`)
    else wins.push(`${r.path} OK`)
  })

  if (v.containsAny) v.containsAny.forEach((c) => {
    const arr = getByPath(parsed, c.path)
    const ok = Array.isArray(arr) && c.any.some((n) => arr.map(String).includes(n))
    ok ? wins.push(`${c.path} contains required`) : failures.push(`${c.path} must contain one of [${c.any.join(', ')}]`)
  })

  if (v.codingMatch) {
    const all = flattenCodings(parsed)
    v.codingMatch.forEach((c) => {
      const ok = all.some((x) => x.system === c.system && x.code === c.code)
      ok ? wins.push(`Coding ${c.code} found`) : failures.push(`Missing coding system=${c.system} code=${c.code}`)
    })
  }

  if (v.quantityMatch) {
    const q = getByPath(parsed, v.quantityMatch.path)
    if (!q || typeof q !== 'object') failures.push(`Missing quantity at ${v.quantityMatch.path}`)
    else {
      q.value === v.quantityMatch.value ? wins.push('quantity.value matches') : failures.push(`quantity.value expected ${v.quantityMatch.value}, got ${q.value}`)
      if (v.quantityMatch.code) (q.code === v.quantityMatch.code ? wins.push('quantity.code matches') : failures.push(`quantity.code expected ${v.quantityMatch.code}, got ${q.code}`))
    }
  }

  if (v.componentMatch) {
    const comps = parsed.component || []
    v.componentMatch.forEach((cm) => {
      const found = comps.find((c) => flattenCodings(c.code || {}).some((x) => x.code === cm.code))
      if (!found) { failures.push(`Missing component code ${cm.code}`); return }
      const vq = found.valueQuantity || {}
      vq.value === cm.value ? wins.push(`component ${cm.code} value=${cm.value}`) : failures.push(`component ${cm.code} expected value ${cm.value}, got ${vq.value}`)
      if (cm.ucum) (vq.code === cm.ucum ? wins.push(`component ${cm.code} UCUM ok`) : failures.push(`component ${cm.code} UCUM expected ${cm.ucum}, got ${vq.code}`))
    })
  }

  if (v.extensionUrls) {
    const urls = collectExtensionUrls(parsed)
    v.extensionUrls.forEach((u) => urls.includes(u) ? wins.push(`extension ${u.split('/').pop()} found`) : failures.push(`Missing extension URL: ${u}`))
  }

  if (v.bundleEntries) {
    const types = (parsed.entry || []).map((e) => e?.resource?.resourceType).filter(Boolean)
    v.bundleEntries.forEach((t) => types.includes(t) ? wins.push(`Bundle has ${t}`) : failures.push(`Bundle missing entry for ${t}`))
    ;(parsed.entry || []).forEach((e, i) => {
      if (!e.request?.method) failures.push(`entry[${i}] missing request.method`)
      if (!e.request?.url) failures.push(`entry[${i}] missing request.url`)
    })
  }

  if (v.fullUrls) {
    const urls = (parsed.entry || []).map((e) => e.fullUrl)
    v.fullUrls.forEach((u) => urls.includes(u) ? wins.push(`fullUrl ${u}`) : failures.push(`Missing fullUrl: ${u}`))
  }

  if (v.bundleResourceCheck) {
    Object.entries(v.bundleResourceCheck).forEach(([type, sub]) => {
      const res = findBundleResource(parsed, type)
      if (!res) { failures.push(`Bundle missing ${type} resource`); return }
      const r = validateChallenge(JSON.stringify(res), { type: 'json', ...sub })
      r.wins.forEach((w) => wins.push(`${type}: ${w}`))
      r.failures.forEach((f) => failures.push(`${type}: ${f}`))
    })
  }

  return { ok: failures.length === 0, failures, wins }
}

// ---------- diff viewer ----------
const DiffViewer = ({ userInput, reference }) => {
  const userText = userInput || ''
  const refText = typeof reference === 'string' ? reference : JSON.stringify(reference, null, 2)
  const userLines = userText.split('\n')
  const refLines = refText.split('\n')
  const max = Math.max(userLines.length, refLines.length)

  return (
    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-rose-400 mb-1 font-semibold">Your Submission</div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto max-h-[420px]">
          {Array.from({ length: max }).map((_, i) => {
            const u = userLines[i] ?? ''
            const r = refLines[i] ?? ''
            const same = u.trim() === r.trim()
            return (
              <div key={i} className={`px-3 py-0.5 ${u === '' ? '' : same ? 'text-zinc-400' : 'bg-rose-500/10 text-rose-200'}`}>
                <span className="text-zinc-600 mr-2 select-none">{(i + 1).toString().padStart(3, ' ')}</span>{u || '\u00A0'}
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1 font-semibold">Reference Template</div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-auto max-h-[420px]">
          {Array.from({ length: max }).map((_, i) => {
            const u = userLines[i] ?? ''
            const r = refLines[i] ?? ''
            const same = u.trim() === r.trim()
            return (
              <div key={i} className={`px-3 py-0.5 ${r === '' ? '' : same ? 'text-zinc-400' : 'bg-emerald-500/10 text-emerald-200'}`}>
                <span className="text-zinc-600 mr-2 select-none">{(i + 1).toString().padStart(3, ' ')}</span>{r || '\u00A0'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---------- atoms ----------
const CodeBlock = ({ value }) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-200 overflow-auto max-h-[420px] font-mono leading-relaxed">{text}</pre>
      <Button size="sm" variant="secondary" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
        onClick={() => navigator.clipboard.writeText(text)}>
        <Copy className="w-3 h-3 mr-1" /> Copy
      </Button>
    </div>
  )
}

const STORAGE_KEY = 'fhir-accelerator-v2'

// ---------- challenge card (reused by learn / revision / project milestones) ----------
const ChallengeBlock = ({ ch, submission, result, onChange, onSubmit, onLoadTemplate, onReset }) => {
  const [showDiff, setShowDiff] = useState(false)
  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" /> {ch.title}
          </CardTitle>
          {result && (
            <Badge variant="outline" className={result.ok ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10' : 'border-rose-500/50 text-rose-300 bg-rose-500/10'}>
              {result.ok ? '✓ Passed' : `✗ ${result.failures.length} issue${result.failures.length === 1 ? '' : 's'}`}
            </Badge>
          )}
        </div>
        <CardDescription className="text-zinc-300 leading-relaxed pt-1 whitespace-pre-wrap">{ch.prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea rows={10} value={submission || ''} onChange={(e) => onChange(e.target.value)}
          placeholder={ch.validator.type === 'json' ? '{\n  "resourceType": "...",\n  ...\n}' : 'Paste your answer string here...'}
          className="font-mono text-xs bg-zinc-950 border-zinc-800 text-zinc-200 min-h-[220px]" />
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={onSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold">Submit & Validate</Button>
          <Button size="sm" variant="outline" onClick={onReset} className="border-zinc-700">Reset</Button>
          <Button size="sm" variant="ghost" onClick={onLoadTemplate}>Load Reference</Button>
          {result && submission && (
            <Button size="sm" variant="ghost" onClick={() => setShowDiff((s) => !s)}>
              {showDiff ? 'Hide Diff' : 'Show Diff'}
            </Button>
          )}
        </div>

        {result && (
          <div className={`rounded-lg border-2 p-3 ${result.ok ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-rose-500/60 bg-rose-500/5'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              <span className={`text-sm font-semibold ${result.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                {result.ok ? 'Validation Passed' : 'Validation Failed'}
              </span>
            </div>
            {result.failures.length > 0 && (
              <ul className="text-xs space-y-0.5 mb-2">
                {result.failures.map((f, i) => <li key={i} className="text-rose-300/90 font-mono">✗ {f}</li>)}
              </ul>
            )}
            {result.wins.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-emerald-400/80">Show {result.wins.length} passed checks</summary>
                <ul className="mt-1.5 space-y-0.5">
                  {result.wins.map((w, i) => <li key={i} className="text-emerald-300/80 font-mono">✓ {w}</li>)}
                </ul>
              </details>
            )}
            {showDiff && typeof ch.template !== 'string' && <div className="mt-3"><DiffViewer userInput={submission} reference={ch.template} /></div>}
            {showDiff && typeof ch.template === 'string' && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                <div><div className="text-rose-400 text-[10px] uppercase mb-1">Yours</div><pre className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 whitespace-pre-wrap">{submission}</pre></div>
                <div><div className="text-emerald-400 text-[10px] uppercase mb-1">Reference</div><pre className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 whitespace-pre-wrap">{ch.template}</pre></div>
              </div>
            )}
            <Separator className="bg-zinc-800 my-3" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2 font-semibold">Reference Template</div>
              {typeof ch.template === 'string'
                ? <pre className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-300 whitespace-pre-wrap font-mono">{ch.template}</pre>
                : <CodeBlock value={ch.template} />}
              <div className="mt-2 space-y-1">
                {ch.notes?.map((n, i) => (
                  <p key={i} className="text-xs text-zinc-400 leading-relaxed">
                    <span className="text-amber-400 font-semibold">Note · </span>{n}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function App() {
  const [activeDay, setActiveDay] = useState(1)
  const [submissions, setSubmissions] = useState({}) // key: day_chId
  const [results, setResults] = useState({})
  const [pythonChecks, setPythonChecks] = useState({})
  const [view, setView] = useState('learn')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const s = JSON.parse(raw)
        setSubmissions(s.submissions || {})
        setResults(s.results || {})
        setPythonChecks(s.pythonChecks || {})
        if (s.activeDay) setActiveDay(s.activeDay)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ submissions, results, pythonChecks, activeDay })) } catch {}
  }, [submissions, results, pythonChecks, activeDay])

  const day = CURRICULUM.find((d) => d.day === activeDay) || CURRICULUM[0]

  const getChallenges = (d) => d.challenges || d.drills || d.milestones || []

  const dayPassed = (d) => {
    const chs = getChallenges(d)
    if (chs.length === 0) return false
    return chs.every((c) => results[`${d.day}_${c.id}`]?.ok)
  }

  const stats = useMemo(() => {
    const passedDays = CURRICULUM.filter((d) => dayPassed(d)).length
    const totalDays = CURRICULUM.length
    const allRes = Object.values(results)
    const scores = allRes.map((r) => {
      const t = (r.wins?.length || 0) + (r.failures?.length || 0)
      return t ? (r.wins.length / t) * 100 : 0
    })
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const certReady = passedDays >= 6 && avg >= 80
    return { passedDays, totalDays, avg, certReady, pct: Math.round((passedDays / totalDays) * 100), attempted: allRes.length }
  }, [results])

  const handleSubmit = (chId, validator) => {
    const key = `${activeDay}_${chId}`
    const res = validateChallenge(submissions[key] || '', validator)
    setResults((p) => ({ ...p, [key]: res }))
  }
  const handleChange = (chId, val) => setSubmissions((p) => ({ ...p, [`${activeDay}_${chId}`]: val }))
  const loadTemplate = (chId, template) => {
    const t = typeof template === 'string' ? template : JSON.stringify(template, null, 2)
    setSubmissions((p) => ({ ...p, [`${activeDay}_${chId}`]: t }))
  }
  const resetChallenge = (chId) => {
    const key = `${activeDay}_${chId}`
    setSubmissions((p) => { const c = { ...p }; delete c[key]; return c })
    setResults((p) => { const c = { ...p }; delete c[key]; return c })
  }

  const togglePy = (i) => setPythonChecks((p) => ({ ...p, [i]: !p[i] }))
  const pyDone = Object.values(pythonChecks).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">FHIR Mastery Accelerator</h1>
              <p className="text-xs text-zinc-400">5-Day Learn · Sat Revision · Sun Project · Local-only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={view === 'learn' ? 'default' : 'ghost'} size="sm" onClick={() => setView('learn')}>
              <GraduationCap className="w-4 h-4 mr-1.5" /> Learn
            </Button>
            <Button variant={view === 'library' ? 'default' : 'ghost'} size="sm" onClick={() => setView('library')}>
              <Library className="w-4 h-4 mr-1.5" /> Reference Library
            </Button>
            <Button variant={view === 'matrix' ? 'default' : 'ghost'} size="sm" onClick={() => setView('matrix')}>
              <Target className="w-4 h-4 mr-1.5" /> Career Matrix
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {view === 'learn' && (
          <>
            <Card className="mb-6 border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base"><Trophy className="w-4 h-4 text-amber-400" /> Master Roadmap</CardTitle>
                    <CardDescription>Mon–Fri learn modules · Sat HL7v2 revision drills · Sun mini-project. Day = passed when ALL sub-tasks green.</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{stats.pct}%</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">Completion</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-400">{stats.avg}%</div>
                      <div className="text-[10px] uppercase tracking-wide text-zinc-500">Grade Avg</div>
                    </div>
                    <Badge variant="outline" className={stats.certReady ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 text-zinc-400'}>
                      {stats.certReady ? '✓ Mastery Ready' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={stats.pct} className="h-2 mb-4" />
                <div className="grid grid-cols-7 gap-2">
                  {CURRICULUM.map((d) => {
                    const pass = dayPassed(d)
                    const chs = getChallenges(d)
                    const attempted = chs.some((c) => results[`${d.day}_${c.id}`])
                    const active = d.day === activeDay
                    const Icon = d.kind === 'project' ? Rocket : d.kind === 'revision' ? Wrench : BookOpen
                    return (
                      <button key={d.day} onClick={() => setActiveDay(d.day)}
                        className={`group relative rounded-lg border p-3 text-left transition-all ${
                          active ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
                            <Icon className="w-3 h-3" /> {d.dayLabel}
                          </div>
                          {pass ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : attempted ? <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            : <Circle className="w-3.5 h-3.5 text-zinc-600" />}
                        </div>
                        <div className="text-[11px] font-medium leading-tight text-zinc-300 line-clamp-2">
                          {d.title.split(':')[0].replace('Saturday Revision · ', '').replace('Sunday Mini-Project · ', '')}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${
                        day.kind === 'project' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : day.kind === 'revision' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      } hover:opacity-100`}>{day.dayLabel} · Day {day.day}</Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 capitalize">{day.kind}</Badge>
                    </div>
                    <CardTitle className="text-xl">{day.title}</CardTitle>
                    <CardDescription className="text-zinc-400">{day.tagline}</CardDescription>
                  </CardHeader>
                </Card>

                {/* LEARN VIEW */}
                {day.kind === 'learn' && (
                  <Tabs defaultValue="concepts" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                      <TabsTrigger value="concepts">Concept Deck</TabsTrigger>
                      <TabsTrigger value="deep">Deep-Dive</TabsTrigger>
                      <TabsTrigger value="playground">Playground</TabsTrigger>
                      <TabsTrigger value="challenges">Challenges ({day.challenges.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="concepts" className="mt-4">
                      <Card className="border-zinc-800 bg-zinc-900/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="w-4 h-4 text-cyan-400" /> High-yield production rules</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {day.concepts.map((c, i) => (
                              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="text-zinc-300">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="deep" className="mt-4">
                      <Card className="border-zinc-800 bg-zinc-900/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Mapping strategies & structural specs</CardTitle></CardHeader>
                        <CardContent>
                          <Accordion type="multiple" className="w-full">
                            {day.accordions.map((a, i) => (
                              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                                <AccordionTrigger className="text-sm hover:no-underline">{a.title}</AccordionTrigger>
                                <AccordionContent>
                                  <ul className="space-y-1.5 text-sm text-zinc-300 font-mono">
                                    {a.body.map((b, j) => <li key={j} className="pl-4 border-l border-zinc-800">{b}</li>)}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="playground" className="mt-4 space-y-4">
                      {day.payloads.map((p, i) => (
                        <Card key={i} className="border-zinc-800 bg-zinc-900/60">
                          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileJson className="w-4 h-4 text-cyan-400" /> {p.label}</CardTitle></CardHeader>
                          <CardContent><CodeBlock value={p.json} /></CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="challenges" className="mt-4 space-y-4">
                      {day.challenges.map((ch) => (
                        <ChallengeBlock key={ch.id} ch={ch}
                          submission={submissions[`${day.day}_${ch.id}`]}
                          result={results[`${day.day}_${ch.id}`]}
                          onChange={(v) => handleChange(ch.id, v)}
                          onSubmit={() => handleSubmit(ch.id, ch.validator)}
                          onLoadTemplate={() => loadTemplate(ch.id, ch.template)}
                          onReset={() => resetChallenge(ch.id)} />
                      ))}
                    </TabsContent>
                  </Tabs>
                )}

                {/* REVISION VIEW */}
                {day.kind === 'revision' && (
                  <Tabs defaultValue="recap" className="w-full">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                      <TabsTrigger value="recap">Concept Recap</TabsTrigger>
                      <TabsTrigger value="maps">Field Maps</TabsTrigger>
                      <TabsTrigger value="drills">Drills ({day.drills.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="recap" className="mt-4">
                      <Card className="border-zinc-800 bg-zinc-900/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">Week 1 recap + HL7v2 foundations</CardTitle></CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {day.concepts.map((c, i) => (
                              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="text-zinc-300">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="maps" className="mt-4">
                      <Card className="border-zinc-800 bg-zinc-900/60">
                        <CardHeader className="pb-3"><CardTitle className="text-base">HL7v2 → FHIR field maps</CardTitle></CardHeader>
                        <CardContent>
                          <Accordion type="multiple" className="w-full">
                            {day.accordions.map((a, i) => (
                              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                                <AccordionTrigger className="text-sm hover:no-underline">{a.title}</AccordionTrigger>
                                <AccordionContent>
                                  <ul className="space-y-1.5 text-sm text-zinc-300 font-mono">
                                    {a.body.map((b, j) => <li key={j} className="pl-4 border-l border-zinc-800">{b}</li>)}
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="drills" className="mt-4 space-y-4">
                      {day.drills.map((ch) => (
                        <ChallengeBlock key={ch.id} ch={ch}
                          submission={submissions[`${day.day}_${ch.id}`]}
                          result={results[`${day.day}_${ch.id}`]}
                          onChange={(v) => handleChange(ch.id, v)}
                          onSubmit={() => handleSubmit(ch.id, ch.validator)}
                          onLoadTemplate={() => loadTemplate(ch.id, ch.template)}
                          onReset={() => resetChallenge(ch.id)} />
                      ))}
                    </TabsContent>
                  </Tabs>
                )}

                {/* PROJECT VIEW */}
                {day.kind === 'project' && (
                  <div className="space-y-4">
                    <Card className="border-purple-500/30 bg-purple-500/5">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Rocket className="w-4 h-4 text-purple-400" /> Project Brief</CardTitle></CardHeader>
                      <CardContent>
                        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed bg-zinc-950 border border-zinc-800 rounded-lg p-4">{day.brief.join('\n')}</pre>
                      </CardContent>
                    </Card>

                    {day.milestones.map((ch, idx) => (
                      <div key={ch.id} className="relative">
                        <div className="absolute -left-3 top-4 w-6 h-6 rounded-full bg-purple-500 text-zinc-950 grid place-items-center text-xs font-bold z-10">{idx + 1}</div>
                        <ChallengeBlock ch={ch}
                          submission={submissions[`${day.day}_${ch.id}`]}
                          result={results[`${day.day}_${ch.id}`]}
                          onChange={(v) => handleChange(ch.id, v)}
                          onSubmit={() => handleSubmit(ch.id, ch.validator)}
                          onLoadTemplate={() => loadTemplate(ch.id, ch.template)}
                          onReset={() => resetChallenge(ch.id)} />
                      </div>
                    ))}

                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileJson className="w-4 h-4 text-emerald-400" /> {day.finalReference.label}</CardTitle></CardHeader>
                      <CardContent><CodeBlock value={day.finalReference.json} /></CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">🐍 Python Self-Revision Sidecar</CardTitle>
                    <CardDescription className="text-xs">FHIR-specific muscle memory.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">Mastered</span>
                      <span className="text-emerald-400 font-semibold">{pyDone} / {PYTHON_SIDECAR.length}</span>
                    </div>
                    <Progress value={(pyDone / PYTHON_SIDECAR.length) * 100} className="h-1.5 mb-2" />
                    {PYTHON_SIDECAR.map((item, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer">
                        <Checkbox checked={!!pythonChecks[i]} onCheckedChange={() => togglePy(i)} className="mt-0.5" />
                        <span className={`text-xs leading-relaxed ${pythonChecks[i] ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{item}</span>
                      </label>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-zinc-400">Days Passed</span><span className="text-emerald-400 font-semibold">{stats.passedDays} / {stats.totalDays}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Tasks Attempted</span><span className="text-cyan-400 font-semibold">{stats.attempted}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Avg Grade</span><span className="text-amber-400 font-semibold">{stats.avg}%</span></div>
                    <Separator className="bg-zinc-800 my-2" />
                    <p className="text-zinc-500 leading-relaxed">Mastery threshold: <span className="text-zinc-300">6 / 7 days</span> + <span className="text-zinc-300">≥ 80%</span> avg.</p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        )}

        {view === 'matrix' && <CareerMatrix />}
        {view === 'library' && <ReferenceLibrary />}
      </main>

      <footer className="border-t border-zinc-800/60 mt-12 py-6 text-center text-xs text-zinc-500">
        Private local LMS · No data leaves your browser · Progress persisted via localStorage
      </footer>
    </div>
  )
}

const CareerMatrix = () => {
  const [copied, setCopied] = useState(null)
  const copy = (i, text) => { navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500) }
  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-emerald-400" /> Target Architecture Matrix</CardTitle>
          <CardDescription>India market switch playbook — roles, target enterprises, comp ladder, outreach engine.</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base">Industry Job Target Index</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {JOB_INDEX.map((j, i) => (
              <div key={i} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                <div className="font-semibold text-sm text-emerald-300">{j.role}</div>
                <div className="text-xs text-zinc-400 mt-1">{j.focus}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader><CardTitle className="text-base">Prime GCCs & Product Orgs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {TARGET_ORGS.map((o, i) => (
                <div key={i} className="p-2.5 rounded-md bg-zinc-950/50 border border-zinc-800">
                  <div className="text-sm font-semibold text-cyan-300">{o.name}</div>
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500 mt-0.5">{o.type}</div>
                  <div className="text-xs text-zinc-400">{o.location}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader><CardTitle className="text-base">Comp Progression Ladder (India · 2025)</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="text-left py-2 px-3">Level</th>
                  <th className="text-left py-2 px-3">CTC Range</th>
                  <th className="text-left py-2 px-3">Hire Signals</th>
                </tr>
              </thead>
              <tbody>
                {COMP_LADDER.map((c, i) => (
                  <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-semibold text-zinc-200">{c.level}</td>
                    <td className="py-3 px-3 text-emerald-300 font-mono whitespace-nowrap">{c.range}</td>
                    <td className="py-3 px-3 text-zinc-400 text-xs">{c.signals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader><CardTitle className="text-base">Outreach & Resume Engine</CardTitle><CardDescription>3 production-ready LinkedIn templates · paste, fill the curly-braces, send.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {LINKEDIN_TEMPLATES.map((t, i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60">
                <div className="text-sm font-semibold text-cyan-300">{t.title}</div>
                <Button size="sm" variant="ghost" onClick={() => copy(i, t.body)}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> {copied === i ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="p-4 text-xs whitespace-pre-wrap font-mono text-zinc-300 leading-relaxed">{t.body}</pre>
            </div>
          ))}
          <Separator className="bg-zinc-800" />
          <div>
            <div className="text-sm font-semibold mb-2 text-zinc-200">Sourcing Keywords · One-click search</div>
            <div className="flex flex-wrap gap-2">
              {['FHIR Integration Engineer', 'Interoperability Analyst', 'HL7 FHIR Python', 'SMART on FHIR', 'US Core profile', 'Healthcare Integration Specialist', 'HAPI FHIR engineer', 'Mirth Connect engineer'].map((kw) => (
                <a key={kw} href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(kw)}&location=India`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition">
                  {kw} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------- REFERENCE LIBRARY VIEW ----------
const ReferenceLibrary = () => {
  const [tab, setTab] = useState('catalog')
  const [openQ, setOpenQ] = useState(null)

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Library className="w-5 h-5 text-cyan-400" /> Reference Library
          </CardTitle>
          <CardDescription>
            The HL7.org-grade material the 5-day path does not drill into. Daily reference + interview prep.
            Covers payer/financial resources, FHIRPath, terminology systems, $operations, IGs, SMART scopes,
            HL7v2 catalog, production gotchas, tooling, and 15 high-yield interview Q&amp;A.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 flex-wrap h-auto">
          <TabsTrigger value="catalog">Resource Catalog</TabsTrigger>
          <TabsTrigger value="terms">Terminology</TabsTrigger>
          <TabsTrigger value="ops">$Operations</TabsTrigger>
          <TabsTrigger value="fhirpath">FHIRPath</TabsTrigger>
          <TabsTrigger value="igs">Implementation Guides</TabsTrigger>
          <TabsTrigger value="smart">SMART Scopes</TabsTrigger>
          <TabsTrigger value="hl7v2">HL7v2 Catalog</TabsTrigger>
          <TabsTrigger value="gotchas">Production Gotchas</TabsTrigger>
          <TabsTrigger value="tooling">Tooling</TabsTrigger>
          <TabsTrigger value="interview">Interview Bank</TabsTrigger>
          <TabsTrigger value="checklist">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4 space-y-4">
          {RESOURCE_CATALOG.map((g, gi) => (
            <Card key={gi} className="border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> {g.group}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {g.items.map((r, ri) => (
                    <AccordionItem key={ri} value={`r-${gi}-${ri}`} className="border-zinc-800">
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-300">{r.name}</span>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">FMM {r.fmm}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-zinc-300 mb-2">{r.purpose}</p>
                        <p className="text-xs text-zinc-400 font-mono leading-relaxed pl-3 border-l-2 border-zinc-800">
                          {r.keyFields}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="terms" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Terminology Systems · Canonical URL Master</CardTitle>
              <CardDescription>Memorise these URLs cold — every code in production goes through one of them.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="text-left py-2 px-3">System</th>
                      <th className="text-left py-2 px-3">Canonical URL</th>
                      <th className="text-left py-2 px-3">Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TERMINOLOGY_SYSTEMS.map((t, i) => (
                      <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                        <td className="py-2 px-3 font-semibold text-emerald-300 whitespace-nowrap">{t.name}</td>
                        <td className="py-2 px-3 text-cyan-300 font-mono text-xs break-all">{t.canonical}</td>
                        <td className="py-2 px-3 text-zinc-400 text-xs">{t.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">$Operations Catalog</CardTitle>
              <CardDescription>Operations prefixed with $ — extended verbs beyond REST.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {OPERATIONS_CATALOG.map((o, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-mono text-sm text-amber-300">{o.op}</span>
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">{o.scope}</Badge>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono">{o.use}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fhirpath" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">FHIRPath Cheatsheet</CardTitle>
              <CardDescription>Path expression language used in invariants, Subscription criteria, custom evaluators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {FHIRPATH_CHEATS.map((c, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-2 p-2.5 rounded-md bg-zinc-950/50 border border-zinc-800">
                  <code className="text-xs text-emerald-300 font-mono break-all">{c.expr}</code>
                  <span className="text-xs text-zinc-400">{c.meaning}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="igs" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Implementation Guides (IGs)</CardTitle>
              <CardDescription>Recognise these names. Know what each is for. Especially Da Vinci + CARIN BB for payer roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {IMPLEMENTATION_GUIDES.map((g, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-emerald-300">{g.ig}</span>
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">{g.body}</span>
                  </div>
                  <p className="text-xs text-zinc-300">{g.focus}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smart" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">SMART on FHIR Scopes</CardTitle>
              <CardDescription>What you ask for in the OAuth authorize call → what the token can actually do.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SMART_SCOPES.map((s, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-2 p-2.5 rounded-md bg-zinc-950/50 border border-zinc-800">
                  <code className="text-xs text-amber-300 font-mono break-all">{s.scope}</code>
                  <span className="text-xs text-zinc-400">{s.meaning}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hl7v2" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">HL7v2 Message Type → FHIR Target</CardTitle>
              <CardDescription>The legacy messages you will receive in real integration roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-left py-2 px-3">Meaning</th>
                      <th className="text-left py-2 px-3">FHIR Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {HL7V2_MESSAGE_TYPES.map((m, i) => (
                      <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                        <td className="py-2 px-3 font-mono text-amber-300 whitespace-nowrap">{m.type}</td>
                        <td className="py-2 px-3 text-zinc-300 text-xs">{m.meaning}</td>
                        <td className="py-2 px-3 text-zinc-400 text-xs">{m.fhirTarget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gotchas" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Production Gotchas
              </CardTitle>
              <CardDescription>Pitfalls that turn a passing demo into a 3 AM page. Read once a week.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {PRODUCTION_GOTCHAS.map((g, i) => (
                  <AccordionItem key={i} value={`g-${i}`} className="border-zinc-800">
                    <AccordionTrigger className="text-sm hover:no-underline text-left">
                      <span className="text-amber-300">{g.topic}</span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-xs text-zinc-300 leading-relaxed">{g.detail}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tooling" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tooling You Should Touch Once</CardTitle>
              <CardDescription>Don&apos;t just read — actually run each of these at least once before interviews.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {TOOLING.map((t, i) => (
                <div key={i} className="p-3 rounded-lg bg-zinc-950/50 border border-zinc-800">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-emerald-300">{t.name}</span>
                    <a href={t.url.startsWith('http') ? t.url : '#'} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-cyan-400 hover:underline font-mono inline-flex items-center gap-1">
                      {t.url.length > 50 ? t.url.slice(0, 50) + '...' : t.url}
                      {t.url.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                    </a>
                  </div>
                  <p className="text-xs text-zinc-400">{t.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircleQuestion className="w-4 h-4 text-cyan-400" /> Interview Question Bank
              </CardTitle>
              <CardDescription>15 high-yield questions. Click to reveal model answer. Practice saying them out loud.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {INTERVIEW_QUESTIONS.map((q, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/50">
                  <button onClick={() => setOpenQ(openQ === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-zinc-900/40 transition">
                    <span className="text-sm text-emerald-300 font-medium">{i + 1}. {q.q}</span>
                    <span className="text-xs text-zinc-500">{openQ === i ? 'Hide' : 'Reveal'}</span>
                  </button>
                  {openQ === i && (
                    <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{q.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4 space-y-3">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Role-Switch Readiness Checklist</CardTitle>
              <CardDescription>Tick each item once you can explain/demo it without notes. Aim for ≥ 80% per area before applying.</CardDescription>
            </CardHeader>
          </Card>
          {READINESS_CHECKLIST.map((s, i) => (
            <ReadinessSection key={i} section={s} idx={i} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}

const ReadinessSection = ({ section, idx }) => {
  const storageKey = `fhir-readiness-${idx}`
  const [checks, setChecks] = useState({})
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setChecks(JSON.parse(raw))
    } catch {}
  }, [storageKey])
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(checks)) } catch {}
  }, [checks, storageKey])

  const done = Object.values(checks).filter(Boolean).length
  const pct = section.items.length ? (done / section.items.length) * 100 : 0

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm text-emerald-300">{section.area}</CardTitle>
          <span className="text-xs text-zinc-400">{done} / {section.items.length}</span>
        </div>
        <Progress value={pct} className="h-1 mt-1" />
      </CardHeader>
      <CardContent className="space-y-1.5">
        {section.items.map((item, i) => (
          <label key={i} className="flex items-start gap-2 cursor-pointer">
            <Checkbox checked={!!checks[i]} onCheckedChange={() => setChecks((p) => ({ ...p, [i]: !p[i] }))} className="mt-0.5" />
            <span className={`text-xs leading-relaxed ${checks[i] ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{item}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}

export default App


