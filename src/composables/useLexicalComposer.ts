import { inject } from 'vue'
import type { LexicalEditor } from 'lexical'
import { editorKey } from './inject'

export function useLexicalComposer(): LexicalEditor {
  const editor = inject(editorKey)

  if (!editor)
    throw new Error('<LexicalComposer /> is required')

  return editor
}
