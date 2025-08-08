import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, Link } from '@remix-run/react'
import { prisma } from '#app/utils/prisma.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
  const chapterId = params.chapterId as string
  const chapter = await prisma.chapterPage.findUnique({ where: { id: chapterId } })
  if (!chapter) throw new Response('Not found', { status: 404 })
  return json({
    chapter: {
      ...chapter,
      keyConcepts: JSON.parse(chapter.keyConcepts || '[]'),
      studyQuestions: JSON.parse(chapter.studyQuestions || '[]'),
    },
  })
}

export default function ChapterRoute() {
  const data = useLoaderData<typeof loader>()
  const c = data.chapter as typeof data.chapter & { keyConcepts: string[]; studyQuestions: string[] }
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link to={`/workspaces/${c.workspaceId}`} className="underline">← Back to workspace</Link>
      <h1 className="text-2xl font-semibold">{String(c.order).padStart(2, '0')}. {c.title}</h1>
      <section>
        <h2 className="text-xl font-medium mb-2">Summary</h2>
        <p className="leading-7">{c.summary}</p>
      </section>
      <section>
        <h2 className="text-xl font-medium mb-2">Key concepts</h2>
        <ul className="list-disc pl-6 space-y-1">
          {c.keyConcepts.map((k, i) => <li key={i}>{k}</li>)}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-medium mb-2">Study questions</h2>
        <ol className="list-decimal pl-6 space-y-2">
          {c.studyQuestions.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </section>
    </div>
  )
}