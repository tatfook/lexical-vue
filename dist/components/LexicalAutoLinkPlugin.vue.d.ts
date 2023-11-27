import { type LinkMatcher } from '../composables';
declare const _default: import("vue").DefineComponent<{
    matchers: {
        type: import("vue").PropType<LinkMatcher[]>;
        required: true;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    change: (value: {
        url: string | null;
        prevUrl: string | null;
    }) => void;
}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    matchers: {
        type: import("vue").PropType<LinkMatcher[]>;
        required: true;
    };
}>> & {
    onChange?: ((value: {
        url: string | null;
        prevUrl: string | null;
    }) => any) | undefined;
}, {}, {}>;
export default _default;
