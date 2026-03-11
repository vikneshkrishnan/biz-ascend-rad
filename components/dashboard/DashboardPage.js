'use client'
import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton, GlassCard, StatCard, GlowEffect } from '@/components/shared/ui-helpers'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity, FolderKanban, CheckCircle2, Clock, AlertTriangle, ChevronRight, Building2,
  PieChart as PieChartIcon, BarChart3, TrendingUp, Plus, Users, Zap, Briefcase, Calendar
} from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts'
import { cn } from '@/lib/utils'

const ACTION_ICONS = {
  'project_created': FolderKanban,
  'project_updated': Clock,
  'project_completed': CheckCircle2,
  'user_login': Activity,
  'score_generated': Zap,
}

export function DashboardPage() {
  const { profile, navigate } = useAuth()
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['stats'], queryFn: () => apiFetch('/admin/stats') })
  const { data: activity, isLoading: activityLoading } = useQuery({ queryKey: ['activity'], queryFn: () => apiFetch('/activity') })
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })

  if (statsLoading) return <PageSkeleton />

  const isAdmin = profile?.role === 'admin'
  const statCards = isAdmin ? [
    { label: 'Total Projects', value: stats?.total_projects || 0, icon: FolderKanban, color: 'text-blue-500', trend: 12 },
    { label: 'Active Diagnostics', value: stats?.active_diagnostics || 0, icon: Activity, color: 'text-orange-500', trend: -3 },
    { label: 'Completed', value: stats?.completed_diagnostics || 0, icon: CheckCircle2, color: 'text-green-500', trend: 8 },
    { label: 'Consultants', value: stats?.total_consultants || 0, icon: Building2, color: 'text-purple-500', trend: 5 },
  ] : [
    { label: 'My Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-blue-500', trend: 5 },
    { label: 'Completed', value: projects?.filter(p => p.status === 'completed').length || 0, icon: CheckCircle2, color: 'text-green-500', trend: 2 },
    { label: 'Active', value: projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0, icon: Clock, color: 'text-orange-500', trend: -1 },
    { label: 'Reports', value: projects?.filter(p => p.report_generated).length || 0, icon: Zap, color: 'text-yellow-500', trend: 3 },
  ]

  const sectorData = stats?.sectors ? Object.entries(stats.sectors).map(([name, value]) => ({ name, value })) : []
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#eab308']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl">
          <p className="font-bold text-sm">{label}</p>
          <p className="text-primary font-black text-lg">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative space-y-10 min-h-screen pb-20 px-4 md:px-0">
      {/* Decorative Background Elements */}
      <GlowEffect className="top-0 -left-20 w-[600px] h-[600px] opacity-10" color="bg-primary" />
      <GlowEffect className="bottom-40 -right-20 w-[500px] h-[500px] opacity-10" color="bg-blue-600" />

      {/* Header Section */}
      <div className="relative pt-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-xs">
              <div className="h-1 w-8 bg-primary rounded-full" />
              Dashboard Overview
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground to-foreground/40 leading-tight">
              Welcome back, <br className="md:hidden" />
              <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
              {isAdmin 
                ? "Your platform is performing optimally. Here's what's happening across all organizations." 
                : "You're making great progress on your revenue acceleration journey. Keep it up!"}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {!isAdmin && (
              <Button size="xl" className="rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-transform font-bold px-8" onClick={() => navigate('/projects/create')}>
                <Plus className="w-5 h-5 mr-2 stroke-[3px]" />
                New Project
              </Button>
            )}
            {isAdmin && (
              <Button size="xl" variant="outline" className="rounded-2xl border-2 hover:bg-primary/5 font-bold px-8" onClick={() => navigate('/users')}>
                <Users className="w-5 h-5 mr-2 stroke-[3px]" />
                Manage Team
              </Button>
            )}
            <Button size="xl" variant="secondary" className="rounded-2xl font-bold px-8 group" onClick={() => navigate('/projects')}>
              View All
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="dashboard-stats">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-500",
            `delay-[${i * 100}ms]`
          )} />
        ))}
      </div>

      {/* Analytics & Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Visualizations & Major Info */}
        <div className="xl:col-span-2 space-y-8">
          {isAdmin && (
            <GlassCard className="h-[500px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    Industry Distribution
                  </CardTitle>
                  <CardDescription className="text-base mt-1 italic">Breakdown of projects across different sectors</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">LIVE DATA</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-0 pb-8">
                {sectorData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {COLORS.map((color, i) => (
                          <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12, fontWeight: 600 }}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={40}>
                        {sectorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % COLORS.length})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <div className="p-6 rounded-full bg-muted/20">
                      <BarChart3 className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="font-medium italic">Waiting for more sector data to populate...</p>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          )}

          {!isAdmin && (
            <GlassCard className="p-10 bg-gradient-to-br from-primary/20 via-transparent to-blue-500/10 border-primary/20 overflow-visible relative">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <Badge className="bg-primary text-white hover:bg-primary px-4 py-1 rounded-full font-black tracking-widest text-[10px]">REVENUE ACCELERATOR</Badge>
                  <h2 className="text-4xl font-black tracking-tight leading-tight">
                    Ready to accelerate your <span className="text-primary italic underline decoration-wavy underline-offset-8">revenue?</span>
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                    Our RAD™ diagnostic helps you identify hidden growth opportunities in your business system. Start a new project to get your personalized performance score.
                  </p>
                  <Button size="lg" className="rounded-2xl font-black px-10 h-14 shadow-2xl shadow-primary/30" onClick={() => navigate('/projects/create')}>
                    START NEW DIAGNOSTIC
                  </Button>
                </div>
                <div className="hidden md:flex justify-center relative">
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                  <div className="relative p-8 bg-white/5 dark:bg-black/20 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700">
                    <Zap className="w-24 h-24 text-primary animate-bounce" />
                    <div className="mt-6 space-y-2 text-center">
                      <div className="h-2 w-24 bg-primary/30 rounded-full mx-auto" />
                      <div className="h-2 w-16 bg-primary/20 rounded-full mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Recent Activity */}
          <GlassCard>
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div>
                <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Activity className="w-6 h-6" />
                  </div>
                  System Activity
                </CardTitle>
                <CardDescription className="text-base italic">Live updates from the RAD™ ecosystem</CardDescription>
              </div>
              <Button variant="ghost" className="rounded-xl font-bold hover:bg-primary/5 text-primary">View Log</Button>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-2">
                {/* Vertical timeline line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 via-primary/10 to-transparent" />
                
                {activityLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                  </div>
                ) : activity?.activities?.slice(0, 5).map((item, i) => {
                  const Icon = ACTION_ICONS[item.action_type] || Activity
                  return (
                    <div key={i} className="group relative flex items-center gap-6 p-4 rounded-2xl transition-all duration-300 hover:bg-white/5 dark:hover:bg-white/5 cursor-default">
                      <div className="relative z-10 w-12 h-12 rounded-2xl bg-muted/50 dark:bg-muted/10 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-base font-bold tracking-tight">{item.action}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 font-medium">{item.details || 'System event recorded'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Right Column: Recent Projects & Context */}
        <div className="space-y-8">
          <GlassCard className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  Recent Projects
                </CardTitle>
                <CardDescription className="font-medium italic">Your active pipeline</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary" onClick={() => navigate('/projects')}>
                <ChevronRight className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-auto">
              {projectsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
                </div>
              ) : projects?.length > 0 ? (
                projects.slice(0, 6).map(project => (
                  <div 
                    key={project.id} 
                    className="group flex flex-col p-5 rounded-2xl border border-white/5 bg-white/5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-500 cursor-pointer relative overflow-hidden"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-lg truncate group-hover:text-primary transition-colors tracking-tight">{project.company_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] font-black tracking-widest uppercase py-0 px-2 opacity-60">{project.industry}</Badge>
                        </div>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-tighter uppercase">
                        <span>Diagnostic Progress</span>
                        <span>{project.status === 'completed' ? '100%' : '45%'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            project.status === 'completed' ? "bg-green-500" : "bg-primary animate-pulse"
                          )}
                          style={{ width: project.status === 'completed' ? '100%' : '45%' }}
                        />
                      </div>
                    </div>

                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 py-10 text-center">
                  <div className="p-6 rounded-full bg-muted/10 border border-white/5">
                    <Plus className="w-10 h-10 opacity-20" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold">No projects yet</p>
                    <p className="text-xs font-medium italic opacity-60">Start your first diagnostic to see results</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2 rounded-xl font-black tracking-widest text-[10px]" onClick={() => navigate('/projects/create')}>
                    CREATE PROJECT
                  </Button>
                </div>
              )}
            </CardContent>
            {projects?.length > 6 && (
              <div className="p-4 border-t border-white/5">
                <Button variant="ghost" className="w-full rounded-xl font-bold italic text-muted-foreground hover:text-primary" onClick={() => navigate('/projects')}>
                  And {projects.length - 6} more projects...
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
