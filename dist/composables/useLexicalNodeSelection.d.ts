import type { NodeKey } from 'lexical';
import type { MaybeRef } from '../types';
export declare function useLexicalNodeSelection(key: MaybeRef<NodeKey>): {
    isSelected: Readonly<import("vue").Ref<boolean>>;
    setSelected: (selected: boolean) => void;
    clearSelection: () => void;
};
