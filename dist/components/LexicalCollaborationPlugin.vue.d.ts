import type { Doc } from 'yjs';
import type { ExcludedProperties, Provider } from '@lexical/yjs';
import type { InitialEditorStateType } from '../types';
declare const _default: import("vue").DefineComponent<{
    id: {
        type: import("vue").PropType<string>;
        required: true;
    };
    providerFactory: {
        type: import("vue").PropType<(id: string, yjsDocMap: Map<string, Doc>) => Provider>;
        required: true;
    };
    shouldBootstrap: {
        type: import("vue").PropType<boolean>;
        required: true;
    };
    username: {
        type: import("vue").PropType<string>;
    };
    cursorColor: {
        type: import("vue").PropType<string>;
    };
    cursorsContainerRef: {
        type: import("vue").PropType<HTMLElement | null>;
    };
    initialEditorState: {
        type: import("vue").PropType<InitialEditorStateType>;
    };
    excludedProperties: {
        type: import("vue").PropType<ExcludedProperties>;
    };
    awarenessData: {
        type: import("vue").PropType<object>;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps, Readonly<import("vue").ExtractPropTypes<{
    id: {
        type: import("vue").PropType<string>;
        required: true;
    };
    providerFactory: {
        type: import("vue").PropType<(id: string, yjsDocMap: Map<string, Doc>) => Provider>;
        required: true;
    };
    shouldBootstrap: {
        type: import("vue").PropType<boolean>;
        required: true;
    };
    username: {
        type: import("vue").PropType<string>;
    };
    cursorColor: {
        type: import("vue").PropType<string>;
    };
    cursorsContainerRef: {
        type: import("vue").PropType<HTMLElement | null>;
    };
    initialEditorState: {
        type: import("vue").PropType<InitialEditorStateType>;
    };
    excludedProperties: {
        type: import("vue").PropType<ExcludedProperties>;
    };
    awarenessData: {
        type: import("vue").PropType<object>;
    };
}>>, {}, {}>;
export default _default;
