import type { EntityMatch } from '@lexical/text'
import type { Klass, TextNode } from 'lexical'

import { registerLexicalTextEntity } from '@lexical/text'
import { mergeRegister } from '@lexical/utils'
import { useLexicalComposer } from './useLexicalComposer'
import { useMounted } from './useMounted'

export function useLexicalTextEntity<N extends TextNode>(
  getMatch: (text: string) => null | EntityMatch,
  targetNode: Klass<N>,
  createNode: (textNode: TextNode) => N,
): void {
  const editor = useLexicalComposer()

  useMounted(() => {
    return mergeRegister(
      ...registerLexicalTextEntity(editor, getMatch, targetNode, createNode),
    )
  })
}
