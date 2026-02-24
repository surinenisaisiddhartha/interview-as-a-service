import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', badge: 'bg-green-50 text-green-600' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-50 text-purple-600' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-50 text-orange-600' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', badge: 'bg-red-50 text-red-600' },
}

interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: { value: number; isUp: boolean }
  color?: string
}

const MetricCard = ({ label, value, icon: Icon, trend, color = 'blue' }: MetricCardProps) => {
  const colors = colorMap[color] || colorMap['blue']
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
          {trend && (
            <div className={cn("flex items-center text-xs font-bold px-2 py-1 rounded-lg gap-1", colors.badge)}>
              {trend.isUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {trend.value}%
            </div>
          )}
        </div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  )
}

export { MetricCard }
