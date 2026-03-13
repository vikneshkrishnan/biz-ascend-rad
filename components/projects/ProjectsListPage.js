'use client'
import { useState, useMemo } from 'react'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton, GlassCard, StatCard } from '@/components/shared/ui-helpers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Search, ChevronRight, Building2, Clock, 
  Briefcase, FolderKanban,
  Activity as ActivityIcon, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function ProjectsListPage() {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => {
      const matchSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) || p.industry.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [projects, search, statusFilter])

  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0 }
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length
    }
  }, [projects])

  if (isLoading) return <PageSkeleton />

  return (
    <div className="relative space-y-8 bg-transparent">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <Briefcase className="w-3 h-3" />
            Project Management
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Organization <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            Manage your diagnostic pipeline and access deep revenue insights across all active accounts.
          </p>
        </div>
        
        <Button className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold px-6 h-11" onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Portfolio" value={stats.total} icon={FolderKanban} color="text-primary" trend={5} />

        <StatCard label="Incomplete Assessments" value={stats.active} icon={ActivityIcon} color="text-blue-500" trend={2} />
        <StatCard label="Completed Reports" value={stats.completed} icon={CheckCircle2} color="text-emerald-500" trend={8} />
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 md:p-6 shadow-sm border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search by company or industry..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 h-12 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 h-auto p-0 min-w-[120px] font-semibold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="all">All Pipeline</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Projects Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project, i) => (
            <div 
              key={project.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <GlassCard 
                className="group flex flex-col p-7 border-zinc-200/50 dark:border-zinc-800/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 cursor-pointer relative overflow-hidden h-full"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
                    <Building2 className="w-7 h-7 stroke-[1.5px]" />
                  </div>
                  <StatusBadge status={project.status} className="shadow-sm" />
                </div>

                <div className="space-y-1 mb-8 flex-1">
                  <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">{project.company_name}</h3>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-60">{project.industry}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                      <span>Diagnostic Progress</span>
                      <span className="text-primary font-black">{project.status === 'completed' ? '100%' : '45%'}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-800/20">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          project.status === 'completed' ? "bg-emerald-500" : "bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                        )}
                        style={{ width: project.status === 'completed' ? '100%' : '45%' }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2].map((_, i) => (
                          <Avatar key={i} className="w-6 h-6 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">C{i+1}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{project.consultant?.name || 'Assigned'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase">
                      <Clock className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Subtle Hover Decoration */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </GlassCard>
            </div>
          ))}
        </div>
      ) : (
        <GlassCard className="py-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-[2.5rem] flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner rotate-6">
            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">No projects found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto font-medium">
              Try adjusting your search filters or create a new project to start a diagnostic.
            </p>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold px-8 border-zinc-200 dark:border-zinc-800" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            Reset All Filters
          </Button>
        </GlassCard>
      )}
    </div>
  )
}
