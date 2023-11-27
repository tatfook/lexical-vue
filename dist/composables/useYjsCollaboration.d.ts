import type { Binding, ExcludedProperties, Provider } from '@lexical/yjs';
import type { LexicalEditor } from 'lexical';
import type { Doc } from 'yjs';
import type { ComputedRef } from 'vue';
import type { InitialEditorStateType } from '../types';
export declare function useYjsCollaboration(editor: LexicalEditor, id: string, provider: Provider, docMap: Map<string, Doc>, name: string, color: string, shouldBootstrap: boolean, initialEditorState?: InitialEditorStateType, excludedProperties?: ExcludedProperties, awarenessData?: object): ComputedRef<Binding>;
export declare function useYjsFocusTracking(editor: LexicalEditor, provider: Provider, name: string, color: string, awarenessData?: object): void;
export declare function useYjsHistory(editor: LexicalEditor, binding: Binding): () => void;
