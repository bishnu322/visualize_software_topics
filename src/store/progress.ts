import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressState {
  completed: string[]
  quizScores: Record<string, { correct: number; total: number }>
  markComplete: (slug: string) => void
  recordQuiz: (slug: string, correct: number, total: number) => void
  reset: () => void
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completed: [],
      quizScores: {},
      markComplete: (slug) =>
        set((s) => (s.completed.includes(slug) ? s : { completed: [...s.completed, slug] })),
      recordQuiz: (slug, correct, total) =>
        set((s) => ({
          quizScores: { ...s.quizScores, [slug]: { correct, total } },
          completed: correct === total && !s.completed.includes(slug) ? [...s.completed, slug] : s.completed,
        })),
      reset: () => set({ completed: [], quizScores: {} }),
    }),
    { name: 'netviz-progress' },
  ),
)
