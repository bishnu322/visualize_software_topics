import { useEffect } from 'react'
import { useSettings } from '@/store/settings'

/** Syncs the persisted theme to the <html> class. Call once at the root. */
export function useThemeSync() {
  const theme = useSettings((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
}

export function useIsDark() {
  return useSettings((s) => s.theme === 'dark')
}
