'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Loader2, 
  Rocket, 
  Building2, 
  User, 
  Mail, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { INDUSTRIES } from '@/lib/constants'

export function CreateProjectPage() {
  const { navigate } = useAuth()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ company_name: '', industry: '', contact_name: '', contact_email: '', notes: '' })

  const createMutation = useMutation({
    mutationFn: (data) => apiFetch('/projects', { method: 'POST', body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
      navigate(`/projects/${data.id}`)
    },
    onError: (err) => toast.error(err.message)
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.company_name || !form.industry) {
      toast.error('Please fill in required fields')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="relative max-w-6xl mx-auto space-y-8 pb-12">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/projects')}
            className="group -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Initiate New Project</h1>
          <p className="text-muted-foreground">Launch a comprehensive revenue acceleration diagnostic for your client.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-2 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Rocket className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Project Setup</Badge>
              </div>
              <CardTitle>Core Details</CardTitle>
              <CardDescription>Essential information to categorize and track the assessment.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Business Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 pb-2 border-b">
                    <Building2 className="w-4 h-4" />
                    Business Information
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-xs font-bold uppercase tracking-wider opacity-70">Company Name *</Label>
                      <Input 
                        id="company" 
                        value={form.company_name} 
                        onChange={e => setForm({...form, company_name: e.target.value})}
                        placeholder="e.g. Acme Corporation"
                        className="bg-background/50 border-muted-foreground/20 focus:border-primary/50"
                        data-testid="project-company-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-xs font-bold uppercase tracking-wider opacity-70">Industry *</Label>
                      <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}>
                        <SelectTrigger 
                          className="bg-background/50 border-muted-foreground/20 focus:ring-primary/50"
                          data-testid="project-industry-select"
                        >
                          <SelectValue placeholder="Select industry sector" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {INDUSTRIES.map(ind => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 pb-2 border-b">
                    <User className="w-4 h-4" />
                    Primary Contact
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wider opacity-70">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <Input 
                          id="contact" 
                          value={form.contact_name} 
                          onChange={e => setForm({...form, contact_name: e.target.value})}
                          placeholder="John Smith"
                          className="pl-10 bg-background/50 border-muted-foreground/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider opacity-70">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
                        <Input 
                          id="email" 
                          type="email"
                          value={form.contact_email} 
                          onChange={e => setForm({...form, contact_email: e.target.value})}
                          placeholder="john@acme.com"
                          className="pl-10 bg-background/50 border-muted-foreground/20"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Context Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 pb-2 border-b">
                    <FileText className="w-4 h-4" />
                    Project Context
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider opacity-70">Strategic Notes</Label>
                    <Textarea 
                      id="notes" 
                      value={form.notes} 
                      onChange={e => setForm({...form, notes: e.target.value})}
                      placeholder="Enter any preliminary findings, goals for this assessment, or specific client challenges..."
                      className="bg-background/50 border-muted-foreground/20 min-h-[120px] resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Sparkles className="w-3 h-3" />
                      These notes will be available to consultants during the diagnostic process.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/projects')}
                    className="hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={createMutation.isPending} 
                    className="min-w-[160px] shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                    data-testid="create-project-btn"
                  >
                    {createMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      <><Rocket className="w-4 h-4 mr-2" />Create Project</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-inner">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                The RAD™ Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Project Initiation', desc: 'Create the project container for the client diagnostic.', icon: CheckCircle2 },
                { title: 'Screening Questionnaire', desc: 'Gather initial GTM context and respondent details.', icon: Circle },
                { id: 3, title: 'Diagnostic Workshop', desc: 'Run through the 7 pillars of revenue acceleration.', icon: Circle },
                { id: 4, title: 'Report & Insights', desc: 'Generate the final maturity assessment and action plan.', icon: Circle },
              ].map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border'}`}>
                      {idx === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                    </div>
                    {idx < 3 && <div className="w-[1px] h-full bg-border absolute top-6" />}
                  </div>
                  <div className="pb-4">
                    <h4 className={`text-xs font-bold uppercase tracking-tight ${idx === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{step.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/10 text-center space-y-2">
            <p className="text-xs text-muted-foreground font-medium italic">"A strong start is half the battle won. Ensuring accurate client data leads to better strategic insights."</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Circle({ className }) {
  return (
    <div className={`w-3.5 h-3.5 rounded-full border-2 ${className}`} />
  )
}

function Badge({ children, variant, className }) {
  const styles = variant === 'outline' 
    ? 'border border-primary/20 text-primary' 
    : 'bg-primary text-primary-foreground'
  return (
    <span className={`px-2 py-0.5 rounded-full font-medium uppercase ${styles} ${className}`}>
      {children}
    </span>
  )
}

