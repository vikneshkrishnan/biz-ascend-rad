'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3, Zap, FileText, Target, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Analyzing assessment scores...', icon: BarChart3 },
  { label: 'Generating strategic insights...', icon: Zap },
  { label: 'Building executive report...', icon: FileText },
  { label: 'Finalizing recommendations...', icon: Target },
]

export function ReportGenerationDialog({ state, error, onClose }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (state !== 'generating') {
      setCurrentStep(0)
      return
    }
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev))
    }, 8000)
    return () => clearInterval(interval)
  }, [state])

  const progressValue = state === 'success' ? 100 : ((currentStep + 1) / STEPS.length) * 90

  return (
    <Dialog open={state !== null} onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          'rounded-[2rem] border-zinc-200 dark:border-zinc-800 max-w-md',
          state !== 'error' && '[&>button:last-child]:hidden'
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { if (state !== 'error') e.preventDefault() }}
      >
        {state === 'generating' && (
          <>
            <DialogHeader className="text-center items-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Generating Intelligence Report
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Our AI is analyzing your assessment data
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 my-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                const isActive = i === currentStep
                const isCompleted = i < currentStep
                const isUpcoming = i > currentStep

                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500',
                      isActive && 'bg-primary/5 dark:bg-primary/10',
                      isCompleted && 'opacity-70',
                      isUpcoming && 'opacity-30'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Icon className={cn(
                        'w-5 h-5 shrink-0 transition-all duration-500',
                        isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'
                      )} />
                    )}
                    <span className={cn(
                      'text-sm transition-all duration-500',
                      isActive && 'font-semibold text-foreground',
                      isCompleted && 'text-muted-foreground line-through',
                      isUpcoming && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            <Progress value={progressValue} className="h-2 rounded-full" />
            <p className="text-xs text-center text-muted-foreground mt-3">
              This may take up to 60 seconds
            </p>
          </>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <DialogHeader className="text-center items-center">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Report Generated Successfully
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Your executive PDF is being downloaded
              </DialogDescription>
            </DialogHeader>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <DialogHeader className="text-center items-center">
              <DialogTitle className="text-xl font-bold tracking-tight">
                Report Generation Failed
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground max-w-xs">
                {error || 'An unexpected error occurred. Please try again.'}
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" className="rounded-2xl mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
