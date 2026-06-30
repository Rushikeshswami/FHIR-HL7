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

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CheckCircle2,
  Circle,
  Code2,
  Copy,
  ExternalLink,
  FileJson,
  GraduationCap,
  ListChecks,
  Target,
  Trophy,
  XCircle,
  Zap,
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
  if (Array.isArray(obj)) {
    obj.forEach((x) => flattenCodings(x, acc))
    return acc
  }
  if (obj.system && obj.code !== undefined) acc.push({ system: obj.system, code: String(obj.code) })
  Object.values(obj).forEach((v) => flattenCodings(v, acc))
  return acc
}

// ---------- validation engine ----------
const validateChallenge = (raw, v) => {
  const failures = []
  const wins = []

  if (!raw || !raw.trim()) {
    return { ok: false, failures: ['Empty submission.'], wins: [] }
  }

  if (v.type === 'text') {
    const text = raw.trim()
    v.regexAll.forEach((pat) => {
      const re = new RegExp(pat)
      if (re.test(text)) wins.push(`Matched: ${pat}`)
      else failures.push(`Missing pattern: ${pat}`)
    })
    return { ok: failures.length === 0, failures, wins }
  }

  // JSON validator
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    return { ok: false, failures: [`Invalid JSON: ${e.message}`], wins: [] }
  }

  if (v.requiredKeys) {
    v.requiredKeys.forEach((k) => {
      if (parsed[k] === undefined || parsed[k] === null) failures.push(`Missing required key: ${k}`)
      else wins.push(`Has key: ${k}`)
    })
  }

  if (v.equals) {
    Object.entries(v.equals).forEach(([k, val]) => {
      if (parsed[k] !== val) failures.push(`Expected ${k} = ${JSON.stringify(val)}, got ${JSON.stringify(parsed[k])}`)
      else wins.push(`${k} matches`)
    })
  }

  if (v.regex) {
    v.regex.forEach((r) => {
      const val = getByPath(parsed, r.path)
      if (val === undefined) failures.push(`Path not found: ${r.path}`)
      else if (!new RegExp(r.pattern).test(String(val))) failures.push(`Path ${r.path} fails regex ${r.pattern} (got "${val}")`)
      else wins.push(`${r.path} OK`)
    })
  }

  if (v.containsAny) {
    v.containsAny.forEach((c) => {
      const arr = getByPath(parsed, c.path)
      const ok = Array.isArray(arr) && c.any.some((needle) => arr.map(String).includes(needle))
      if (!ok) failures.push(`${c.path} must contain one of [${c.any.join(', ')}]`)
      else wins.push(`${c.path} contains required value`)
    })
  }

  if (v.codingMatch) {
    const all = flattenCodings(parsed)
    v.codingMatch.forEach((c) => {
      const ok = all.some((x) => x.system === c.system && x.code === c.code)
      if (!ok) failures.push(`Missing coding system=${c.system} code=${c.code}`)
      else wins.push(`Coding ${c.code} found`)
    })
  }

  if (v.quantityMatch) {
    const q = getByPath(parsed, v.quantityMatch.path)
    if (!q || typeof q !== 'object') failures.push(`Missing quantity at ${v.quantityMatch.path}`)
    else {
      if (q.value !== v.quantityMatch.value) failures.push(`quantity.value expected ${v.quantityMatch.value}, got ${q.value}`)
      else wins.push('quantity.value matches')
      if (v.quantityMatch.code && q.code !== v.quantityMatch.code) failures.push(`quantity.code expected ${v.quantityMatch.code}, got ${q.code}`)
      else if (v.quantityMatch.code) wins.push('quantity.code matches')
    }
  }

  return { ok: failures.length === 0, failures, wins }
}

// ---------- UI atoms ----------
const CodeBlock = ({ value }) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-200 overflow-auto max-h-[420px] font-mono leading-relaxed">
{text}
      </pre>
      <Button
        size="sm"
        variant="secondary"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
        onClick={() => navigator.clipboard.writeText(text)}
      >
        <Copy className="w-3 h-3 mr-1" /> Copy
      </Button>
    </div>
  )
}

const STORAGE_KEY = 'fhir-accelerator-state-v1'

