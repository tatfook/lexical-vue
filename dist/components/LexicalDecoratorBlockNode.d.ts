import type { ElementFormatType, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';
import type { Component } from 'vue';
export type SerializedDecoratorBlockNode = Spread<{
    format: ElementFormatType;
}, SerializedLexicalNode>;
export declare class DecoratorBlockNode extends DecoratorNode<Component> {
    __format?: ElementFormatType;
    constructor(format?: ElementFormatType, key?: NodeKey);
    exportJSON(): SerializedDecoratorBlockNode;
    createDOM(): HTMLDivElement;
    updateDOM(): boolean;
    setFormat(format: ElementFormatType): void;
}
export declare function $createDecoratorBlockNode(): DecoratorBlockNode;
export declare function $isDecoratorBlockNode(node: LexicalNode | null | undefined): node is DecoratorBlockNode;
