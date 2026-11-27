import { COURSES } from '@/content/registry'
import { Hero } from '@/components/home/Hero'
import { FeatureGrid } from '@/components/home/FeatureGrid'
import { CourseCurriculum } from '@/components/home/CourseCurriculum'

export default function Home() {
  return (
    <div>
      <Hero />
      <FeatureGrid />
      {COURSES.map((c) => (
        <CourseCurriculum key={c.id} course={c} />
      ))}
    </div>
  )
}
