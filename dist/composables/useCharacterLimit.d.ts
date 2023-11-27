import type { LexicalEditor } from 'lexical';
import { OverflowNode } from '@lexical/overflow';
interface OptionalProps {
    remainingCharacters?: (characters: number) => void;
    strlen?: (input: string) => number;
}
export declare function useCharacterLimit(editor: LexicalEditor, maxCharacters: number, optional?: OptionalProps): void;
export declare function mergePrevious(overflowNode: OverflowNode): void;
export {};