function App() {
  const [activeDay, setActiveDay] = useState(1)
  const [submissions, setSubmissions] = useState({}) // {day: text}
  const [results, setResults] = useState({}) // {day: {ok, failures, wins, score}}
  const [pythonChecks, setPythonChecks] = useState({})
  const [view, setView] = useState('learn') // learn | matrix

  // hydrate localStorage
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
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ submissions, results, pythonChecks, activeDay })
      )
    } catch {}
  }, [submissions, results, pythonChecks, activeDay])

  const day = CURRICULUM.find((d) => d.day === activeDay) || CURRICULUM[0]

  const stats = useMemo(() => {
    const passed = Object.values(results).filter((r) => r?.ok).length
    const attempted = Object.keys(results).length
    const scores = Object.values(results).map((r) => {
      const total = (r.wins?.length || 0) + (r.failures?.length || 0)
      return total ? Math.round((r.wins.length / total) * 100) : 0
    })
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    const certReady = passed >= 6 && avg >= 80
    return { passed, attempted, avg, certReady, pct: Math.round((passed / 7) * 100) }
  }, [results])

  const handleSubmit = () => {
    const raw = submissions[activeDay] || ''
    const res = validateChallenge(raw, day.challenge.validator)
    setResults((prev) => ({ ...prev, [activeDay]: res }))
  }

  const resetDay = () => {
    setSubmissions((p) => ({ ...p, [activeDay]: '' }))
    setResults((p) => {
      const c = { ...p }
      delete c[activeDay]
      return c
    })
  }

  const togglePy = (i) => setPythonChecks((p) => ({ ...p, [i]: !p[i] }))
  const pyDone = Object.values(pythonChecks).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 grid place-items-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">
                FHIR Mastery Accelerator
              </h1>
              <p className="text-xs text-zinc-400">7-Day Private LMS · R4 / US Core / SMART · Local-only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'learn' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('learn')}
            >
              <GraduationCap className="w-4 h-4 mr-1.5" /> Learn
            </Button>
            <Button
              variant={view === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('matrix')}
            >
              <Target className="w-4 h-4 mr-1.5" /> Career Matrix
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {view === 'learn' && (
          <>
            {/* Roadmap Panel */}
            <Card className="mb-6 border-zinc-800 bg-zinc-900/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="w-4 h-4 text-amber-400" /> Master Roadmap
                    </CardTitle>
                    <CardDescription>Track your 7-day progression. Pass = all validator checks green.</CardDescription>
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
                    <Badge
                      variant="outline"
                      className={
                        stats.certReady
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-zinc-700 text-zinc-400'
                      }
                    >
                      {stats.certReady ? '✓ Certification Ready' : 'In Progress'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={stats.pct} className="h-2 mb-4" />
                <div className="grid grid-cols-7 gap-2">
                  {CURRICULUM.map((d) => {
                    const r = results[d.day]
                    const status = r?.ok ? 'pass' : r ? 'fail' : 'pending'
                    const active = d.day === activeDay
                    return (
                      <button
                        key={d.day}
                        onClick={() => setActiveDay(d.day)}
                        className={`group relative rounded-lg border p-3 text-left transition-all ${
                          active
                            ? 'border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Day {d.day}</span>
                          {status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          {status === 'fail' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                          {status === 'pending' && <Circle className="w-3.5 h-3.5 text-zinc-600" />}
                        </div>
                        <div className="text-[11px] font-medium leading-tight text-zinc-300 line-clamp-2">
                          {d.title.split(':')[0]}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              {/* Day Workspace */}
              <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30">
                        Day {day.day}
                      </Badge>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                        Module
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{day.title}</CardTitle>
                    <CardDescription className="text-zinc-400">{day.tagline}</CardDescription>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="concepts" className="w-full">
                  <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="concepts">Core Concept Deck</TabsTrigger>
                    <TabsTrigger value="deep">Technical Deep-Dive</TabsTrigger>
                    <TabsTrigger value="playground">Code Playground</TabsTrigger>
                    <TabsTrigger value="challenge">Day Challenge</TabsTrigger>
                  </TabsList>

                  <TabsContent value="concepts" className="mt-4">
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-cyan-400" /> High-yield production rules
                        </CardTitle>
                      </CardHeader>
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
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Data mapping strategies & structural specs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" className="w-full">
                          {day.accordions.map((a, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                              <AccordionTrigger className="text-sm hover:no-underline">
                                {a.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <ul className="space-y-1.5 text-sm text-zinc-300 font-mono">
                                  {a.body.map((b, j) => (
                                    <li key={j} className="pl-4 border-l border-zinc-800">
                                      {b}
                                    </li>
                                  ))}
                                </ul>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="playground" className="mt-4">
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-cyan-400" /> {day.payload.label}
                        </CardTitle>
                        <CardDescription>Production-grade sample payload. Hover to copy.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CodeBlock value={day.payload.json} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="challenge" className="mt-4">
                    <Card className="border-zinc-800 bg-zinc-900/60">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-amber-400" /> Day Task Challenge
                        </CardTitle>
                        <CardDescription className="text-zinc-300 leading-relaxed pt-2">
                          {day.challenge.prompt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea
                          rows={14}
                          placeholder={day.challenge.validator.type === 'json'
                            ? '{\n  "resourceType": "...",\n  ...\n}'
                            : 'Paste your answer string here...'}
                          value={submissions[activeDay] || ''}
                          onChange={(e) =>
                            setSubmissions((p) => ({ ...p, [activeDay]: e.target.value }))
                          }
                          className="font-mono text-xs bg-zinc-950 border-zinc-800 text-zinc-200 min-h-[260px]"
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold">
                            Submit & Validate Solution
                          </Button>
                          <Button variant="outline" onClick={resetDay} className="border-zinc-700">
                            Reset
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const tpl = day.challenge.template
                              const text = typeof tpl === 'string' ? tpl : JSON.stringify(tpl, null, 2)
                              setSubmissions((p) => ({ ...p, [activeDay]: text }))
                            }}
                          >
                            Load Reference Template
                          </Button>
                        </div>

                        {results[activeDay] && (
                          <Card
                            className={`border-2 ${
                              results[activeDay].ok
                                ? 'border-emerald-500/60 bg-emerald-500/5'
                                : 'border-rose-500/60 bg-rose-500/5'
                            }`}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                {results[activeDay].ok ? (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    <span className="text-emerald-300">Validation Passed</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-5 h-5 text-rose-400" />
                                    <span className="text-rose-300">Validation Failed</span>
                                  </>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {results[activeDay].wins.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 mb-1.5 font-semibold">
                                    Passed Checks ({results[activeDay].wins.length})
                                  </div>
                                  <ul className="text-xs space-y-1">
                                    {results[activeDay].wins.map((w, i) => (
                                      <li key={i} className="text-emerald-300/90 font-mono">✓ {w}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {results[activeDay].failures.length > 0 && (
                                <div>
                                  <div className="text-[10px] uppercase tracking-wider text-rose-400 mb-1.5 font-semibold">
                                    Diagnostics ({results[activeDay].failures.length})
                                  </div>
                                  <ul className="text-xs space-y-1">
                                    {results[activeDay].failures.map((f, i) => (
                                      <li key={i} className="text-rose-300/90 font-mono">✗ {f}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <Separator className="bg-zinc-800" />

                              <div>
                                <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2 font-semibold">
                                  Expected Reference Template
                                </div>
                                <CodeBlock value={day.challenge.template} />
                                <div className="mt-3 space-y-1">
                                  {day.challenge.notes.map((n, i) => (
                                    <p key={i} className="text-xs text-zinc-400 leading-relaxed">
                                      <span className="text-amber-400 font-semibold">Note · </span>
                                      {n}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <aside className="space-y-4">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      🐍 Python Self-Revision Sidecar
                    </CardTitle>
                    <CardDescription className="text-xs">
                      You know Python. Tick what feels muscle-memory in a FHIR context.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-zinc-400">Mastered</span>
                      <span className="text-emerald-400 font-semibold">{pyDone} / {PYTHON_SIDECAR.length}</span>
                    </div>
                    <Progress value={(pyDone / PYTHON_SIDECAR.length) * 100} className="h-1.5 mb-2" />
                    {PYTHON_SIDECAR.map((item, i) => (
                      <label key={i} className="flex items-start gap-2 cursor-pointer group">
                        <Checkbox
                          checked={!!pythonChecks[i]}
                          onCheckedChange={() => togglePy(i)}
                          className="mt-0.5"
                        />
                        <span className={`text-xs leading-relaxed ${pythonChecks[i] ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-zinc-400">Days Passed</span><span className="text-emerald-400 font-semibold">{stats.passed} / 7</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Attempted</span><span className="text-cyan-400 font-semibold">{stats.attempted}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-400">Avg Grade</span><span className="text-amber-400 font-semibold">{stats.avg}%</span></div>
                    <Separator className="bg-zinc-800 my-2" />
                    <p className="text-zinc-500 leading-relaxed">
                      Cert-ready threshold: <span className="text-zinc-300">6 / 7 passes</span> + <span className="text-zinc-300">≥ 80%</span> avg.
                    </p>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        )}

        {view === 'matrix' && <CareerMatrix />}
      </main>

      <footer className="border-t border-zinc-800/60 mt-12 py-6 text-center text-xs text-zinc-500">
        Private local LMS · No data leaves your browser · Progress persisted via localStorage
      </footer>
    </div>
  )
}

// ---------- Career Matrix view ----------
const CareerMatrix = () => {
  const [copied, setCopied] = useState(null)
  const copy = (i, text) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" /> Target Architecture Matrix
          </CardTitle>
          <CardDescription>India market switch playbook — roles, target enterprises, comp ladder, outreach engine.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-base">Industry Job Target Index</CardTitle>
            <CardDescription>Roles ranked by FHIR-engineering leverage.</CardDescription>
          </CardHeader>
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
          <CardHeader>
            <CardTitle className="text-base">Prime GCCs & Product Orgs</CardTitle>
            <CardDescription>Most active hirers for FHIR/interop in India.</CardDescription>
          </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-base">Comp Progression Ladder (India · 2025)</CardTitle>
          <CardDescription>Market trajectory from associate baseline to architect.</CardDescription>
        </CardHeader>
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
        <CardHeader>
          <CardTitle className="text-base">Outreach & Resume Engine</CardTitle>
          <CardDescription>3 production-ready LinkedIn templates · paste, fill the curly-braces, send.</CardDescription>
        </CardHeader>
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
              {[
                'FHIR Integration Engineer',
                'Interoperability Analyst',
                'HL7 FHIR Python',
                'SMART on FHIR',
                'US Core profile',
                'Healthcare Integration Specialist',
                'HAPI FHIR engineer',
                'Mirth Connect engineer',
              ].map((kw) => (
                <a
                  key={kw}
                  href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(kw)}&location=India`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition"
                >
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

export default App
