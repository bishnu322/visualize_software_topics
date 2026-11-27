import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark'

interface SettingsState {
  theme: Theme
  /** Show CCNA-level detail captions in every step player. */
  deepDive: boolean
  toggleTheme: () => void
  setDeepDive: (on: boolean) => void
}

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: systemTheme(),
      deepDive: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDeepDive: (deepDive) => set({ deepDive }),
    }),
    { name: 'netviz-theme' },
  ),
)
