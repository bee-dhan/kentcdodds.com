import { Link, useLoaderData } from '@remix-run/react'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { prisma } from '#app/utils/prisma.server.ts'

export async function loader({}: LoaderFunctionArgs) {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  })
  return json({ workspaces })
}

export default function WorkspacesIndexRoute() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Workspaces</h1>
        <Link to="/workspaces/upload" className="underline">Upload textbook PDF</Link>
      </div>
      <ul className="space-y-2">
        {data.workspaces.map((ws) => (
          <li key={ws.id}>
            <Link className="underline" to={`/workspaces/${ws.id}`}>{ws.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}