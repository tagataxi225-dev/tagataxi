import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Calendar as CalendarIcon, Download, RefreshCw } from 'lucide-react'

interface DateRange {
  start: string
  end: string
}

interface AdminFiltersBarProps {
  dateRange: DateRange
  onChange: (range: DateRange) => void
  onExport?: () => void
}

export function AdminFiltersBar({ dateRange, onChange, onExport }: AdminFiltersBarProps) {
  const presets = useMemo(() => ([
    { key: '7d', label: '7 jours', calc: () => ({ start: new Date(Date.now() - 6*24*3600*1000).toISOString(), end: new Date().toISOString() }) },
    { key: '30d', label: '30 jours', calc: () => ({ start: new Date(Date.now() - 29*24*3600*1000).toISOString(), end: new Date().toISOString() }) },
    { key: 'mo', label: 'Ce mois', calc: () => { const n = new Date(); return { start: new Date(n.getFullYear(), n.getMonth(), 1).toISOString(), end: new Date().toISOString() } } },
    { key: 'q', label: '3 mois', calc: () => ({ start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(), end: new Date().toISOString() }) },
  ]), [])

  const humanRange = useMemo(() => {
    const s = new Date(dateRange.start)
    const e = new Date(dateRange.end)
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { year: '2-digit', month: '2-digit', day: '2-digit' })
    return `${fmt(s)} → ${fmt(e)}`
  }, [dateRange])

  return (
    <Card className="p-3 md:p-4 border-muted/40 bg-card/50 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{humanRange}</span>
        </div>

        <Select onValueChange={(v) => {
          const p = presets.find(pr => pr.key === v)
          if (p) onChange(p.calc())
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            {presets.map(p => (
              <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => onChange({ ...dateRange })}>
          <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
        )}
      </div>
    </Card>
  )
}
