import type { TextNode } from 'lexical';
import type { Resolution, TriggerFn, TypeaheadOption } from '../composables';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    anchorClassName: {
        type: import("vue").PropType<string>;
    };
    triggerFn: {
        type: import("vue").PropType<TriggerFn>;
        required: true;
    };
    options: {
        type: import("vue").PropType<TypeaheadOption[]>;
        required: true;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    close: () => void;
    open: (payload: Resolution) => void;
    queryChange: (payload: string | null) => void;
    selectOption: (payload: {
        close: () => void;
        option: TypeaheadOption;
        textNodeContainingQuery: TextNode | null;
        matchingString: string;
    }) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    anchorClassName: {
        type: import("vue").PropType<string>;
    };
    triggerFn: {
        type: import("vue").PropType<TriggerFn>;
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
    onOpen?: ((payload: Resolution) => any) | undefined;
    onQueryChange?: ((payload: string | null) => any) | undefined;
}, {}, {}>, {
    default?(_: {
        listItemProps: {
            options: TypeaheadOption[];
            selectOptionAndCleanUp: (selectedEntry: TypeaheadOption) => void;
            selectedIndex: number | null;
            setHighlightedIndex: (index: number) => void;
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
