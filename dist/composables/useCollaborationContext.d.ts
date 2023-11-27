import type { Doc } from 'yjs';
export interface CollaborationContextType {
    clientID: number;
    color: string;
    isCollabActive: boolean;
    name: string;
    yjsDocMap: Map<string, Doc>;
}
declare const _default: import("vue").Ref<{
    clientID: number;
    color: string;
    isCollabActive: boolean;
    name: string;
    yjsDocMap: Map<string, Doc>;
}>;
export default _default;
