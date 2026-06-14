interface TelegramWebApp {
  ready: () => void
  expand: () => void
  initData?: string
  BackButton?: {
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
  HapticFeedback?: {
    notificationOccurred: (type: string) => void
  }
}

function getTelegram(): { WebApp?: TelegramWebApp } | null {
  return (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram ?? null
}

export function getWebApp(): TelegramWebApp | undefined {
  return getTelegram()?.WebApp
}

export function getInitData(): string {
  return getWebApp()?.initData ?? ""
}

export function showBackButton(): void {
  getWebApp()?.BackButton?.show()
}

export function hideBackButton(): void {
  getWebApp()?.BackButton?.hide()
}

export function onBackButtonClick(cb: () => void): (() => void) {
  const tg = getWebApp()
  if (tg?.BackButton) {
    tg.BackButton.onClick(cb)
    return () => tg.BackButton?.offClick(cb)
  }
  return () => {}
}

export function hapticSuccess(): void {
  getWebApp()?.HapticFeedback?.notificationOccurred("success")
}

export function initTelegram(): void {
  const tg = getWebApp()
  if (tg) {
    tg.ready()
    tg.expand()
  }
}
