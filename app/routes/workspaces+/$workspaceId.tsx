import { Link, useLoaderData } from '@remix-run/react'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/prisma.server.ts'

export async function loader({ params }: LoaderFunctionArgs) {
  const workspaceId = params.workspaceId as string
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { chapters: { orderBy: { order: 'asc' } } },
  })
  if (!workspace) throw new Response('Not found', { status: 404 })
  return json({ workspace })
}

export default function WorkspaceRoute() {
  const data = useLoaderData<typeof loader>()
  const ws = data.workspace
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{ws.title}</h1>
      </div>
      <ul className="space-y-3">
        {ws.chapters.map((c) => (
          <li key={c.id}>
            <Link className="underline" to={`/workspaces/${ws.id}/chapters/${c.id}`}>
              {String(c.order).padStart(2, '0')}. {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}