import type { TextNode } from 'lexical';
import type { Resolution, TypeaheadOption } from '../composables';
declare function selectOptionAndCleanUp(selectedEntry: TypeaheadOption): void;
declare function updateSelectedIndex(index: number): void;
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    anchorElementRef: {
        type: import("vue").PropType<HTMLElement>;
        required: true;
    };
    resolution: {
        type: import("vue").PropType<Resolution>;
        required: true;
    };
    options: {
        type: import("vue").PropType<TypeaheadOption[]>;
        required: true;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: () => void;
    selectOption: (payload: {
        close: () => void;
        option: TypeaheadOption;
        textNodeContainingQuery: TextNode | null;
        matchingString: string;
    }) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    anchorElementRef: {
        type: import("vue").PropType<HTMLElement>;
        required: true;
    };
    resolution: {
        type: import("vue").PropType<Resolution>;
        required: true;
    };
    options: {
        type: import("vue").PropType<TypeaheadOption[]>;
        required: true;
    };
}>> & {
    onClose?: (() => any) | undefined;
    onSelectOption?: ((payload: {
        close: () => void;
        option: TypeaheadOption;
        textNodeContainingQuery: TextNode | null;
        matchingString: string;
    }) => any) | undefined;
}, {}, {}>, {
    default?(_: {
        listItemProps: {
            options: TypeaheadOption[];
            selectOptionAndCleanUp: typeof selectOptionAndCleanUp;
            selectedIndex: number | null;
            setHighlightedIndex: typeof updateSelectedIndex;
        };
        anchorElementRef: HTMLElement;
        matchString: string;
    }): any;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
