import type { EntityMatch } from '@lexical/text';
import type { TextNode } from 'lexical';
import type { Class } from '../types';
export declare function useLexicalTextEntity<N extends TextNode>(getMatch: (text: string) => null | EntityMatch, targetNode: Class<N>, createNode: (textNode: TextNode) => N): void;
