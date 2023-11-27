import type { LexicalEditor } from 'lexical';
import type { Ref } from 'vue';
import type { MaybeRef } from '../types';
export type TriggerFn = (text: string, editor: LexicalEditor) => QueryMatch | null;
export declare const PUNCTUATION = "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
export declare class TypeaheadOption {
    key: string;
    elRef?: Ref<HTMLElement | null>;
    constructor(key: string);
    setRefElement(element: HTMLElement | null): void;
}
export declare function useBasicTypeaheadTriggerMatch(trigger: string, { minLength, maxLength }: {
    minLength?: number;
    maxLength?: number;
}): TriggerFn;
export declare function useMenuAnchorRef(resolution: MaybeRef<Resolution | null>, setResolution: (r: Resolution | null) => void, className?: string): Ref<HTMLElement>;
export interface QueryMatch {
    leadOffset: number;
    matchingString: string;
    replaceableString: string;
}
export interface Resolution {
    match: QueryMatch;
    getRect: () => DOMRect;
}
export declare function useDynamicPositioning(resolution: MaybeRef<Resolution | null>, targetElement: MaybeRef<HTMLElement | null>, onReposition: () => void, onVisibilityChange?: (isInView: boolean) => void): void;
