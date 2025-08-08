export type GeneratedChapterContent = {
  summary: string
  keyConcepts: Array<string>
  studyQuestions: Array<string>
}

export async function generateChapterContent(
  chapterTitle: string,
  chapterText: string,
): Promise<GeneratedChapterContent> {
  // Stub implementation for now. Replace with a real LLM call (RAG + citations) later.
  const sentences = chapterText
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const summary = sentences.slice(0, 3).join(' ')

  const words = chapterText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 4)

  const frequency = new Map<string, number>()
  for (const w of words) frequency.set(w, (frequency.get(w) ?? 0) + 1)
  const keyConcepts = [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([w]) => w)

  const studyQuestions = [
    `What is the primary idea of "${chapterTitle}"?`,
    `How do the key concepts relate to each other in "${chapterTitle}"?`,
    `Can you provide an example that illustrates a central concept from this chapter?`,
    `What potential pitfalls or edge cases should be considered regarding the concepts in this chapter?`,
    `How does this chapter connect to previous or subsequent chapters?`,
  ]

  return { summary, keyConcepts, studyQuestions }
}