'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton, GlassCard, StatCard } from '@/components/shared/ui-helpers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, Building2, FileText, Link2, Copy, ExternalLink, RefreshCw, 
  Trash2, BarChart3, Clock, CheckCircle2, Loader2, Zap, Shield, ChevronRight, ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn, getMaturityBand } from '@/lib/utils'

export function ProjectDetailPage({ id }) {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [showArchive, setShowArchive] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const generateLinkMutation = useMutation({
    mutationFn: () => apiFetch(`/projects/${id}/link`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Questionnaire link generated!')
    },
    onError: (err) => toast.error(err.message)
  })

  const startReassessmentMutation = useMutation({
    mutationFn: () => apiFetch(`/projects/${id}/reassess`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('New assessment cycle initiated')
    },
    onError: (err) => toast.error(err.message)
  })

  async function handleArchive() {
    try {
      await apiFetch(`/projects/${id}`, { method: 'PATCH', body: { status: 'archived' } })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Project archived')
      setShowArchive(false)
    } catch (err) { toast.error(err.message) }
  }

  async function handleDelete() {
    try {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted permanently')
      navigate('/projects')
    } catch (err) { toast.error(err.message) }
  }

  if (isLoading) return <PageSkeleton />
  if (!project) return <div className="text-center py-24"><GlassCard className="p-12 max-w-md mx-auto"><Shield className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" /><p className="text-muted-foreground font-medium">Project intelligence not found</p><Button variant="ghost" className="mt-4" onClick={() => navigate('/projects')}>Return to Portfolio</Button></GlassCard></div>

  const assessment = project.latest_assessment
  const screenerStatus = assessment?.screener_status || 'not_started'
  const diagnosticStatus = assessment?.diagnostic_status || 'not_started'
  const scores = assessment?.scores

  function copyLink() {
    const url = `${window.location.origin}#/assess/${project.questionnaire_link?.token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="relative space-y-8 bg-transparent">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
        <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary">{project.company_name}</span>
      </div>

      {/* Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-10 h-10 text-primary stroke-[1.5px]" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{project.company_name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{project.industry}</Badge>
              <StatusBadge status={project.status} />
              {project.consultant && (
                <div className="flex items-center gap-2 px-3 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-[8px] font-black">{project.consultant.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{project.consultant.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {diagnosticStatus === 'completed' && (
            <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold h-11" onClick={() => startReassessmentMutation.mutate()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          )}
          {profile?.role === 'admin' && (
            <>
              <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-destructive hover:bg-destructive/10 h-11" onClick={() => setShowArchive(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Archive
              </Button>
              <Button variant="destructive" className="rounded-2xl font-bold h-11 shadow-lg shadow-destructive/20" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Diagnostic Progress Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'screener', title: 'Screener', status: screenerStatus, icon: FileText, desc: 'Company Context', path: `/projects/${id}/screener`, active: true },
              { id: 'diagnostic', title: 'Diagnostic', status: diagnosticStatus, icon: BarChart3, desc: 'Growth Pillars', path: `/projects/${id}/diagnostic`, active: screenerStatus === 'completed' },
              { id: 'scores', title: 'Intelligence', status: scores ? 'completed' : 'not_started', icon: Zap, desc: 'Deep Insights', path: `/projects/${id}/scores`, active: !!scores },
            ].map((step, i) => (
              <GlassCard 
                key={step.id}
                className={cn(
                  "group p-6 cursor-pointer border-zinc-200/50 dark:border-zinc-800/50 hover:bg-primary/5 transition-all duration-500",
                  !step.active && "opacity-50 grayscale cursor-not-allowed hover:bg-transparent"
                )}
                onClick={() => step.active && navigate(step.path)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border",
                    step.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    <step.icon className="w-6 h-6 stroke-[2px]" />
                  </div>
                  <StatusBadge status={step.status} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{step.desc}</p>
                </div>
                <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold text-xs group-hover:bg-primary group-hover:text-white transition-all duration-500" disabled={!step.active}>
                  {step.status === 'completed' ? 'Review Phase' : 'Continue Phase'}
                  <ChevronRight className="w-3 h-3 ml-2" />
                </Button>
              </GlassCard>
            ))}
          </div>

          {/* Scores Executive Summary */}
          {scores && (
            <GlassCard className="p-10 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 border-primary/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * scores.radScore) / 100} className="text-primary" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black tracking-tighter text-primary">{scores.radScore}%</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RAD Score</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-2">
                    <Badge className={cn("text-white font-black px-4 py-1 rounded-full", getMaturityBand(scores.radScore).includes('Strong') ? 'bg-band-strong' : getMaturityBand(scores.radScore).includes('Constrained') ? 'bg-band-constrained' : getMaturityBand(scores.radScore).includes('Underpowered') ? 'bg-band-underpowered' : 'bg-band-risk')}>
                      {getMaturityBand(scores.radScore).toUpperCase()}
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight">Executive Summary Available</h2>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      The diagnostic phase is complete. We've identified <span className="text-destructive font-bold">{scores.primaryConstraint?.name}%</span> as the primary constraint holding back revenue growth.
                    </p>
                  </div>
                  <Button size="lg" className="rounded-2xl font-black px-10 h-14 shadow-2xl shadow-primary/20" onClick={() => navigate(`/projects/${id}/scores`)}>
                    VIEW FULL INTELLIGENCE REPORT
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
              
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            </GlassCard>
          )}

          {/* Questionnaire Access */}
          <GlassCard className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Client Access Terminal</h3>
                </div>
                <p className="text-muted-foreground font-medium">Share this unique, secure entry point with the organization's executive team.</p>
              </div>
              
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {project.questionnaire_link ? (
                  <>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Input readOnly value={`${window.location.origin}#/assess/${project.questionnaire_link.token}`} className="relative bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl font-mono text-xs h-12 w-full sm:w-[280px] pr-10" />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-primary" onClick={copyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 h-12 font-bold px-6" onClick={() => window.open(`#/assess/${project.questionnaire_link.token}`, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </Button>
                  </>
                ) : (
                  <Button className="rounded-2xl h-12 font-bold px-8 shadow-xl shadow-primary/20" onClick={() => generateLinkMutation.mutate()} disabled={generateLinkMutation.isPending}>
                    {generateLinkMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Generate Secure Access Link
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          {/* Assessment History */}
          <GlassCard className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-xl font-bold tracking-tight">History</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground opacity-40" />
              </div>
              <CardDescription className="text-xs">Timeline of diagnostic assessments</CardDescription>
            </CardHeader>
            <CardContent className="px-6 flex-1 overflow-auto">
              <div className="space-y-6">
                {project.assessments?.map((a, i) => (
                  <div key={a.id} className="relative group pl-8 pb-6 last:pb-0">
                    {/* Timeline Line */}
                    {i !== project.assessments.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800" />}
                    <div className={cn(
                      "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110",
                      a.diagnostic_status === 'completed' ? "bg-emerald-500" : "bg-primary"
                    )} />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Cycle #{a.assessment_number}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 group-hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold tracking-tight">{a.diagnostic_status === 'completed' ? 'Finalized' : 'In Progress'}</p>
                          {a.scores?.radScore && <span className="text-lg font-black text-primary">{a.scores.radScore}%</span>}
                        </div>
                        <StatusBadge status={a.diagnostic_status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>

          {/* Quick Stats Sidebar Card */}
          <GlassCard className="p-6 bg-zinc-900 text-white border-none shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Shield className="w-6 h-6 text-white stroke-[2.5px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Compliance</p>
                  <p className="font-bold tracking-tight">Security Verified</p>
                </div>
              </div>
              <p className="text-xs font-medium opacity-60 leading-relaxed">
                All assessment data is encrypted and isolated within your organization container.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Archive dialog */}
      <Dialog open={showArchive} onOpenChange={setShowArchive}>
        <DialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Archive Project Portfolio?</DialogTitle>
            <DialogDescription className="text-base font-medium">
              This action will securely archive "{project.company_name}" from your active portfolio. Intelligence reports will remain accessible via the archive vault.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold px-6 h-11" onClick={() => setShowArchive(false)}>Cancel Action</Button>
            <Button variant="destructive" className="rounded-xl font-bold px-8 h-11 shadow-lg shadow-destructive/20" onClick={handleArchive}>Archive Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Delete Project Permanently?</DialogTitle>
            <DialogDescription className="text-base font-medium">
              This will permanently delete "{project.company_name}" and all associated assessments, scores, and reports. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold px-6 h-11" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl font-bold px-8 h-11 shadow-lg shadow-destructive/20" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
