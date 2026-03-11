'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { PageSkeleton } from '@/components/shared/ui-helpers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, FileText, Download, Zap, Loader2, BarChart3, Target, Award, 
  Shield, TrendingUp, Gauge, FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar 
} from 'recharts'
import { PILLAR_NAMES } from '@/lib/constants'

export function ScoresPage({ id }) {
  const { navigate } = useAuth()
  const queryClient = useQueryClient()
  const { data: scores, isLoading } = useQuery({ queryKey: ['scores', id], queryFn: () => apiFetch(`/projects/${id}/scores`) })
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [generating, setGenerating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState(null)

  async function generateReport() {
    setGenerating(true)
    try {
      const result = await apiFetch(`/projects/${id}/report/generate`, { method: 'POST' })
      setReport(result)
      setShowReport(true)
      toast.success('Report generated successfully!')
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
      toast.info('No report found. Click "Generate Report" to create one.')
    }
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const result = await apiFetch(`/projects/${id}/report/pdf`)
      const byteCharacters = atob(result.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'RAD_Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF. Generate report first.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  function exportToCSV() {
    if (!scores || !project) {
      toast.error('No data to export')
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
    rows.push(['Maturity Band', scores.maturityBand])
    rows.push(['Primary Constraint', scores.primaryConstraint?.name || ''])
    rows.push([])
    
    rows.push(['=== PILLAR SCORES ==='])
    rows.push(['Pillar', 'Score', 'Average', 'Status'])
    Object.entries(scores.pillarScores || {}).forEach(([pid, data]) => {
      const status = data.avg >= 4 ? 'Strong' : data.avg >= 3 ? 'Developing' : 'At Risk'
      rows.push([PILLAR_NAMES[pid] || pid, data.score, data.avg?.toFixed(2), status])
    })
    rows.push([])
    
    if (scores.raps) {
      rows.push(['=== REVENUE ACHIEVEMENT PROBABILITY (RAPS) ==='])
      rows.push(['RAPS Score', `${scores.raps.score}%`])
      rows.push(['Revenue Target', `$${(scores.raps.revenueTarget || 0).toLocaleString()}`])
      rows.push(['Already Invoiced', `$${(scores.raps.revenueInvoiced || 0).toLocaleString()}`])
      rows.push(['Remaining', `$${(scores.raps.revenueRemaining || 0).toLocaleString()}`])
      rows.push(['Months Left', scores.raps.monthsRemaining])
      rows.push([])
    }
    
    if (project.assessments?.length > 1) {
      rows.push(['=== ASSESSMENT HISTORY ==='])
      rows.push(['Assessment #', 'RAD Score', 'RAPS %', 'Maturity Band', 'Completed'])
      project.assessments.filter(a => a.scores).forEach(a => {
        rows.push([
          a.assessment_number,
          a.scores?.radScore || '',
          a.scores?.raps?.score ? `${a.scores.raps.score}%` : '',
          a.scores?.maturityBand || '',
          a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
        ])
      })
    }
    
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
    a.download = `${companyName.replace(/\s+/g, '_')}_RAD_Scores.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  if (isLoading) return <PageSkeleton />
  if (!scores) return <div className="text-center py-20"><p className="text-muted-foreground">No scores available</p></div>

  const bandColor = scores.maturityBand?.includes('Strong') ? 'green' : scores.maturityBand?.includes('Developing') ? 'amber' : scores.maturityBand?.includes('Fragile') ? 'orange' : 'red'
  const bandColorClass = { green: 'bg-green-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500' }
  const trafficLight = (avg) => avg >= 4 ? 'bg-green-500' : avg >= 3 ? 'bg-amber-500' : 'bg-red-500'
  
  const radarData = Object.entries(scores.pillarScores || {}).map(([pid, data]) => ({
    pillar: PILLAR_NAMES[pid]?.split(' ')[0] || pid,
    fullName: PILLAR_NAMES[pid],
    score: data.score,
    fullMark: 100
  }))

  const assessments = project?.assessments || []
  const trendData = assessments.filter(a => a.scores).map(a => ({
    name: `#${a.assessment_number}`,
    radScore: a.scores?.radScore || 0,
    raps: a.scores?.raps?.score || 0,
    date: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
  })).reverse()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="w-4 h-4 mr-2" />Back to Project</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="export-csv-btn">
            <FileSpreadsheet className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button variant="outline" onClick={loadReport} data-testid="view-report-btn">
            <FileText className="w-4 h-4 mr-2" />View Report
          </Button>
          <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf} data-testid="download-pdf-btn">
            {downloadingPdf ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Downloading...</> : <><Download className="w-4 h-4 mr-2" />Download PDF</>}
          </Button>
          <Button onClick={generateReport} disabled={generating} data-testid="generate-report-btn">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Zap className="w-4 h-4 mr-2" />Generate AI Report</>}
          </Button>
        </div>
      </div>
      
      {/* Overall Score */}
      <Card className="border-2 overflow-hidden">
        <div className={`h-2 ${bandColorClass[bandColor]}`} />
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">RAD Growth System Score</p>
          <p className="text-7xl font-bold text-primary tracking-tighter">{scores.radScore}</p>
          <Badge className={`mt-4 text-base px-4 py-1.5 ${bandColorClass[bandColor]} text-white`}>{scores.maturityBand}</Badge>
          {scores.primaryConstraint && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20 inline-block">
              <p className="text-sm text-muted-foreground">Primary Growth Constraint</p>
              <p className="text-lg font-bold text-destructive mt-1">{scores.primaryConstraint.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar Radar Chart */}
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="w-5 h-5 text-primary" />Pillar Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="pillar" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip content={({ payload }) => payload?.[0] ? (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg">
                      <p className="font-medium text-sm">{payload[0].payload.fullName}</p>
                      <p className="text-primary font-bold">{payload[0].value}/100</p>
                    </div>
                  ) : null} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Trend or Bar Chart */}
        {trendData.length > 1 ? (
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-primary" />Score Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip content={({ payload, label }) => payload?.length ? (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">Assessment {label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.color }} className="text-sm">{p.name}: <span className="font-bold">{p.value}</span></p>
                        ))}
                      </div>
                    ) : null} />
                    <Legend />
                    <Line type="monotone" dataKey="radScore" name="RAD Score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="raps" name="RAPS %" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-primary" />Pillar Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="pillar" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={({ payload }) => payload?.[0] ? (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{payload[0].payload.fullName}</p>
                        <p className="text-primary font-bold">{payload[0].value}/100</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pillar Details */}
      <Card className="border-2">
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Diagnostic Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{Object.entries(scores.pillarScores || {}).map(([pid, data]) => {
            const isPrimary = scores.primaryConstraint?.id === pid
            return (
              <div key={pid} className={`p-4 rounded-xl border-2 transition-all ${isPrimary ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${trafficLight(data.avg)}`} />
                    <span className={`font-medium ${isPrimary ? 'text-destructive' : ''}`}>{PILLAR_NAMES[pid]}</span>
                    {isPrimary && <Badge variant="destructive" className="text-xs">Primary Constraint</Badge>}
                  </div>
                  <span className="font-bold text-lg">{data.score}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${trafficLight(data.avg)}`} style={{ width: `${data.score}%` }} />
                </div>
              </div>
            )
          })}</div>
        </CardContent>
      </Card>

      {/* RAPS */}
      {scores.raps && (
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Revenue Achievement Probability Score (RAPS)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-muted/50">
              <p className="text-6xl font-bold text-primary">{scores.raps.score}%</p>
              <p className="text-muted-foreground mt-2">{scores.raps.score >= 70 ? 'High probability' : scores.raps.score >= 40 ? 'Moderate probability' : 'Low probability'} of achieving revenue target</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Revenue Target</p><p className="font-bold mt-1">${(scores.raps.revenueTarget || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Already Invoiced</p><p className="font-bold mt-1">${(scores.raps.revenueInvoiced || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Remaining</p><p className="font-bold mt-1">${(scores.raps.revenueRemaining || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Months Left</p><p className="font-bold mt-1">{scores.raps.monthsRemaining}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Report Dialog - Simplified version */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />AI-Generated Diagnostic Report</DialogTitle>
            <DialogDescription>Powered by Claude AI</DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Executive Summary</h3>
                <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{report.executive_summary}</div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Pillar Analysis</h3>
                {report.pillar_narratives && Object.entries(report.pillar_narratives).map(([pid, narrative]) => (
                  <div key={pid} className="p-4 border rounded-xl">
                    <h4 className="font-semibold text-primary mb-2">{PILLAR_NAMES[pid]}</h4>
                    <p className="text-sm text-muted-foreground">{narrative}</p>
                  </div>
                ))}
              </div>
              {report.positioning_assessment && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Positioning Assessment</h3>
                  <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{report.positioning_assessment}</div>
                </div>
              )}
              {report.action_plan && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />30-60-90 Day Action Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['phase1', 'phase2', 'phase3'].map((phase, i) => {
                      const colors = [['bg-red-50 dark:bg-red-900/20', 'border-red-200 dark:border-red-800', 'text-red-700 dark:text-red-400', 'text-red-500'],
                                      ['bg-amber-50 dark:bg-amber-900/20', 'border-amber-200 dark:border-amber-800', 'text-amber-700 dark:text-amber-400', 'text-amber-500'],
                                      ['bg-green-50 dark:bg-green-900/20', 'border-green-200 dark:border-green-800', 'text-green-700 dark:text-green-400', 'text-green-500']]
                      return (
                        <div key={phase} className={`p-4 ${colors[i][0]} rounded-xl border ${colors[i][1]}`}>
                          <h4 className={`font-semibold ${colors[i][2]} mb-2`}>{report.action_plan[`${phase}_title`]}</h4>
                          <ul className="space-y-1">{(report.action_plan[`${phase}_items`] || []).map((item, j) => (
                            <li key={j} className="text-sm flex items-start gap-2"><span className={`${colors[i][3]} mt-1`}>•</span>{item}</li>
                          ))}</ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pt-4">Generated {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'recently'}</p>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Download PDF
            </Button>
            <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
