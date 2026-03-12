import { useAuth, apiFetch } from '@/components/shared/context'
import { StatusBadge, PageSkeleton, GlassCard, StatCard, GlowEffect } from '@/components/shared/ui-helpers'
import { useQuery } from '@tanstack/react-query'
import { 
  Activity as ActivityIcon, FolderKanban, CheckCircle2, Clock, AlertTriangle, ChevronRight, Building2,
  PieChart as PieChartIcon, BarChart3, TrendingUp, Plus, Users, Zap, Briefcase, Calendar,
  ArrowUpRight, LayoutDashboard, Search, Bell, Settings
} from 'lucide-react'
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const ACTION_ICONS = {
  'project_created': FolderKanban,
  'project_updated': Clock,
  'project_completed': CheckCircle2,
  'user_login': ActivityIcon,
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
    { label: 'Total Projects', value: stats?.total_projects || 0, icon: FolderKanban, color: 'text-primary', trend: 12 },
    { label: 'Active Diagnostics', value: stats?.active_diagnostics || 0, icon: ActivityIcon, color: 'text-blue-500', trend: -3 },
    { label: 'Completed', value: stats?.completed_diagnostics || 0, icon: CheckCircle2, color: 'text-emerald-500', trend: 8 },
    { label: 'Consultants', value: stats?.total_consultants || 0, icon: Building2, color: 'text-violet-500', trend: 5 },
  ] : [
    { label: 'My Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-primary', trend: 5 },
    { label: 'Completed', value: projects?.filter(p => p.status === 'completed').length || 0, icon: CheckCircle2, color: 'text-emerald-500', trend: 2 },
    { label: 'Active', value: projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0, icon: Clock, color: 'text-blue-500', trend: -1 },
    { label: 'Reports', value: projects?.filter(p => p.report_generated).length || 0, icon: Zap, color: 'text-amber-500', trend: 3 },
  ]

  const sectorData = stats?.sectors ? Object.entries(stats.sectors).map(([name, value]) => ({ name, value })) : []
  const COLORS = ['#000000', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xl">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold tracking-tight">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const formatActivityDetails = (details) => {
    if (!details) return 'Action completed successfully';
    if (typeof details === 'string') return details;
    if (typeof details === 'object' && Object.keys(details).length > 0) {
      if (details.status) return `Status updated to ${details.status}`;
      if (details.industry) return `Industry set to ${details.industry}`;
      return 'System event recorded';
    }
    return 'Action completed successfully';
  };

  return (
    <div className="relative space-y-8 min-h-screen pb-20 px-2 bg-transparent">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <LayoutDashboard className="w-3 h-3" />
            Executive Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome, <span className="text-primary">{profile?.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            {isAdmin 
              ? "Platform metrics are showing strong growth across all sectors." 
              : "You're on track to complete your quarterly growth objectives."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground pr-8">Search anything...</span>
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">⌘K</kbd>
          </div>
          <Button variant="outline" size="icon" className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <Bell className="w-4 h-4" />
          </Button>
          {!isAdmin && (
            <Button className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold px-6 h-11" onClick={() => navigate('/projects/create')}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-700",
            i === 0 ? "delay-0" : i === 1 ? "delay-100" : i === 2 ? "delay-200" : "delay-300"
          )} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          <Tabs defaultValue="analytics" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-11">
                <TabsTrigger value="analytics" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Activity</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="rounded-xl font-semibold text-muted-foreground gap-2">
                Last 30 Days
                <ChevronRight className="w-4 h-4 rotate-90" />
              </Button>
            </div>

            <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
              <div className="grid gap-8">
                {isAdmin ? (
                  <GlassCard className="p-0 border-none bg-transparent shadow-none hover:translate-y-0">
                    <CardHeader className="pt-0 pb-6 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold tracking-tight">Industry Distribution</CardTitle>
                        <CardDescription>Live breakdown of projects across key economic sectors</CardDescription>
                      </div>
                      <Badge variant="secondary" className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold uppercase tracking-widest text-[10px] px-2.5 py-1">
                        Real-time
                      </Badge>
                    </CardHeader>
                    <GlassCard className="p-8 min-h-[400px]">
                      {sectorData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              {COLORS.map((color, i) => (
                                <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="8 8" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                              dy={15}
                              className="text-muted-foreground"
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                              className="text-muted-foreground"
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                              {sectorData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % COLORS.length})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-4">
                          <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50">
                            <BarChart3 className="w-12 h-12 opacity-20" />
                          </div>
                          <p className="font-medium">Collecting sector-specific data...</p>
                        </div>
                      )}
                    </GlassCard>
                  </GlassCard>
                ) : (
                  <GlassCard className="p-10 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 border-primary/10 hover:translate-y-0 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-10 items-center">
                      <div className="space-y-6 flex-1">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 rounded-full font-bold tracking-[0.15em] text-[10px] uppercase">
                          Revenue Acceleration
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight leading-tight">
                          Unlock hidden growth potential in your business model
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                          Our RAD™ diagnostic identifies bottlenecks and reveals scaling opportunities within minutes.
                        </p>
                        <Button size="lg" className="rounded-2xl font-bold px-8 h-12 shadow-xl shadow-primary/20" onClick={() => navigate('/projects/create')}>
                          Run New Diagnostic
                          <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                      <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                        <div className="relative p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl">
                          <Zap className="w-20 h-20 text-primary" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="m-0 focus-visible:outline-none">
              <GlassCard className="p-8">
                <div className="space-y-6">
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : activity?.activities?.length > 0 ? (
                    activity.activities.slice(0, 8).map((item, i) => {
                      const Icon = ACTION_ICONS[item.action_type] || ActivityIcon
                      return (
                        <div key={i} className="group relative flex items-start gap-5 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                              <Icon className="w-5 h-5 stroke-[2.5px]" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold tracking-tight">{item.action}</p>
                              <span className="text-[11px] font-semibold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium line-clamp-1">{formatActivityDetails(item.details)}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <ActivityIcon className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-muted-foreground font-medium">No activity recorded yet</p>
                    </div>
                  )}
                  <Button variant="ghost" className="w-full rounded-2xl font-bold text-sm text-muted-foreground hover:text-primary mt-4">
                    View Full Audit Log
                  </Button>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Area: Projects & Quick Actions */}
        <div className="space-y-8">
          <GlassCard className="flex flex-col h-[750px]">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight">Recent Projects</CardTitle>
                <CardDescription className="text-xs">Your active diagnostic pipeline</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary h-9 w-9" onClick={() => navigate('/projects')}>
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-6 pb-6">
                <div className="space-y-4">
                  {projectsLoading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
                  ) : projects?.length > 0 ? (
                    projects.slice(0, 10).map(project => (
                      <div 
                        key={project.id} 
                        className="group flex flex-col p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 cursor-pointer relative overflow-hidden"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="min-w-0">
                            <h4 className="font-bold text-lg tracking-tight truncate group-hover:text-primary transition-colors">{project.company_name}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">{project.industry}</p>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                        
                        <div className="space-y-2 mt-auto">
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                            <span>Diagnostic Score</span>
                            <span className="text-primary font-black">{project.status === 'completed' ? '84/100' : 'In Progress'}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                project.status === 'completed' ? "bg-primary" : "bg-primary/40 animate-pulse"
                              )}
                              style={{ width: project.status === 'completed' ? '84%' : '45%' }}
                            />
                          </div>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto rotate-6">
                        <Briefcase className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <div className="space-y-1 px-4">
                        <p className="font-bold">No active projects</p>
                        <p className="text-xs text-muted-foreground font-medium italic">Start a diagnostic to see your first growth report</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl font-bold px-6 border-zinc-200 dark:border-zinc-800" onClick={() => navigate('/projects/create')}>
                        Create Project
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {projects?.length > 10 && (
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <Button variant="ghost" className="w-full rounded-2xl font-bold text-xs text-muted-foreground hover:text-primary" onClick={() => navigate('/projects')}>
                    See all {projects.length} projects
                  </Button>
                </div>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard className="p-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Settings className="w-6 h-6 text-white stroke-[2.5px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">System Health</p>
                <p className="font-bold tracking-tight">Optimal Performance</p>
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-40" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
