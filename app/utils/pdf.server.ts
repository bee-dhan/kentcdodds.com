import fs from 'fs/promises'
import path from 'path'
import type { PDFDocumentProxy } from 'pdfjs-dist'
// pdf-parse has no great types; import as any
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfParse from 'pdf-parse'

export type DetectedChapter = {
  title: string
  order: number
  pageStart?: number
  pageEnd?: number
  rawHeading: string
}

export async function ensureUploadsDir(uploadsDir: string) {
  await fs.mkdir(uploadsDir, { recursive: true })
}

export async function saveUploadedFileToDisk(file: File, uploadsDir: string): Promise<string> {
  await ensureUploadsDir(uploadsDir)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`
  const fullPath = path.join(uploadsDir, safeName)
  await fs.writeFile(fullPath, buffer)
  return fullPath
}

export async function extractPdfText(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath)
  const data = await pdfParse(dataBuffer)
  return String(data.text ?? '')
}

export function detectChaptersFromText(text: string): Array<DetectedChapter> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const chapters: Array<DetectedChapter> = []

  const chapterRegexes: Array<RegExp> = [
    /^chapter\s+(\d+)[:.\-\s]+(.+)/i,
    /^(\d+)\s+([A-Z][\w\s\-:,']{3,})$/, // "1 Introduction to Algorithms"
    /^(\d+)\.\s+(.+)/, // "1. Getting Started"
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const re of chapterRegexes) {
      const m = line.match(re)
      if (m) {
        const num = Number(m[1])
        const title = (m[2] ?? '').trim()
        if (!Number.isNaN(num) && title.length > 0) {
          const exists = chapters.some((c) => c.order === num)
          if (!exists) {
            chapters.push({ title, order: num, rawHeading: line })
          }
          break
        }
      }
    }
  }

  // Fallback if no numbered chapters found: take top-level headings by capitalization/length
  if (chapters.length === 0) {
    let order = 1
    for (const line of lines) {
      if (/^[A-Z][A-Z\s\-:,']{6,}$/.test(line)) {
        chapters.push({ title: line.substring(0, 120), order: order++, rawHeading: line })
        if (chapters.length >= 15) break
      }
    }
  }

  // Sort by order and dedupe by order
  const sorted = chapters
    .sort((a, b) => a.order - b.order)
    .filter((c, idx, arr) => idx === 0 || c.order !== arr[idx - 1].order)

  return sorted.slice(0, 100)
}