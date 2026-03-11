'use client'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton } from '@/components/shared/ui-helpers'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, FolderKanban, CheckCircle2, Clock, AlertTriangle, ChevronRight, Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const { profile, navigate } = useAuth()
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['stats'], queryFn: () => apiFetch('/admin/stats') })
  const { data: activity, isLoading: activityLoading } = useQuery({ queryKey: ['activity'], queryFn: () => apiFetch('/activity') })
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })

  if (statsLoading) return <PageSkeleton />

  const isAdmin = profile?.role === 'admin'
  const statCards = isAdmin ? [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Completed', value: stats?.completedProjects || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'In Progress', value: stats?.inProgressProjects || 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Pending Review', value: stats?.pendingProjects || 0, icon: AlertTriangle, color: 'text-red-500' },
  ] : [
    { label: 'My Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-blue-500' },
    { label: 'Completed', value: projects?.filter(p => p.status === 'completed').length || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Active', value: projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0, icon: Clock, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}</h1>
        <p className="text-muted-foreground mt-1">{isAdmin ? 'Platform overview and analytics' : 'Your project dashboard'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="dashboard-stats">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : activity?.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Recent Projects</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>View All<ChevronRight className="w-4 h-4 ml-1" /></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectsLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : projects?.slice(0, 4).map(project => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{project.company_name}</p>
                    <p className="text-xs text-muted-foreground">{project.industry}</p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin: Sector Distribution */}
      {isAdmin && stats?.sectors && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Projects by Sector</CardTitle>
            <CardDescription>Distribution across industries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.sectors).map(([sector, count]) => (
                <div key={sector} className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{count}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{sector}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
