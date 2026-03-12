'use client'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    in_progress: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  }
  return <Badge variant="outline" className={styles[status] || styles.pending}>{status?.replace('_', ' ')}</Badge>
}

export function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
}

export function PageSkeleton() {
  return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
}

export function GlassCard({ children, className, glow = true, ...props }) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/20 dark:border-white/5 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:shadow-primary/5 hover:-translate-y-1.5",
        glow && "before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity duration-700",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, icon: Icon, trend, color, className }) {
  return (
    <GlassCard className={cn("group p-7 relative", className)}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className={cn("inline-flex p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/5 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-sm", color)}>
            <Icon className="w-6 h-6 stroke-[2.5px]" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm",
              trend > 0 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
            )}>
              {trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-muted-foreground/70 tracking-tight uppercase">{label}</p>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-4xl font-bold tracking-tighter tabular-nums">{value}</p>
            
            {/* Subtle sparkline-style trend line */}
            <div className="h-10 w-24 opacity-20 group-hover:opacity-100 transition-all duration-700 transform group-hover:translate-x-1">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <path 
                  d={trend > 0 ? "M0 35 L 20 30 L 40 32 L 60 15 L 80 18 L 100 5" : "M0 5 L 20 15 L 40 12 L 60 25 L 80 22 L 100 35"} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={trend > 0 ? "text-emerald-500" : "text-rose-500"}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle background glow */}
      <div className={cn("absolute -bottom-8 -right-8 w-32 h-32 blur-[60px] rounded-full opacity-10 pointer-events-none bg-current group-hover:opacity-30 transition-opacity duration-700", color)} />
    </GlassCard>
  )
}

export function GlowEffect({ className, color = "bg-primary" }) {
  return (
    <div className={cn("absolute -z-10 blur-[120px] rounded-full opacity-20 pointer-events-none animate-pulse", color, className)} />
  )
}
