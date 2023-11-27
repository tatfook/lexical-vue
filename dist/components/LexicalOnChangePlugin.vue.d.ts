import type { EditorState, LexicalEditor } from 'lexical';
declare const _default: import("vue").DefineComponent<{
    ignoreInitialChange: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    ignoreSelectionChange: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    change: (editorState: EditorState, editor: LexicalEditor) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    ignoreInitialChange: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
    ignoreSelectionChange: {
        type: import("vue").PropType<boolean>;
        default: boolean;
    };
}>> & {
    onChange?: ((editorState: EditorState, editor: LexicalEditor) => any) | undefined;
}, {
    ignoreInitialChange: boolean;
    ignoreSelectionChange: boolean;
}, {}>;
export default _default;
