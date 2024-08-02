import type { ShallowRef } from 'vue'
import { inject, onUnmounted, shallowRef, triggerRef } from 'vue'
import type { LexicalEditor } from 'lexical'
import { editorKey } from './inject'

export function useReactiveEditor(): ShallowRef<LexicalEditor> {
  const editor = inject(editorKey)

  if (!editor)
    throw new Error('<LexicalComposer /> is required')

  const editorRef = shallowRef(editor)

  const unregisterListener = editor.registerUpdateListener(() => {
    triggerRef(editorRef)
  })

  onUnmounted(() => {
    unregisterListener()
  })

  return editorRef
}
