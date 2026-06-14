import { getBadgeColor } from "../lib/risk"

interface Props {
  verdict: string
  score: number
}

export default function RiskBadge({ verdict, score }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${getBadgeColor(verdict, score)}`}>
      <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
      {verdict} (Risk: {score}/100)
    </div>
  )
}
