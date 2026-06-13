interface Props {
  verdict: string
  score: number
}

export default function RiskBadge({ verdict, score }: Props) {
  let badgeColor = "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border-green-300 dark:border-green-800"
  
  if (verdict.includes("Proceed")) {
    badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800"
  } else if (verdict.includes("Rug") || verdict.includes("Flag") || score > 60) {
    badgeColor = "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800"
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-sm ${badgeColor}`}>
      <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
      {verdict} (Risk: {score}/100)
    </div>
  )
}
