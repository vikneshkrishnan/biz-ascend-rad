'use client'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

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
