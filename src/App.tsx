import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LearnRedirect } from '@/components/topic/LearnRedirect'
import { useThemeSync } from '@/hooks/useTheme'
import Home from '@/pages/Home'
import NotFound from '@/pages/NotFound'

const TopicPage = lazy(() => import('@/pages/TopicPage'))
const Playground = lazy(() => import('@/pages/Playground'))

export default function App() {
  useThemeSync()
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="learn/:course/:slug" element={<TopicPage />} />
            <Route path="learn/:param" element={<LearnRedirect />} />
            <Route path="playground" element={<Playground />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
