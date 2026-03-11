'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton } from '@/components/shared/ui-helpers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, Building2, FileText, Link2, Copy, ExternalLink, RefreshCw, 
  Edit, Trash2, BarChart3, Clock, CheckCircle2, Loader2, TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function ProjectDetailPage({ id }) {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)

  const generateLinkMutation = useMutation({
    mutationFn: () => apiFetch(`/projects/${id}/link`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Questionnaire link generated!')
    },
    onError: (err) => toast.error(err.message)
  })

  const startReassessmentMutation = useMutation({
    mutationFn: () => apiFetch(`/projects/${id}/reassessment`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('New assessment started!')
      navigate(`/projects/${id}/screener`)
    },
    onError: (err) => toast.error(err.message)
  })

  if (isLoading) return <PageSkeleton />
  if (!project) return <div className="text-center py-20"><p className="text-muted-foreground">Project not found</p></div>

  const assessment = project.latest_assessment
  const screenerDone = assessment?.screener_status === 'completed'
  const diagnosticDone = assessment?.diagnostic_status === 'completed'
  const hasScores = !!assessment?.scores

  function copyLink() {
    const url = `${window.location.origin}#/assess/${project.questionnaire_link?.token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/projects')} data-testid="back-to-projects">
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Projects
        </Button>
        <div className="flex gap-2">
          {hasScores && (
            <Button onClick={() => navigate(`/projects/${id}/scores`)} data-testid="view-scores-btn">
              <BarChart3 className="w-4 h-4 mr-2" />View Scores
            </Button>
          )}
        </div>
      </div>

      {/* Project Header */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="project-company-name">{project.company_name}</h1>
                <p className="text-muted-foreground">{project.industry}</p>
                {project.consultant && (
                  <p className="text-sm text-muted-foreground mt-1">Consultant: {project.consultant.name}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <StatusBadge status={project.status} />
              {hasScores && (
                <div className="mt-3">
                  <p className="text-4xl font-bold text-primary">{assessment.scores.radScore}</p>
                  <p className="text-xs text-muted-foreground">RAD Score</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate(`/projects/${id}/screener`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-6 h-6 text-primary" />
              {screenerDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
            </div>
            <h3 className="font-semibold">Screener Questionnaire</h3>
            <p className="text-sm text-muted-foreground mt-1">{screenerDone ? 'Completed' : 'In progress'}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" data-testid="screener-btn">
              {screenerDone ? 'Review Screener' : 'Continue Screener'}
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-colors ${screenerDone ? 'cursor-pointer hover:border-primary/50' : 'opacity-50'}`} 
              onClick={() => screenerDone && navigate(`/projects/${id}/diagnostic`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
              {diagnosticDone ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-amber-500" />}
            </div>
            <h3 className="font-semibold">Diagnostic Assessment</h3>
            <p className="text-sm text-muted-foreground mt-1">{diagnosticDone ? 'Completed' : screenerDone ? 'Ready to start' : 'Complete screener first'}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" disabled={!screenerDone} data-testid="diagnostic-btn">
              {diagnosticDone ? 'Review Diagnostic' : 'Start Diagnostic'}
            </Button>
          </CardContent>
        </Card>

        <Card className={`border-2 transition-colors ${hasScores ? 'cursor-pointer hover:border-primary/50' : 'opacity-50'}`}
              onClick={() => hasScores && navigate(`/projects/${id}/scores`)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              {hasScores ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-muted-foreground" />}
            </div>
            <h3 className="font-semibold">Scores & Report</h3>
            <p className="text-sm text-muted-foreground mt-1">{hasScores ? `RAD Score: ${assessment.scores.radScore}` : 'Complete diagnostic first'}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full" disabled={!hasScores} data-testid="scores-btn">
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Questionnaire Link */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" />Client Questionnaire Link</CardTitle>
          <CardDescription>Share this link with your client to complete the assessment</CardDescription>
        </CardHeader>
        <CardContent>
          {project.questionnaire_link ? (
            <div className="flex items-center gap-3">
              <Input 
                value={`${window.location.origin}#/assess/${project.questionnaire_link.token}`} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline" onClick={copyLink} data-testid="copy-link-btn">
                <Copy className="w-4 h-4 mr-2" />Copy
              </Button>
              <Button variant="outline" onClick={() => window.open(`#/assess/${project.questionnaire_link.token}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />Open
              </Button>
            </div>
          ) : (
            <Button onClick={() => generateLinkMutation.mutate()} disabled={generateLinkMutation.isPending} data-testid="generate-link-btn">
              {generateLinkMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Generate Link
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Assessment History */}
      {project.assessments?.length > 1 && (
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>Track progress across multiple assessments</CardDescription>
            </div>
            <Button variant="outline" onClick={() => startReassessmentMutation.mutate()} disabled={startReassessmentMutation.isPending} data-testid="start-reassessment-btn">
              <RefreshCw className="w-4 h-4 mr-2" />Start Reassessment
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>RAD Score</TableHead>
                  <TableHead>Maturity Band</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.assessments.map((a, i) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.assessment_number}</TableCell>
                    <TableCell><StatusBadge status={a.diagnostic_status} /></TableCell>
                    <TableCell className="font-bold text-primary">{a.scores?.radScore || '-'}</TableCell>
                    <TableCell>{a.scores?.maturityBand || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
