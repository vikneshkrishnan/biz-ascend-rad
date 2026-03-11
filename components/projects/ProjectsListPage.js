'use client'
import { useState } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton } from '@/components/shared/ui-helpers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  Plus, Search, ChevronRight, Building2, MoreVertical, Trash2, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'

export function ProjectsListPage() {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })
  
  const deleteMutation = useMutation({
    mutationFn: (id) => apiFetch(`/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project archived')
    },
    onError: (err) => toast.error(err.message)
  })

  if (isLoading) return <PageSkeleton />

  const filtered = projects?.filter(p => 
    p.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.industry?.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">{projects?.length || 0} total projects</p>
        </div>
        <Button onClick={() => navigate('/projects/new')} data-testid="new-project-btn">
          <Plus className="w-4 h-4 mr-2" />New Project
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search projects..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
          data-testid="projects-search"
        />
      </div>

      <div className="grid gap-4" data-testid="projects-list">
        {filtered.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No projects found</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/projects/new')}>
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map(project => (
            <Card 
              key={project.id} 
              className="border-2 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/projects/${project.id}`)}
              data-testid={`project-card-${project.id}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{project.company_name}</h3>
                        <p className="text-sm text-muted-foreground">{project.industry}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={project.status} />
                    {project.latest_assessment?.scores?.radScore && (
                      <div className="hidden sm:block text-right">
                        <p className="text-2xl font-bold text-primary">{project.latest_assessment.scores.radScore}</p>
                        <p className="text-xs text-muted-foreground">RAD Score</p>
                      </div>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`) }}>
                          <Eye className="w-4 h-4 mr-2" />View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(project.id) }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
