import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { COURSES, type CourseId } from '@/content/registry'

const KEY = 'netviz-sidebar-open'

function read(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Which sidebar course groups are expanded. Remembered per browser; the current course auto-opens. */
export function useOpenCourses() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>(() => ({
    ...Object.fromEntries(COURSES.map((c) => [c.id, true])),
    ...read(),
  }))

  const current = pathname.split('/')[2]
  useEffect(() => {
    if (current && COURSES.some((c) => c.id === current)) setOpen((o) => (o[current] ? o : { ...o, [current]: true }))
  }, [current])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(open))
    } catch {
      /* storage unavailable */
    }
  }, [open])

  return {
    isOpen: (id: CourseId) => open[id] ?? true,
    toggle: (id: CourseId) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? true) })),
  }
}
