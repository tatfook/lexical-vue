import type { EntityMatch } from '@lexical/text';
import type { Klass, TextNode } from 'lexical';
export declare function useLexicalTextEntity<N extends TextNode>(getMatch: (text: string) => null | EntityMatch, targetNode: Klass<N>, createNode: (textNode: TextNode) => N): void;
