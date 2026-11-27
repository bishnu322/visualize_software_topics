import { Navigate, useParams } from 'react-router-dom'
import { courseById, lessonBySlug, lessonPath, lessonsByCourse } from '@/content/registry'
import NotFound from '@/pages/NotFound'

/**
 * Handles one-segment /learn/:param URLs:
 *  /learn/system-design → first lesson of that course
 *  /learn/osi-model     → /learn/networks/osi-model (old links from before courses existed)
 */
export function LearnRedirect() {
  const { param = '' } = useParams()
  const course = courseById(param)
  if (course) return <Navigate to={lessonPath(lessonsByCourse(course.id)[0])} replace />
  const lesson = lessonBySlug(param)
  if (lesson) return <Navigate to={lessonPath(lesson)} replace />
  return <NotFound />
}
