import type { CreateEditorArgs } from 'lexical';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<{
    initialConfig: {
        type: import("vue").PropType<CreateEditorArgs>;
        required: true;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    error: (error: Error) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    initialConfig: {
        type: import("vue").PropType<CreateEditorArgs>;
        required: true;
    };
}>> & {
    onError?: ((error: Error) => any) | undefined;
}, {}, {}>, {
    default?(_: {}): any;
}>;
export default _default;
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
