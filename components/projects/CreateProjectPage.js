'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
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
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/projects')}>
        <ArrowLeft className="w-4 h-4 mr-2" />Back to Projects
      </Button>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>Start a new client diagnostic assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input 
                  id="company" 
                  value={form.company_name} 
                  onChange={e => setForm({...form, company_name: e.target.value})}
                  placeholder="Acme Corporation"
                  data-testid="project-company-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select value={form.industry} onValueChange={v => setForm({...form, industry: v})}>
                  <SelectTrigger data-testid="project-industry-select">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Name</Label>
                <Input 
                  id="contact" 
                  value={form.contact_name} 
                  onChange={e => setForm({...form, contact_name: e.target.value})}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={form.contact_email} 
                  onChange={e => setForm({...form, contact_email: e.target.value})}
                  placeholder="john@acme.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                value={form.notes} 
                onChange={e => setForm({...form, notes: e.target.value})}
                placeholder="Additional context about the client..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/projects')}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="create-project-btn">
                {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Project'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
