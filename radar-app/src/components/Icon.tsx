import type { CSSProperties, ReactNode } from "react"

interface IconDef {
  path?: string
  viewBox?: string
  render?: (size: number, className: string | undefined, style: CSSProperties | undefined) => ReactNode
}

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}

function def(path: string, viewBox = "0 0 24 24"): IconDef {
  return { path, viewBox }
}

const icons: Record<string, IconDef> = {
  notifications: def(
    "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
  ),
  account_balance_wallet: def(
    "M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
  ),
  groups: def(
    "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
  ),
  warning: def(
    "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
  ),
  check_circle: def(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
  ),
  close: def(
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
  ),
  info: def(
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
  ),
  sensors: def(
    "M7.76 16.24C6.67 15.15 6 13.66 6 12s.67-3.15 1.76-4.24l1.42 1.42C8.45 9.9 8 10.9 8 12c0 1.1.45 2.1 1.17 2.83l-1.41 1.41zm5.65.01C10.89 16.45 10 15.45 10 14c0-1.45.89-2.45 1.17-2.65l1.42 1.42c-.33.34-.59.77-.59 1.23s.26.89.59 1.23l-1.42 1.42zm5.66-1.41C17.33 14.1 18 13.1 18 12c0-1.1-.67-2.1-1.76-2.76l1.42-1.42C18.67 9.15 19 10.34 19 12c0 1.66-.33 3.15-1.24 4.24l-1.42-1.42zM12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
  ),
  search: def(
    "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
  ),
  trending_up: def(
    "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"
  ),
  smart_toy: def(
    "M12 2C8.69 2 6 4.69 6 8v1c0 1.1-.9 2-2 2H2v4h2c1.1 0 2 .9 2 2v1c0 3.31 2.69 6 6 6s6-2.69 6-6v-1c0-1.1.9-2 2-2h2v-4h-2c-1.1 0-2-.9-2-2V8c0-3.31-2.69-6-6-6zm-3 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-4-3c-2.21 0-4-1.79-4-4h8c0 2.21-1.79 4-4 4z"
  ),
  chatbot: {
    viewBox: "0 0 24 24",
    render: (size, className, style) => (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      </svg>
    ),
  },
  radar: {
    viewBox: "0 0 512 512",
    render: (size, className, style) => (
      <svg width={size} height={size} viewBox="0 0 512 512" className={className} style={style}>
        <circle cx="256" cy="256" r="256" fill="#d0bcff" />
        <text
          x="256" y="278" textAnchor="middle" dominantBaseline="middle"
          fontFamily="Space Grotesk, Arial, sans-serif" fontWeight="700" fontSize="260" fill="#0A0A0F"
        >
          R
        </text>
      </svg>
    ),
  },
}

export default function Icon({ name, size = 24, className = '', style }: IconProps) {
  const icon = icons[name]
  if (!icon) return null

  if (icon.render) {
    return <>{icon.render(size, className, style)}</>
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox!}
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d={icon.path!} />
    </svg>
  )
}
