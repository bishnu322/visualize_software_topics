import { useParams } from 'react-router-dom'
import { findLesson } from '@/content/registry'
import { LessonHeader } from '@/components/topic/LessonHeader'
import { LessonBody } from '@/components/topic/LessonBody'
import { CompleteBanner } from '@/components/topic/CompleteBanner'
import { LessonNav } from '@/components/topic/LessonNav'
import NotFound from './NotFound'

export default function TopicPage() {
  const { course = '', slug = '' } = useParams()
  const lesson = findLesson(course, slug)
  if (!lesson) return <NotFound />

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-12">
      <LessonHeader lesson={lesson} />
      <LessonBody lesson={lesson} />
      <CompleteBanner slug={lesson.slug} />
      <LessonNav lesson={lesson} />
    </article>
  )
}
