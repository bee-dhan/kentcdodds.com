import { Form, useNavigation } from '@remix-run/react'
import { json, redirect, unstable_composeUploadHandlers, unstable_createFileUploadHandler, unstable_parseMultipartFormData, type ActionFunctionArgs } from '@remix-run/node'
import path from 'path'
import { prisma } from '#app/utils/prisma.server.ts'
import { detectChaptersFromText, extractPdfText, saveUploadedFileToDisk } from '#app/utils/pdf.server.ts'
import { generateChapterContent } from '#app/utils/ai.server.ts'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function action({ request }: ActionFunctionArgs) {
  const uploadHandler = unstable_composeUploadHandlers(async ({ name, data, filename }) => {
    if (name !== 'pdf' || !filename) return undefined
    // We cannot stream to disk easily here without File API, so fallback to buffering
    const chunks: Array<Uint8Array> = []
    for await (const chunk of data) chunks.push(chunk)
    const file = new File(chunks, filename)
    const filePath = await saveUploadedFileToDisk(file, UPLOADS_DIR)
    return filePath
  })

  const formData = await unstable_parseMultipartFormData(request, uploadHandler)
  const title = String(formData.get('title') || '').trim() || 'Textbook Workspace'
  const filePath = String(formData.get('pdf') || '')
  if (!filePath) return json({ error: 'PDF is required' }, { status: 400 })

  const text = await extractPdfText(filePath)
  const chapters = detectChaptersFromText(text)

  const workspace = await prisma.workspace.create({
    data: {
      title,
      sources: {
        create: [{ title, type: 'PDF', filePath }],
      },
    },
    include: { sources: true },
  })

  const source = workspace.sources[0]

  for (const ch of chapters) {
    const windowSize = Math.max(500, Math.floor(text.length / (chapters.length + 1)))
    const offset = (ch.order - 1) * windowSize
    const chapterText = text.slice(offset, offset + windowSize)
    const gen = await generateChapterContent(ch.title, chapterText)

    await prisma.chapterPage.create({
      data: {
        title: ch.title,
        order: ch.order,
        summary: gen.summary,
        keyConcepts: JSON.stringify(gen.keyConcepts),
        studyQuestions: JSON.stringify(gen.studyQuestions),
        pageStart: ch.pageStart ?? null,
        pageEnd: ch.pageEnd ?? null,
        workspaceId: workspace.id,
        sourceId: source.id,
      },
    })
  }

  return redirect(`/workspaces/${workspace.id}`)
}

export default function UploadPdfRoute() {
  const nav = useNavigation()
  const busy = nav.state !== 'idle'
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload textbook PDF</h1>
      <Form method="post" encType="multipart/form-data" className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Workspace Title</label>
          <input name="title" type="text" className="w-full border rounded p-2" placeholder="e.g., Introduction to Algorithms" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">PDF File</label>
          <input name="pdf" type="file" accept="application/pdf" required />
        </div>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={busy}>
          {busy ? 'Processing…' : 'Upload & Generate'}
        </button>
      </Form>
    </div>
  )
}