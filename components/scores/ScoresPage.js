'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton, GlassCard } from '@/components/shared/ui-helpers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, FileText, Mail, Zap, Loader2, Download, 
  BarChart3, TrendingUp, Clock, Target, Shield, 
  Award, FileSpreadsheet, ChevronRight, X, Send, LayoutDashboard, Activity as ActivityIcon, AlertTriangle, ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, AreaChart, Area
} from 'recharts'
import { PILLAR_NAMES } from '@/lib/constants'
import { cn, getMaturityBand } from '@/lib/utils'
import { generateClientPdf } from '@/lib/generatePdf'

const pillarLabel = (pid) => `Pillar ${pid.replace('p', '')} - ${PILLAR_NAMES[pid] || pid}`

export function ScoresPage({ id }) {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: scores, isLoading: scoresLoading } = useQuery({ queryKey: ['scores', id], queryFn: () => apiFetch(`/projects/${id}/scores`) })
  const { data: project, isLoading: projectLoading } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [generating, setGenerating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState(null)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', message: '' })

  async function generateReport() {
    setGenerating(true)
    try {
      const result = await apiFetch(`/projects/${id}/report/generate`, { method: 'POST' })
      setReport(result)
      setShowReport(true)
      toast.success('AI Intelligence Report Generated')
      queryClient.invalidateQueries({ queryKey: ['report', id] })
    } catch (err) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  async function loadReport() {
    try {
      const result = await apiFetch(`/projects/${id}/report`)
      setReport(result)
      setShowReport(true)
    } catch (err) {
      toast.info('No finalized report found. Initiate generation to proceed.')
    }
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      let reportData = report
      if (!reportData) {
        try {
          reportData = await apiFetch(`/projects/${id}/report`)
        } catch (e) {
          // No report exists yet — generate it via AI
          toast.info('Generating AI Intelligence Report... this may take up to 60 seconds.')
          reportData = await apiFetch(`/projects/${id}/report/generate`, { method: 'POST' })
          setReport(reportData)
        }
      }
      await generateClientPdf({
        scores,
        report: reportData,
        project,
        screenerResponses: reportData?.screener_responses || {},
      })
      toast.success('Executive PDF Exported')
    } catch (err) {
      toast.error('Report generation failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloadingPdf(false)
    }
  }

  function exportToCSV() {
    if (!scores || !project) {
      toast.error('No data available for export')
      return
    }

    const companyName = project.company_name || 'Company'
    const rows = []
    rows.push(['Biz Ascend RAD - Diagnostic Export'])
    rows.push(['Company', companyName])
    rows.push(['Industry', project.industry || ''])
    rows.push(['Export Date', new Date().toLocaleDateString()])
    rows.push([])
    rows.push(['=== OVERALL SCORES ==='])
    rows.push(['RAD Score', scores.radScore])
    rows.push(['Maturity Band', getMaturityBand(scores.radScore)])
    const csvConstraints = Object.entries(scores.pillarScores || {}).filter(([, d]) => d.score < 50).map(([pid]) => PILLAR_NAMES[pid]).join(', ') || scores.primaryConstraint?.name || ''
    rows.push(['Primary Constraint(s)', csvConstraints])
    rows.push([])
    rows.push(['=== PILLAR SCORES ==='])
    rows.push(['Pillar', 'Score', 'Average', 'Status'])
    Object.entries(scores.pillarScores || {}).forEach(([pid, data]) => {
      const status = data.avg >= 4 ? 'Strong' : data.avg >= 3 ? 'Developing' : 'At Risk'
      rows.push([pillarLabel(pid), data.score, data.avg?.toFixed(2), status])
    })
    
    const csvContent = rows.map(row => row.map(cell => {
      const str = String(cell ?? '')
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str
    }).join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName.replace(/\s+/g, '_')}_Intelligence_Data.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Intelligence Data Exported')
  }

  async function sendToClient(e) {
    e.preventDefault()
    if (!emailForm.email) {
      toast.error('Recipient identity required')
      return
    }
    setSendingEmail(true)
    try {
      // For testing/mocking
      const isDemo = project?.id?.startsWith('demo')
      if (isDemo) {
        await new Promise(r => setTimeout(r, 2000))
        toast.success(`Executive Report dispatched to ${emailForm.email}`)
        setShowSendDialog(false)
        setEmailForm({ email: '', message: '' })
      } else {
        await apiFetch('/notifications/send-pdf-report', {
          method: 'POST',
          body: { project_id: id, recipient_email: emailForm.email, message: emailForm.message }
        })
        toast.success(`Executive Report dispatched to ${emailForm.email}`)
        setShowSendDialog(false)
        setEmailForm({ email: '', message: '' })
      }
    } catch (err) {
      toast.error('Dispatch failed. System reported: ' + (err.message || 'Unknown error'))
    } finally {
      setSendingEmail(false)
    }
  }

  if (scoresLoading || projectLoading) return <PageSkeleton />
  if (!scores) return <div className="text-center py-24"><GlassCard className="p-12 max-w-md mx-auto"><AlertTriangle className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" /><p className="text-muted-foreground font-medium">Intelligence data not finalized</p><Button variant="ghost" className="mt-4" onClick={() => navigate(`/projects/${id}`)}>Return to Project</Button></GlassCard></div>

  const maturityBand = getMaturityBand(scores.radScore)
  const bandClasses = maturityBand.includes('Strong') ? 'bg-band-strong shadow-band-strong/20' : maturityBand.includes('Constrained') ? 'bg-band-constrained shadow-band-constrained/20' : maturityBand.includes('Underpowered') ? 'bg-band-underpowered shadow-band-underpowered/20' : 'bg-band-risk shadow-band-risk/20'
  const bandColor = (score) => score >= 80 ? 'bg-band-strong' : score >= 65 ? 'bg-band-constrained' : score >= 50 ? 'bg-band-underpowered' : 'bg-band-risk'
  
  const radarData = Object.entries(scores.pillarScores || {}).map(([pid, data]) => ({
    pillar: PILLAR_NAMES[pid] || pid,
    fullName: pillarLabel(pid),
    score: data.score,
    fullMark: 100
  }))

  const CustomRadarTick = ({ payload, x, y, cx, cy, ...rest }) => {
    const label = payload.value || ''
    const words = label.split(' ')
    const lines = []
    let current = ''
    for (const word of words) {
      if (current && (current + ' ' + word).length > 18) {
        lines.push(current)
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) lines.push(current)
    const dx = x - cx
    const dy = y - cy
    const anchor = Math.abs(dx) < 5 ? 'middle' : dx > 0 ? 'start' : 'end'
    const offsetY = dy < -5 ? -4 : dy > 5 ? 8 : 0
    return (
      <text x={x} y={y + offsetY} textAnchor={anchor} fill="currentColor" className="text-muted-foreground" fontSize={9} fontWeight={700}>
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{line}</tspan>
        ))}
      </text>
    )
  }

  const trendData = (project?.assessments || []).filter(a => a.scores).map(a => ({
    name: `#${a.assessment_number}`,
    radScore: a.scores?.radScore || 0,
    raps: a.scores?.raps?.score || 0,
    date: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
  })).reverse()

  return (
    <div className="relative space-y-8 bg-transparent px-2 max-w-6xl mx-auto pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/projects/${id}`)} className="hover:text-primary hover:underline cursor-pointer transition-colors">Project</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-black">Intelligence</span>
        </div>
        
        <Button className="rounded-2xl font-bold h-10 px-6 shadow-lg shadow-primary/20" onClick={downloadPdf} disabled={downloadingPdf}>
          {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download Report
        </Button>
      </div>

      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
          <LayoutDashboard className="w-3 h-3" />
          Revenue Acceleration Intelligence
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{project?.company_name && <span className="text-zinc-900 dark:text-zinc-50">{project.company_name} </span>}<span className="text-primary">Strategic Performance Analysis</span></h1>
        <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
          Comprehensive diagnostic output for <span className="text-foreground font-bold">{project?.company_name}</span>. Review system maturity and primary constraints.
        </p>
      </header>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RAD Score Focus */}
        <GlassCard className="p-10 lg:col-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden border-primary/10">
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">System Maturity Score</p>
              <div className="text-8xl font-black tracking-tighter text-primary animate-in zoom-in duration-700">{scores.radScore}%</div>
            </div>
            
            <div className="space-y-4">
              <Badge className={cn("text-white font-black px-6 py-2 rounded-full text-sm tracking-wider shadow-lg", bandClasses)}>
                {maturityBand.toUpperCase()}
              </Badge>
              
              {(() => {
                const constraints = Object.entries(scores.pillarScores || {}).filter(([, d]) => d.score < 50)
                const names = constraints.length > 0
                  ? constraints.map(([pid]) => pillarLabel(pid))
                  : scores.primaryConstraint ? [scores.primaryConstraint.id ? pillarLabel(scores.primaryConstraint.id) : scores.primaryConstraint.name] : []
                return names.length > 0 && (
                  <div className="p-5 rounded-[2rem] bg-band-risk/5 border border-band-risk/10 backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase tracking-widest text-band-risk mb-1">{names.length > 1 ? 'Primary Constraints' : 'Primary Constraint'}</p>
                    {names.map((name, i) => (
                      <p key={i} className="text-lg font-bold tracking-tight text-band-risk">{name}</p>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Zap className="w-64 h-64 text-primary" />
          </div>
        </GlassCard>

        {/* Pillar Visualization */}
        <GlassCard className="lg:col-span-2 p-8 border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Pillar Breakdown</h3>
              <p className="text-xs text-muted-foreground font-medium">Performance across all growth dimensions</p>
            </div>
            <div className="flex gap-1.5">
              {['bg-band-strong', 'bg-band-constrained', 'bg-band-underpowered', 'bg-band-risk'].map((c) => (
                <div key={c} className={cn("w-2 h-2 rounded-full", c)} />
              ))}
            </div>
          </div>
          
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
                <PolarGrid stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                <PolarAngleAxis dataKey="pillar" tick={<CustomRadarTick />} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={3} />
                <RechartsTooltip content={({ payload }) => payload?.[0] ? (
                  <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xl">
                    <p className="font-bold text-xs uppercase tracking-wider mb-1 text-muted-foreground">{payload[0].payload.fullName}</p>
                    <p className="text-2xl font-black text-primary">{payload[0].value}</p>
                  </div>
                ) : null} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* RAPS & Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Pillar Scores</h3>
              <p className="text-xs text-muted-foreground font-medium">Granular maturity analysis</p>
            </div>
            <Target className="w-5 h-5 text-primary opacity-20" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(scores.pillarScores || {}).map(([pid, data]) => {
              const isPrimary = data.score < 50
              return (
                <div key={pid} className={cn(
                  "p-4 rounded-2xl border transition-all duration-500",
                  isPrimary ? "bg-band-risk/5 border-band-risk/20 shadow-lg shadow-band-risk/5" : "bg-white/40 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-800"
                )}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", bandColor(data.score))} />
                      <span className={cn("text-sm font-bold tracking-tight", isPrimary ? "text-band-risk" : "text-zinc-700 dark:text-zinc-300")}>
                        {pillarLabel(pid)}
                      </span>
                    </div>
                    <span className="text-sm font-black tabular-nums">{data.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", bandColor(data.score))} style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <div className="space-y-8">
          {scores.raps && (
            <GlassCard className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-none shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight opacity-100">Revenue Probability</h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">RAPS Intelligence</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Target className="w-6 h-6 text-white stroke-[2.5px]" />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black tracking-tighter">{scores.raps.score}%</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Confidence</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-primary">Target</p>
                    <p className="text-lg font-bold tabular-nums tracking-tight">${(scores.raps.revenueTarget || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-emerald-500">Invoiced</p>
                    <p className="text-lg font-bold tabular-nums tracking-tight">${(scores.raps.revenueInvoiced || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            </GlassCard>
          )}

        </div>
      </div>

      {/* AI Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-zinc-200 dark:border-zinc-800 p-0 shadow-2xl">
          <div className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5 stroke-[2px]" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">AI Intelligence Report</DialogTitle>
                <DialogDescription className="font-medium text-xs uppercase tracking-widest text-primary/60 flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Engineered by Biz Ascend RAD™
                </DialogDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold h-10" onClick={downloadPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export PDF
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10" onClick={() => setShowReport(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {report && (
            <div className="p-8 space-y-12">
              {/* Report content sections - reuse same logic as app/page.js redesign */}
              <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
                  Executive Overview
                </div>
                <div className="p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 shadow-inner relative overflow-hidden">
                  <div className="relative z-10 text-lg leading-relaxed text-zinc-800 dark:text-zinc-200 font-medium italic serif">
                    &ldquo;{report.executive_summary}&rdquo;
                  </div>
                  <Award className="absolute -bottom-6 -right-6 w-32 h-32 text-primary opacity-[0.03] rotate-12" />
                </div>
              </section>

              {/* Action Plan */}
              {report.action_plan && (
                <section className="space-y-6">
                  <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
                    Revenue Acceleration Roadmap
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: report.action_plan.phase1_title, items: report.action_plan.phase1_items, color: 'band-risk', icon: Clock },
                      { title: report.action_plan.phase2_title, items: report.action_plan.phase2_items, color: 'band-underpowered', icon: Target },
                      { title: report.action_plan.phase3_title, items: report.action_plan.phase3_items, color: 'band-strong', icon: Zap },
                    ].map((phase, i) => (
                      <div key={i} className={cn(
                        "p-6 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 hover:-translate-y-1",
                        `bg-${phase.color}/5 border-${phase.color}/10 hover:border-${phase.color}/30`
                      )}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={cn("font-black text-sm uppercase tracking-wider", `text-${phase.color}`)}>{phase.title}</h4>
                          <phase.icon className={cn("w-4 h-4 opacity-40", `text-${phase.color}`)} />
                        </div>
                        <ul className="space-y-3">
                          {(phase.items || []).map((item, ii) => (
                            <li key={ii} className="text-sm font-medium flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                              <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", `bg-${phase.color}`)} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Additional sections matching the app/page.js logic */}
              <div className="sticky bottom-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 p-6 flex justify-between items-center mt-8">
                <Button variant="ghost" className="rounded-xl font-bold h-11 px-6 text-muted-foreground hover:text-primary" onClick={() => setShowReport(false)}>
                  Close Intelligence Report
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold h-11 px-8" onClick={() => { setShowReport(false); setShowSendDialog(true) }}>
                    <Mail className="w-4 h-4 mr-2" />Dispatch to Principal
                  </Button>
                  <Button className="rounded-2xl font-bold h-11 px-10 shadow-xl shadow-primary/20" onClick={downloadPdf} disabled={downloadingPdf}>
                    {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Export Executive Brief
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl">
          <DialogHeader className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Dispatch Report</DialogTitle>
            <DialogDescription className="font-medium">Securely deliver the Intelligence Report to the organization principal.</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendToClient} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient-email" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Principal Identity (Email)</Label>
              <Input 
                id="recipient-email" 
                type="email" 
                value={emailForm.email} 
                onChange={e => setEmailForm({...emailForm, email: e.target.value})}
                placeholder="principal@organization.com"
                required
                className="h-12 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Executive Commentary (Optional)</Label>
              <Textarea 
                id="email-message" 
                value={emailForm.message} 
                onChange={e => setEmailForm({...emailForm, message: e.target.value})}
                placeholder="Provide strategic context for the principal..."
                rows={4}
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary font-medium resize-none p-4 leading-relaxed"
              />
            </div>
            <DialogFooter className="gap-3 pt-4">
              <Button type="button" variant="ghost" className="rounded-xl font-bold h-11 px-6" onClick={() => setShowSendDialog(false)}>Cancel</Button>
              <Button type="submit" className="rounded-2xl font-bold h-11 px-10 shadow-xl shadow-primary/20 flex-1" disabled={sendingEmail}>
                {sendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Dispatching...</> : <><Send className="w-4 h-4 mr-2" />Dispatch Report</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
