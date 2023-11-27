import type { ElementFormatType } from 'lexical';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    format: {
        type: import("vue").PropType<ElementFormatType>;
    };
    nodeKey: {
        type: import("vue").PropType<string>;
        required: true;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    format: {
        type: import("vue").PropType<ElementFormatType>;
    };
    nodeKey: {
        type: import("vue").PropType<string>;
        required: true;
    };
}>>, {}, {}>, {
    default?(_: {}): any;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
