/*!
 * Original code by Meta Platforms
 * MIT Licensed, Copyright (c) Meta Platforms, Inc. and affiliates, see https://github.com/facebook/lexical/blob/main/LICENSE for details
 *
 */
import type { LinkAttributes } from '@lexical/link';
import type { LexicalEditor } from 'lexical';
import type { MaybeRef } from '../types';
type ChangeHandler = (url: string | null, prevUrl: string | null) => void;
interface LinkMatcherResult {
    attributes?: LinkAttributes;
    index: number;
    length: number;
    text: string;
    url: string;
}
export type LinkMatcher = (text: string) => LinkMatcherResult | null;
export declare function useAutoLink(editor: LexicalEditor, matchers: MaybeRef<Array<LinkMatcher>>, onChange?: ChangeHandler): void;
export {};
