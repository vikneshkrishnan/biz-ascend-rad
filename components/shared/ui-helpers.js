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
        "relative overflow-hidden rounded-2xl border border-white/10 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-xl transition-all duration-500 hover:shadow-primary/5 hover:-translate-y-1",
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
    <GlassCard className={cn("group p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-4 flex-1">
          <div className={cn("inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 transition-transform group-hover:scale-110 duration-500", color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black tracking-tight">{value}</p>
              {trend && (
                <div className={cn(
                  "flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full border bg-white/5",
                  trend > 0 ? "text-green-500 border-green-500/20" : "text-red-500 border-red-500/20"
                )}>
                  {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(trend)}%
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Subtle trend line visualization (simulated) */}
        <div className="h-12 w-20 self-center opacity-30 group-hover:opacity-60 transition-opacity">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <path 
              d={trend > 0 ? "M0 35 Q 25 35, 50 20 T 100 5" : "M0 5 Q 25 5, 50 20 T 100 35"} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3"
              strokeLinecap="round"
              className={trend > 0 ? "text-green-500" : "text-red-500"}
            />
          </svg>
        </div>
      </div>
      
      {/* Subtle background glow */}
      <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none bg-current group-hover:opacity-20 transition-opacity duration-700", color)} />
    </GlassCard>
  )
}

export function GlowEffect({ className, color = "bg-primary" }) {
  return (
    <div className={cn("absolute -z-10 blur-[120px] rounded-full opacity-20 pointer-events-none animate-pulse", color, className)} />
  )
}
