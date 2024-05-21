// src/composables/useAutoLink.ts
import { unref } from "vue";
import _defaultImport from "@lexical/link";
const AutoLinkNode = _defaultImport.AutoLinkNode;
const $isLinkNode = _defaultImport.$isLinkNode;
const $isAutoLinkNode = _defaultImport.$isAutoLinkNode;
const $createAutoLinkNode = _defaultImport.$createAutoLinkNode;
import _defaultImport2 from "@lexical/utils";
const mergeRegister = _defaultImport2.mergeRegister;
import _defaultImport3 from "lexical";
// src/composables/useEffect.ts
const TextNode = _defaultImport3.TextNode;
const $isTextNode = _defaultImport3.$isTextNode;
const $isLineBreakNode = _defaultImport3.$isLineBreakNode;
const $isElementNode = _defaultImport3.$isElementNode;
const $createTextNode = _defaultImport3.$createTextNode;
import { watchEffect } from "vue";
function useEffect(cb, options) {
  watchEffect(onInvalidate => {
    const unregister = cb();
    onInvalidate(() => unregister?.());
  }, {
    flush: "post",
    ...options
  });
}

// src/composables/useAutoLink.ts
function findFirstMatch(textNode, matchers) {
  for (let i = 0; i < matchers.length; i++) {
    const match = matchers[i](textNode);
    if (match) return match;
  }
  return null;
}
var PUNCTUATION_OR_SPACE = /[.,;\s]/;
function isSeparator(char) {
  return PUNCTUATION_OR_SPACE.test(char);
}
function endsWithSeparator(textContent) {
  return isSeparator(textContent[textContent.length - 1]);
}
function startsWithSeparator(textContent) {
  return isSeparator(textContent[0]);
}
function isPreviousNodeValid(node) {
  let previousNode = node.getPreviousSibling();
  if ($isElementNode(previousNode)) previousNode = previousNode.getLastDescendant();
  return previousNode === null || $isLineBreakNode(previousNode) || $isTextNode(previousNode) && endsWithSeparator(previousNode.getTextContent());
}
function isNextNodeValid(node) {
  let nextNode = node.getNextSibling();
  if ($isElementNode(nextNode)) nextNode = nextNode.getFirstDescendant();
  return nextNode === null || $isLineBreakNode(nextNode) || $isTextNode(nextNode) && startsWithSeparator(nextNode.getTextContent());
}
function isContentAroundIsValid(matchStart, matchEnd, text, node) {
  const contentBeforeIsValid = matchStart > 0 ? isSeparator(text[matchStart - 1]) : isPreviousNodeValid(node);
  if (!contentBeforeIsValid) return false;
  const contentAfterIsValid = matchEnd < text.length ? isSeparator(text[matchEnd]) : isNextNodeValid(node);
  return contentAfterIsValid;
}
function handleLinkCreation(node, matchers, onChange) {
  const nodeText = node.getTextContent();
  let text = nodeText;
  let invalidMatchEnd = 0;
  let remainingTextNode = node;
  let match;
  while ((match = findFirstMatch(node, matchers)) && match !== null && invalidMatchEnd <= nodeText.length) {
    const matchStart = match.index;
    const matchLength = match.length;
    const matchEnd = matchStart + matchLength;
    const isValid = isContentAroundIsValid(invalidMatchEnd + matchStart, invalidMatchEnd + matchEnd, nodeText, node);
    if (isValid) {
      let linkTextNode;
      if (invalidMatchEnd + matchStart === 0) {
        [linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchLength);
      } else {
        [, linkTextNode, remainingTextNode] = remainingTextNode.splitText(invalidMatchEnd + matchStart, invalidMatchEnd + matchStart + matchLength);
      }
      const linkNode = $createAutoLinkNode(match.url, match.attributes);
      const textNode = $createTextNode(match.text);
      textNode.setFormat(linkTextNode.getFormat());
      textNode.setDetail(linkTextNode.getDetail());
      linkNode.append(textNode);
      linkTextNode.replace(linkNode);
      onChange(match.url, null);
      invalidMatchEnd = 0;
    } else {
      invalidMatchEnd += matchEnd;
    }
    text = text.substring(matchEnd);
  }
}
function handleLinkEdit(linkNode, matchers, onChange) {
  const children = linkNode.getChildren();
  const childrenLength = children.length;
  for (let i = 0; i < childrenLength; i++) {
    const child = children[i];
    if (!$isTextNode(child) || !child.isSimpleText()) {
      replaceWithChildren(linkNode);
      onChange(null, linkNode.getURL());
      return;
    }
  }
  const text = linkNode.getTextContent();
  const match = findFirstMatch(linkNode, matchers);
  if (match === null || match.text !== text) {
    replaceWithChildren(linkNode);
    onChange(null, linkNode.getURL());
    return;
  }
  if (!isPreviousNodeValid(linkNode) || !isNextNodeValid(linkNode)) {
    replaceWithChildren(linkNode);
    onChange(null, linkNode.getURL());
    return;
  }
  const url = linkNode.getURL();
  if (url !== match.url) {
    linkNode.setURL(match.url);
    onChange(match.url, url);
  }
  if (match.attributes) {
    const rel = linkNode.getRel();
    if (rel !== match.attributes.rel) {
      linkNode.setRel(match.attributes.rel || null);
      onChange(match.attributes.rel || null, rel);
    }
    const target = linkNode.getTarget();
    if (target !== match.attributes.target) {
      linkNode.setTarget(match.attributes.target || null);
      onChange(match.attributes.target || null, target);
    }
  }
}
function handleBadNeighbors(textNode, onChange) {
  const previousSibling = textNode.getPreviousSibling();
  const nextSibling = textNode.getNextSibling();
  const text = textNode.getTextContent();
  if ($isAutoLinkNode(previousSibling) && !startsWithSeparator(text)) {
    replaceWithChildren(previousSibling);
    onChange(null, previousSibling.getURL());
  }
  if ($isAutoLinkNode(nextSibling) && !endsWithSeparator(text)) {
    replaceWithChildren(nextSibling);
    onChange(null, nextSibling.getURL());
  }
}
function replaceWithChildren(node) {
  const children = node.getChildren();
  const childrenLength = children.length;
  for (let j = childrenLength - 1; j >= 0; j--) node.insertAfter(children[j]);
  node.remove();
  return children.map(child => child.getLatest());
}
function useAutoLink(editor, matchers, onChange) {
  useEffect(() => {
    if (!editor.hasNodes([AutoLinkNode])) {
      throw new Error("LexicalAutoLinkPlugin: AutoLinkNode not registered on editor");
    }
    const onChangeWrapped = (url, prevUrl) => {
      if (onChange) onChange(url, prevUrl);
    };
    return mergeRegister(editor.registerNodeTransform(TextNode, textNode => {
      const parent = textNode.getParentOrThrow();
      if ($isAutoLinkNode(parent)) {
        handleLinkEdit(parent, unref(matchers), onChangeWrapped);
      } else if (!$isLinkNode(parent)) {
        if (textNode.isSimpleText()) handleLinkCreation(textNode, unref(matchers), onChangeWrapped);
        handleBadNeighbors(textNode, onChangeWrapped);
      }
    }), editor.registerNodeTransform(AutoLinkNode, linkNode => {
      handleLinkEdit(linkNode, unref(matchers), onChangeWrapped);
    }));
  });
}

// src/composables/useCanShowPlaceholder.ts
import { readonly, ref } from "vue";
import _defaultImport4 from "@lexical/text";
const $canShowPlaceholderCurry = _defaultImport4.$canShowPlaceholderCurry;
import _defaultImport5 from "@lexical/utils";
// src/composables/useMounted.ts
const mergeRegister2 = _defaultImport5.mergeRegister;
import { onMounted, onUnmounted } from "vue";
function useMounted(cb) {
  let unregister;
  onMounted(() => {
    unregister = cb();
  });
  onUnmounted(() => {
    unregister?.();
  });
}

// src/composables/useCanShowPlaceholder.ts
function canShowPlaceholderFromCurrentEditorState(editor) {
  const currentCanShowPlaceholder = editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()));
  return currentCanShowPlaceholder;
}
function useCanShowPlaceholder(editor) {
  const initialState = editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()));
  const canShowPlaceholder = ref(initialState);
  function resetCanShowPlaceholder() {
    const currentCanShowPlaceholder = canShowPlaceholderFromCurrentEditorState(editor);
    canShowPlaceholder.value = currentCanShowPlaceholder;
  }
  useMounted(() => {
    return mergeRegister2(editor.registerUpdateListener(() => {
      resetCanShowPlaceholder();
    }), editor.registerEditableListener(() => {
      resetCanShowPlaceholder();
    }));
  });
  return readonly(canShowPlaceholder);
}

// src/composables/useCharacterLimit.ts
import _defaultImport6 from "@lexical/overflow";
const OverflowNode = _defaultImport6.OverflowNode;
const $isOverflowNode = _defaultImport6.$isOverflowNode;
const $createOverflowNode = _defaultImport6.$createOverflowNode;
import _defaultImport7 from "@lexical/text";
const $rootTextContent = _defaultImport7.$rootTextContent;
import _defaultImport8 from "@lexical/utils";
const mergeRegister3 = _defaultImport8.mergeRegister;
const $dfs = _defaultImport8.$dfs;
import _defaultImport9 from "lexical";
const $setSelection = _defaultImport9.$setSelection;
const $isTextNode2 = _defaultImport9.$isTextNode;
const $isRangeSelection = _defaultImport9.$isRangeSelection;
const $isLeafNode = _defaultImport9.$isLeafNode;
const $getSelection = _defaultImport9.$getSelection;
function useCharacterLimit(editor, maxCharacters, optional = Object.freeze({})) {
  const {
    strlen = input => input.length,
    // UTF-16
    remainingCharacters = _characters => {}
  } = optional;
  useMounted(() => {
    if (!editor.hasNodes([OverflowNode])) {
      throw new Error("useCharacterLimit: OverflowNode not registered on editor");
    }
    let text = editor.getEditorState().read($rootTextContent);
    let lastComputedTextLength = 0;
    return mergeRegister3(editor.registerTextContentListener(currentText => {
      text = currentText;
    }), editor.registerUpdateListener(({
      dirtyLeaves
    }) => {
      const isComposing = editor.isComposing();
      const hasDirtyLeaves = dirtyLeaves.size > 0;
      if (isComposing || !hasDirtyLeaves) return;
      const textLength = strlen(text);
      const textLengthAboveThreshold = textLength > maxCharacters || lastComputedTextLength !== null && lastComputedTextLength > maxCharacters;
      const diff = maxCharacters - textLength;
      remainingCharacters(diff);
      if (lastComputedTextLength === null || textLengthAboveThreshold) {
        const offset = findOffset(text, maxCharacters, strlen);
        editor.update(() => {
          $wrapOverflowedNodes(offset);
        }, {
          tag: "history-merge"
        });
      }
      lastComputedTextLength = textLength;
    }));
  });
}
function findOffset(text, maxCharacters, strlen) {
  const Segmenter = Intl.Segmenter;
  let offsetUtf16 = 0;
  let offset = 0;
  if (typeof Segmenter === "function") {
    const segmenter = new Segmenter();
    const graphemes = segmenter.segment(text);
    for (const {
      segment: grapheme
    } of graphemes) {
      const nextOffset = offset + strlen(grapheme);
      if (nextOffset > maxCharacters) break;
      offset = nextOffset;
      offsetUtf16 += grapheme.length;
    }
  } else {
    const codepoints = Array.from(text);
    const codepointsLength = codepoints.length;
    for (let i = 0; i < codepointsLength; i++) {
      const codepoint = codepoints[i];
      const nextOffset = offset + strlen(codepoint);
      if (nextOffset > maxCharacters) break;
      offset = nextOffset;
      offsetUtf16 += codepoint.length;
    }
  }
  return offsetUtf16;
}
function $wrapOverflowedNodes(offset) {
  const dfsNodes = $dfs();
  const dfsNodesLength = dfsNodes.length;
  let accumulatedLength = 0;
  for (let i = 0; i < dfsNodesLength; i += 1) {
    const {
      node
    } = dfsNodes[i];
    if ($isOverflowNode(node)) {
      const previousLength = accumulatedLength;
      const nextLength = accumulatedLength + node.getTextContentSize();
      if (nextLength <= offset) {
        const parent = node.getParent();
        const previousSibling = node.getPreviousSibling();
        const nextSibling = node.getNextSibling();
        $unwrapNode(node);
        const selection = $getSelection();
        if ($isRangeSelection(selection) && (!selection.anchor.getNode().isAttached() || !selection.focus.getNode().isAttached())) {
          if ($isTextNode2(previousSibling)) previousSibling.select();else if ($isTextNode2(nextSibling)) nextSibling.select();else if (parent !== null) parent.select();
        }
      } else if (previousLength < offset) {
        const descendant = node.getFirstDescendant();
        const descendantLength = descendant !== null ? descendant.getTextContentSize() : 0;
        const previousPlusDescendantLength = previousLength + descendantLength;
        const firstDescendantIsSimpleText = $isTextNode2(descendant) && descendant.isSimpleText();
        const firstDescendantDoesNotOverflow = previousPlusDescendantLength <= offset;
        if (firstDescendantIsSimpleText || firstDescendantDoesNotOverflow) $unwrapNode(node);
      }
    } else if ($isLeafNode(node)) {
      const previousAccumulatedLength = accumulatedLength;
      accumulatedLength += node.getTextContentSize();
      if (accumulatedLength > offset && !$isOverflowNode(node.getParent())) {
        const previousSelection = $getSelection();
        let overflowNode;
        if (previousAccumulatedLength < offset && $isTextNode2(node) && node.isSimpleText()) {
          const [, overflowedText] = node.splitText(offset - previousAccumulatedLength);
          overflowNode = $wrapNode(overflowedText);
        } else {
          overflowNode = $wrapNode(node);
        }
        if (previousSelection !== null) $setSelection(previousSelection);
        mergePrevious(overflowNode);
      }
    }
  }
}
function $wrapNode(node) {
  const overflowNode = $createOverflowNode();
  node.insertBefore(overflowNode);
  overflowNode.append(node);
  return overflowNode;
}
function $unwrapNode(node) {
  const children = node.getChildren();
  const childrenLength = children.length;
  for (let i = 0; i < childrenLength; i++) node.insertBefore(children[i]);
  node.remove();
  return childrenLength > 0 ? children[childrenLength - 1] : null;
}
function mergePrevious(overflowNode) {
  const previousNode = overflowNode.getPreviousSibling();
  if (!$isOverflowNode(previousNode)) return;
  const firstChild = overflowNode.getFirstChild();
  const previousNodeChildren = previousNode.getChildren();
  const previousNodeChildrenLength = previousNodeChildren.length;
  if (firstChild === null) {
    overflowNode.append(...previousNodeChildren);
  } else {
    for (let i = 0; i < previousNodeChildrenLength; i++) firstChild.insertBefore(previousNodeChildren[i]);
  }
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();
    const focus = selection.focus;
    const focusNode = anchor.getNode();
    if (anchorNode.is(previousNode)) {
      anchor.set(overflowNode.getKey(), anchor.offset, "element");
    } else if (anchorNode.is(overflowNode)) {
      anchor.set(overflowNode.getKey(), previousNodeChildrenLength + anchor.offset, "element");
    }
    if (focusNode.is(previousNode)) {
      focus.set(overflowNode.getKey(), focus.offset, "element");
    } else if (focusNode.is(overflowNode)) {
      focus.set(overflowNode.getKey(), previousNodeChildrenLength + focus.offset, "element");
    }
  }
  previousNode?.remove();
}

// src/composables/useDecorators.ts
import { Teleport, computed, h, ref as ref2, unref as unref2 } from "vue";
function useDecorators(editor) {
  const decorators = ref2(editor.getDecorators());
  useMounted(() => {
    return editor.registerDecoratorListener(nextDecorators => {
      decorators.value = nextDecorators;
    });
  });
  return computed(() => {
    const decoratedTeleports = [];
    const decoratorKeys = Object.keys(unref2(decorators));
    for (let i = 0; i < decoratorKeys.length; i++) {
      const nodeKey = decoratorKeys[i];
      const vueDecorator = decorators.value[nodeKey];
      const element = editor.getElementByKey(nodeKey);
      if (element !== null) {
        decoratedTeleports.push(h(Teleport, {
          to: element
        }, vueDecorator));
      }
    }
    return decoratedTeleports;
  });
}

// src/composables/useEditor.ts
import { inject } from "vue";

// src/composables/inject.ts
var editorKey = Symbol("Lexical editor");

// src/composables/useEditor.ts
function useEditor() {
  const editor = inject(editorKey);
  if (!editor) throw new Error("<LexicalComposer /> is required");
  return editor;
}

// src/composables/useHistory.ts
import { computed as computed2, unref as unref3, watchPostEffect } from "vue";
import _defaultImport10 from "@lexical/history";
const registerHistory = _defaultImport10.registerHistory;
const createEmptyHistoryState = _defaultImport10.createEmptyHistoryState;
function useHistory(editor, externalHistoryState, delay) {
  const historyState = computed2(() => unref3(externalHistoryState) || createEmptyHistoryState());
  watchPostEffect(onInvalidate => {
    const unregisterListener = registerHistory(unref3(editor), historyState.value, unref3(delay) || 1e3);
    onInvalidate(() => {
      unregisterListener();
    });
  });
}

// src/composables/useLexicalIsTextContentEmpty.ts
import { readonly as readonly2, ref as ref3 } from "vue";
import _defaultImport11 from "@lexical/text";
const $isRootTextContentEmptyCurry = _defaultImport11.$isRootTextContentEmptyCurry;
function useLexicalIsTextContentEmpty(editor, trim) {
  const isEmpty = ref3(editor.getEditorState().read($isRootTextContentEmptyCurry(editor.isComposing(), trim)));
  useMounted(() => {
    return editor.registerUpdateListener(({
      editorState
    }) => {
      const isComposing = editor.isComposing();
      isEmpty.value = editorState.read($isRootTextContentEmptyCurry(isComposing, trim));
    });
  });
  return readonly2(isEmpty);
}

// src/composables/useLexicalNodeSelection.ts
import _defaultImport12 from "lexical";
const $setSelection2 = _defaultImport12.$setSelection;
const $isNodeSelection = _defaultImport12.$isNodeSelection;
const $getSelection2 = _defaultImport12.$getSelection;
const $getNodeByKey = _defaultImport12.$getNodeByKey;
const $createNodeSelection = _defaultImport12.$createNodeSelection;
import { readonly as readonly3, ref as ref4, unref as unref4, watchPostEffect as watchPostEffect2 } from "vue";
function isNodeSelected(editor, key) {
  return editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (node === null) return false;
    return node.isSelected();
  });
}
function useLexicalNodeSelection(key) {
  const editor = useEditor();
  const isSelected = ref4(isNodeSelected(editor, unref4(key)));
  watchPostEffect2(onInvalidate => {
    const unregisterListener = editor.registerUpdateListener(() => {
      isSelected.value = isNodeSelected(editor, unref4(key));
    });
    onInvalidate(() => {
      unregisterListener();
    });
  });
  const setSelected = selected => {
    editor.update(() => {
      let selection = $getSelection2();
      const realKeyVal = unref4(key);
      if (!$isNodeSelection(selection)) {
        selection = $createNodeSelection();
        $setSelection2(selection);
      }
      if (selected) {
        selection.add(realKeyVal);
      } else {
        selection.delete(realKeyVal);
      }
    });
  };
  const clearSelection = () => {
    editor.update(() => {
      const selection = $getSelection2();
      if ($isNodeSelection(selection)) selection.clear();
    });
  };
  return {
    isSelected: readonly3(isSelected),
    setSelected,
    clearSelection
  };
}

// src/composables/useLexicalTextEntity.ts
import _defaultImport13 from "@lexical/text";
const registerLexicalTextEntity = _defaultImport13.registerLexicalTextEntity;
import _defaultImport14 from "@lexical/utils";
const mergeRegister4 = _defaultImport14.mergeRegister;
function useLexicalTextEntity(getMatch, targetNode, createNode) {
  const editor = useEditor();
  useMounted(() => {
    return mergeRegister4(...registerLexicalTextEntity(editor, getMatch, targetNode, createNode));
  });
}

// src/composables/useList.ts
import _defaultImport15 from "@lexical/list";
const removeList = _defaultImport15.removeList;
const insertList = _defaultImport15.insertList;
const REMOVE_LIST_COMMAND = _defaultImport15.REMOVE_LIST_COMMAND;
const INSERT_UNORDERED_LIST_COMMAND = _defaultImport15.INSERT_UNORDERED_LIST_COMMAND;
const INSERT_ORDERED_LIST_COMMAND = _defaultImport15.INSERT_ORDERED_LIST_COMMAND;
const $handleListInsertParagraph = _defaultImport15.$handleListInsertParagraph;
import _defaultImport16 from "@lexical/utils";
const mergeRegister5 = _defaultImport16.mergeRegister;
import _defaultImport17 from "lexical";
const INSERT_PARAGRAPH_COMMAND = _defaultImport17.INSERT_PARAGRAPH_COMMAND;
const COMMAND_PRIORITY_LOW = _defaultImport17.COMMAND_PRIORITY_LOW;
function useList(editor) {
  useMounted(() => {
    return mergeRegister5(editor.registerCommand(INSERT_ORDERED_LIST_COMMAND, () => {
      insertList(editor, "number");
      return true;
    }, COMMAND_PRIORITY_LOW), editor.registerCommand(INSERT_UNORDERED_LIST_COMMAND, () => {
      insertList(editor, "bullet");
      return true;
    }, COMMAND_PRIORITY_LOW), editor.registerCommand(REMOVE_LIST_COMMAND, () => {
      removeList(editor);
      return true;
    }, COMMAND_PRIORITY_LOW), editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => {
      const hasHandledInsertParagraph = $handleListInsertParagraph();
      if (hasHandledInsertParagraph) return true;
      return false;
    }, COMMAND_PRIORITY_LOW));
  });
}

// src/composables/usePlainTextSetup.ts
import _defaultImport18 from "@lexical/dragon";
const registerDragonSupport = _defaultImport18.registerDragonSupport;
import _defaultImport19 from "@lexical/plain-text";
const registerPlainText = _defaultImport19.registerPlainText;
import _defaultImport20 from "@lexical/utils";
const mergeRegister6 = _defaultImport20.mergeRegister;
function usePlainTextSetup(editor) {
  useMounted(() => {
    return mergeRegister6(registerPlainText(editor), registerDragonSupport(editor));
  });
}

// src/composables/useRichTextSetup.ts
import _defaultImport21 from "@lexical/dragon";
const registerDragonSupport2 = _defaultImport21.registerDragonSupport;
import _defaultImport22 from "@lexical/rich-text";
const registerRichText = _defaultImport22.registerRichText;
import _defaultImport23 from "@lexical/utils";
const mergeRegister7 = _defaultImport23.mergeRegister;
function useRichTextSetup(editor) {
  useMounted(() => {
    return mergeRegister7(registerRichText(editor), registerDragonSupport2(editor));
  });
}

// src/composables/typeaheadMenu.ts
import { ref as ref5, unref as unref5 } from "vue";
var PUNCTUATION = `\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'"~=<>_:;`;
var TypeaheadOption = class {
  key;
  elRef;
  constructor(key) {
    this.key = key;
    if (this.elRef) this.elRef.value = null;
    this.setRefElement = this.setRefElement.bind(this);
  }
  setRefElement(element) {
    if (this.elRef) this.elRef.value = element;
  }
};
function useBasicTypeaheadTriggerMatch(trigger, {
  minLength = 1,
  maxLength = 75
}) {
  return text => {
    const validChars = `[^${trigger}${PUNCTUATION}\\s]`;
    const TypeaheadTriggerRegex = new RegExp(`(^|\\s|\\()([${trigger}]((?:${validChars}){0,${maxLength}}))$`);
    const match = TypeaheadTriggerRegex.exec(text);
    if (match !== null) {
      const maybeLeadingWhitespace = match[1];
      const matchingString = match[3];
      if (matchingString.length >= minLength) {
        return {
          leadOffset: match.index + maybeLeadingWhitespace.length,
          matchingString,
          replaceableString: match[2]
        };
      }
    }
    return null;
  };
}
function useMenuAnchorRef(resolution, setResolution, className) {
  const editor = useEditor();
  const anchorElementRef = ref5(document.createElement("div"));
  const positionMenu = () => {
    const rootElement = editor.getRootElement();
    const containerDiv = anchorElementRef.value;
    if (rootElement !== null && unref5(resolution) !== null) {
      const {
        left,
        top,
        width,
        height
      } = unref5(resolution).getRect();
      containerDiv.style.top = `${top + window.pageYOffset}px`;
      containerDiv.style.left = `${left + window.pageXOffset}px`;
      containerDiv.style.height = `${height}px`;
      containerDiv.style.width = `${width}px`;
      if (!containerDiv.isConnected) {
        if (className) containerDiv.className = className;
        containerDiv.setAttribute("aria-label", "Typeahead menu");
        containerDiv.setAttribute("id", "typeahead-menu");
        containerDiv.setAttribute("role", "listbox");
        containerDiv.style.display = "block";
        containerDiv.style.position = "absolute";
        document.body.append(containerDiv);
      }
      anchorElementRef.value = containerDiv;
      rootElement.setAttribute("aria-controls", "typeahead-menu");
    }
  };
  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (unref5(resolution) !== null) {
      positionMenu();
      return () => {
        if (rootElement !== null) rootElement.removeAttribute("aria-controls");
        const containerDiv = anchorElementRef.value;
        if (containerDiv !== null && containerDiv.isConnected) containerDiv.remove();
      };
    }
  });
  const onVisibilityChange = isInView => {
    if (unref5(resolution) !== null) {
      if (!isInView) setResolution(null);
    }
  };
  useDynamicPositioning(resolution, anchorElementRef, positionMenu, onVisibilityChange);
  return anchorElementRef;
}
function getScrollParent(element, includeHidden) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
  if (style.position === "fixed") return document.body;
  for (let parent = element;
  // eslint-disable-next-line no-cond-assign
  parent = parent.parentElement;) {
    style = getComputedStyle(parent);
    if (excludeStaticParent && style.position === "static") continue;
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX)) return parent;
  }
  return document.body;
}
function isTriggerVisibleInNearestScrollContainer(targetElement, containerElement) {
  const tRect = targetElement.getBoundingClientRect();
  const cRect = containerElement.getBoundingClientRect();
  return tRect.top > cRect.top && tRect.top < cRect.bottom;
}
function useDynamicPositioning(resolution, targetElement, onReposition, onVisibilityChange) {
  const editor = useEditor();
  useEffect(() => {
    if (unref5(targetElement) !== null && unref5(resolution) !== null) {
      const rootElement = editor.getRootElement();
      const rootScrollParent = rootElement !== null ? getScrollParent(rootElement, false) : document.body;
      let ticking = false;
      let previousIsInView = isTriggerVisibleInNearestScrollContainer(unref5(targetElement), rootScrollParent);
      const handleScroll = function () {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            onReposition();
            ticking = false;
          });
          ticking = true;
        }
        const isInView = isTriggerVisibleInNearestScrollContainer(unref5(targetElement), rootScrollParent);
        if (isInView !== previousIsInView) {
          previousIsInView = isInView;
          if (onVisibilityChange != null) onVisibilityChange(isInView);
        }
      };
      const resizeObserver = new ResizeObserver(onReposition);
      window.addEventListener("resize", onReposition);
      document.addEventListener("scroll", handleScroll, {
        capture: true,
        passive: true
      });
      resizeObserver.observe(unref5(targetElement));
      return () => {
        resizeObserver.unobserve(unref5(targetElement));
        window.removeEventListener("resize", onReposition);
        document.removeEventListener("scroll", handleScroll);
      };
    }
  });
}

// src/composables/useLexicalTypeaheadMenuPlugin.ts
import { defineComponent, h as h2 } from "vue";

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTypeaheadMenuPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent2 } from "vue";
import { unref as _unref, normalizeProps as _normalizeProps, guardReactiveProps as _guardReactiveProps, renderSlot as _renderSlot2, withCtx as _withCtx, openBlock as _openBlock, createBlock as _createBlock, createCommentVNode as _createCommentVNode } from "vue";
import _defaultImport24 from "lexical";
const $isTextNode3 = _defaultImport24.$isTextNode;
const $isRangeSelection3 = _defaultImport24.$isRangeSelection;
const $getSelection4 = _defaultImport24.$getSelection;
import { ref as ref7 } from "vue";

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalPopoverMenu.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent } from "vue";
import { renderSlot as _renderSlot } from "vue";
import _defaultImport25 from "@lexical/utils";
const mergeRegister8 = _defaultImport25.mergeRegister;
import _defaultImport26 from "lexical";
const createCommand = _defaultImport26.createCommand;
const KEY_TAB_COMMAND = _defaultImport26.KEY_TAB_COMMAND;
const KEY_ESCAPE_COMMAND = _defaultImport26.KEY_ESCAPE_COMMAND;
const KEY_ENTER_COMMAND = _defaultImport26.KEY_ENTER_COMMAND;
const KEY_ARROW_UP_COMMAND = _defaultImport26.KEY_ARROW_UP_COMMAND;
const KEY_ARROW_DOWN_COMMAND = _defaultImport26.KEY_ARROW_DOWN_COMMAND;
const COMMAND_PRIORITY_LOW2 = _defaultImport26.COMMAND_PRIORITY_LOW;
const $isRangeSelection2 = _defaultImport26.$isRangeSelection;
const $getSelection3 = _defaultImport26.$getSelection;
import { computed as computed3, ref as ref6, watch, watchPostEffect as watchPostEffect3 } from "vue";
var LexicalPopoverMenu_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent({
  __name: "LexicalPopoverMenu",
  props: {
    anchorElementRef: {
      type: null,
      required: true
    },
    resolution: {
      type: Object,
      required: true
    },
    options: {
      type: Array,
      required: true
    }
  },
  emits: ["close", "selectOption"],
  setup(__props, {
    emit
  }) {
    const props = __props;
    const SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND = createCommand("SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND");
    const editor = useEditor();
    const selectedIndex = ref6(null);
    watch(() => props.resolution.match.matchingString, () => {
      selectedIndex.value = 0;
    });
    function splitNodeContainingQuery(editor2, match) {
      const selection = $getSelection3();
      if (!$isRangeSelection2(selection) || !selection.isCollapsed()) return null;
      const anchor = selection.anchor;
      if (anchor.type !== "text") return null;
      const anchorNode = anchor.getNode();
      if (!anchorNode.isSimpleText()) return null;
      const selectionOffset = anchor.offset;
      const textContent = anchorNode.getTextContent().slice(0, selectionOffset);
      const characterOffset = match.replaceableString.length;
      const queryOffset = getFullMatchOffset(textContent, match.matchingString, characterOffset);
      const startOffset = selectionOffset - queryOffset;
      if (startOffset < 0) return null;
      let newNode;
      if (startOffset === 0) [newNode] = anchorNode.splitText(selectionOffset);else [, newNode] = anchorNode.splitText(startOffset, selectionOffset);
      return newNode;
    }
    function getFullMatchOffset(documentText, entryText, offset) {
      let triggerOffset = offset;
      for (let i = triggerOffset; i <= entryText.length; i++) {
        if (documentText.substr(-i) === entryText.substr(0, i)) triggerOffset = i;
      }
      return triggerOffset;
    }
    function selectOptionAndCleanUp(selectedEntry) {
      editor.update(() => {
        const textNodeContainingQuery = splitNodeContainingQuery(editor, props.resolution.match);
        emit("selectOption", {
          close() {
            emit("close");
          },
          option: selectedEntry,
          textNodeContainingQuery,
          matchingString: props.resolution.match.matchingString
        });
      });
    }
    function updateSelectedIndex(index) {
      const rootElem = editor.getRootElement();
      if (rootElem !== null) {
        rootElem.setAttribute("aria-activedescendant", `typeahead-item-${index}`);
        selectedIndex.value = index;
      }
    }
    watchPostEffect3(() => {
      if (props.options === null) selectedIndex.value = null;else if (selectedIndex.value === null) updateSelectedIndex(0);
    });
    function scrollIntoViewIfNeeded(target) {
      const container = document.getElementById("typeahead-menu");
      if (container) {
        const parentNode = target.parentNode;
        if (parentNode && /auto|scroll/.test(getComputedStyle(parentNode).overflow)) {
          const parentRect = parentNode.getBoundingClientRect();
          if (parentRect.top + parentRect.height > window.innerHeight) parentNode.scrollIntoView(false);
          parentNode.scrollTop = target.offsetTop - target.clientHeight;
        } else {
          target.scrollIntoView(false);
        }
      }
    }
    useMounted(() => {
      return mergeRegister8(editor.registerCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, ({
        option
      }) => {
        if (option.elRef?.value) {
          scrollIntoViewIfNeeded(option.elRef.value);
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW2));
    });
    useEffect(() => {
      return mergeRegister8(editor.registerCommand(KEY_ARROW_DOWN_COMMAND, payload => {
        const event = payload;
        if (props.options !== null && props.options.length && selectedIndex.value !== null) {
          const newSelectedIndex = selectedIndex.value !== props.options.length - 1 ? selectedIndex.value + 1 : 0;
          updateSelectedIndex(newSelectedIndex);
          const option = props.options[newSelectedIndex];
          if (option.elRef?.value !== null && option.elRef?.value) {
            editor.dispatchCommand(SCROLL_TYPEAHEAD_OPTION_INTO_VIEW_COMMAND, {
              index: newSelectedIndex,
              option
            });
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return true;
      }, COMMAND_PRIORITY_LOW2), editor.registerCommand(KEY_ARROW_UP_COMMAND, payload => {
        const event = payload;
        if (props.options !== null && props.options.length && selectedIndex.value !== null) {
          const newSelectedIndex = selectedIndex.value !== 0 ? selectedIndex.value - 1 : props.options.length - 1;
          updateSelectedIndex(newSelectedIndex);
          const option = props.options[newSelectedIndex];
          if (option.elRef?.value !== null && option.elRef?.value) scrollIntoViewIfNeeded(option.elRef.value);
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        return true;
      }, COMMAND_PRIORITY_LOW2), editor.registerCommand(KEY_ESCAPE_COMMAND, payload => {
        const event = payload;
        event.preventDefault();
        event.stopImmediatePropagation();
        emit("close");
        return true;
      }, COMMAND_PRIORITY_LOW2), editor.registerCommand(KEY_TAB_COMMAND, payload => {
        const event = payload;
        if (props.options === null || selectedIndex.value === null || props.options[selectedIndex.value] == null) return false;
        event.preventDefault();
        event.stopImmediatePropagation();
        selectOptionAndCleanUp(props.options[selectedIndex.value]);
        return true;
      }, COMMAND_PRIORITY_LOW2), editor.registerCommand(KEY_ENTER_COMMAND, event => {
        if (props.options === null || selectedIndex.value === null || props.options[selectedIndex.value] == null) return false;
        if (event !== null) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        selectOptionAndCleanUp(props.options[selectedIndex.value]);
        return true;
      }, COMMAND_PRIORITY_LOW2));
    });
    const listItemProps = computed3(() => ({
      options: props.options,
      selectOptionAndCleanUp,
      selectedIndex: selectedIndex.value,
      setHighlightedIndex: updateSelectedIndex
    }));
    return (_ctx, _cache) => {
      return _renderSlot(_ctx.$slots, "default", {
        listItemProps: listItemProps.value,
        anchorElementRef: _ctx.anchorElementRef,
        matchString: _ctx.resolution.match.matchingString
      });
    };
  }
});

// unplugin-vue: /plugin-vue/export-helper
var export_helper_default = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

// src/components/LexicalPopoverMenu.vue
var LexicalPopoverMenu_default = /* @__PURE__ */export_helper_default(LexicalPopoverMenu_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalPopoverMenu.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTypeaheadMenuPlugin.vue?vue&type=script&setup=true&lang.ts
var LexicalTypeaheadMenuPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent2({
  __name: "LexicalTypeaheadMenuPlugin",
  props: {
    anchorClassName: {
      type: String,
      required: false
    },
    triggerFn: {
      type: Function,
      required: true
    },
    options: {
      type: Array,
      required: true
    }
  },
  emits: ["close", "open", "queryChange", "selectOption"],
  setup(__props, {
    emit
  }) {
    const props = __props;
    const editor = useEditor();
    const resolution = ref7(null);
    function setResolution(value) {
      resolution.value = value;
    }
    const anchorElementRef = useMenuAnchorRef(resolution, setResolution, props.anchorClassName);
    function closeTypeahead() {
      setResolution(null);
      if (resolution.value !== null) emit("close");
    }
    function openTypeahead(res) {
      setResolution(res);
      if (resolution.value === null) emit("open", res);
    }
    function isSelectionOnEntityBoundary(offset) {
      if (offset !== 0) return false;
      return editor.getEditorState().read(() => {
        const selection = $getSelection4();
        if ($isRangeSelection3(selection)) {
          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();
          const prevSibling = anchorNode.getPreviousSibling();
          return $isTextNode3(prevSibling) && prevSibling.isTextEntity();
        }
        return false;
      });
    }
    function getTextUpToAnchor(selection) {
      const anchor = selection.anchor;
      if (anchor.type !== "text") return null;
      const anchorNode = anchor.getNode();
      if (!anchorNode.isSimpleText()) return null;
      const anchorOffset = anchor.offset;
      return anchorNode.getTextContent().slice(0, anchorOffset);
    }
    function tryToPositionRange(leadOffset, range) {
      const domSelection = window.getSelection();
      if (domSelection === null || !domSelection.isCollapsed) return false;
      const anchorNode = domSelection.anchorNode;
      const startOffset = leadOffset;
      const endOffset = domSelection.anchorOffset;
      if (anchorNode == null || endOffset == null) return false;
      try {
        range.setStart(anchorNode, startOffset);
        range.setEnd(anchorNode, endOffset);
      } catch (error) {
        return false;
      }
      return true;
    }
    function getQueryTextForSearch(editor2) {
      let text = null;
      editor2.getEditorState().read(() => {
        const selection = $getSelection4();
        if (!$isRangeSelection3(selection)) return;
        text = getTextUpToAnchor(selection);
      });
      return text;
    }
    useEffect(() => {
      const updateListener = () => {
        editor.getEditorState().read(() => {
          const range = document.createRange();
          const selection = $getSelection4();
          const text = getQueryTextForSearch(editor);
          if (!$isRangeSelection3(selection) || !selection.isCollapsed() || text === null || range === null) {
            closeTypeahead();
            return;
          }
          const match = props.triggerFn(text, editor);
          emit("queryChange", match ? match.matchingString : null);
          if (match !== null && !isSelectionOnEntityBoundary(match.leadOffset)) {
            const isRangePositioned = tryToPositionRange(match.leadOffset, range);
            if (isRangePositioned !== null) {
              openTypeahead({
                getRect: () => range.getBoundingClientRect(),
                match
              });
              return;
            }
          }
          closeTypeahead();
        });
      };
      return editor.registerUpdateListener(updateListener);
    });
    return (_ctx, _cache) => {
      return resolution.value ? (_openBlock(), _createBlock(LexicalPopoverMenu_default, {
        key: 0,
        "anchor-element-ref": _unref(anchorElementRef),
        resolution: resolution.value,
        options: _ctx.options,
        onClose: closeTypeahead,
        onSelectOption: _cache[0] || (_cache[0] = $event => _ctx.$emit("selectOption", $event))
      }, {
        default: _withCtx(slotProps => [_renderSlot2(_ctx.$slots, "default", _normalizeProps(_guardReactiveProps(slotProps)))]),
        _: 3
        /* FORWARDED */
      }, 8, ["anchor-element-ref", "resolution", "options"])) : _createCommentVNode("v-if", true);
    };
  }
});

// src/components/LexicalTypeaheadMenuPlugin.vue
var LexicalTypeaheadMenuPlugin_default = /* @__PURE__ */export_helper_default(LexicalTypeaheadMenuPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTypeaheadMenuPlugin.vue"]]);

// src/composables/useLexicalTypeaheadMenuPlugin.ts
function useLexicalTypeaheadMenuPlugin() {
  const wrapper = defineComponent((props, {
    slots
  }) => {
    return () => h2(LexicalTypeaheadMenuPlugin_default, props, slots);
  });
  return wrapper;
}

// src/composables/useYjsCollaboration.ts
import _defaultImport27 from "@lexical/utils";
const mergeRegister9 = _defaultImport27.mergeRegister;
import _defaultImport28 from "@lexical/yjs";
const syncYjsChangesToLexical = _defaultImport28.syncYjsChangesToLexical;
const syncLexicalUpdateToYjs = _defaultImport28.syncLexicalUpdateToYjs;
const syncCursorPositions = _defaultImport28.syncCursorPositions;
const setLocalStateFocus = _defaultImport28.setLocalStateFocus;
const initLocalState = _defaultImport28.initLocalState;
const createUndoManager = _defaultImport28.createUndoManager;
const createBinding = _defaultImport28.createBinding;
const TOGGLE_CONNECT_COMMAND = _defaultImport28.TOGGLE_CONNECT_COMMAND;
const CONNECTED_COMMAND = _defaultImport28.CONNECTED_COMMAND;
import _defaultImport29 from "lexical";
const UNDO_COMMAND = _defaultImport29.UNDO_COMMAND;
const REDO_COMMAND = _defaultImport29.REDO_COMMAND;
const FOCUS_COMMAND = _defaultImport29.FOCUS_COMMAND;
const COMMAND_PRIORITY_EDITOR = _defaultImport29.COMMAND_PRIORITY_EDITOR;
const BLUR_COMMAND = _defaultImport29.BLUR_COMMAND;
const $getSelection5 = _defaultImport29.$getSelection;
const $getRoot = _defaultImport29.$getRoot;
const $createParagraphNode = _defaultImport29.$createParagraphNode;
import { UndoManager } from "yjs";
import { computed as computed4, ref as ref8, toRaw } from "vue";
function useYjsCollaboration(editor, id, provider, docMap, name, color, shouldBootstrap, initialEditorState, excludedProperties, awarenessData) {
  const isReloadingDoc = ref8(false);
  const doc = ref8(docMap.get(id));
  const binding = computed4(() => createBinding(editor, provider, id, toRaw(doc.value), docMap, excludedProperties));
  const connect = () => {
    provider.connect();
  };
  const disconnect = () => {
    try {
      provider.disconnect();
    } catch (e) {}
  };
  useEffect(() => {
    const {
      root
    } = binding.value;
    const {
      awareness
    } = provider;
    const onStatus = ({
      status
    }) => {
      editor.dispatchCommand(CONNECTED_COMMAND, status === "connected");
    };
    const onSync = isSynced => {
      if (shouldBootstrap && isSynced && root.isEmpty() && root._xmlText._length === 0 && isReloadingDoc.value === false) initializeEditor(editor, initialEditorState);
      isReloadingDoc.value = false;
    };
    const onAwarenessUpdate = () => {
      syncCursorPositions(binding.value, provider);
    };
    const onYjsTreeChanges = (events, transaction) => {
      const origin = transaction.origin;
      if (toRaw(origin) !== binding.value) {
        const isFromUndoManger = origin instanceof UndoManager;
        syncYjsChangesToLexical(binding.value, provider, events, isFromUndoManger);
      }
    };
    initLocalState(provider, name, color, document.activeElement === editor.getRootElement(), awarenessData || {});
    const onProviderDocReload = ydoc => {
      clearEditorSkipCollab(editor, binding.value);
      doc.value = ydoc;
      docMap.set(id, ydoc);
      isReloadingDoc.value = true;
    };
    provider.on("reload", onProviderDocReload);
    provider.on("status", onStatus);
    provider.on("sync", onSync);
    awareness.on("update", onAwarenessUpdate);
    root.getSharedType().observeDeep(onYjsTreeChanges);
    const removeListener = editor.registerUpdateListener(({
      prevEditorState,
      editorState,
      dirtyLeaves,
      dirtyElements,
      normalizedNodes,
      tags
    }) => {
      if (tags.has("skip-collab") === false) {
        syncLexicalUpdateToYjs(binding.value, provider, prevEditorState, editorState, dirtyElements, dirtyLeaves, normalizedNodes, tags);
      }
    });
    connect();
    return () => {
      if (isReloadingDoc.value === false) disconnect();
      provider.off("sync", onSync);
      provider.off("status", onStatus);
      provider.off("reload", onProviderDocReload);
      awareness.off("update", onAwarenessUpdate);
      root.getSharedType().unobserveDeep(onYjsTreeChanges);
      docMap.delete(id);
      removeListener();
    };
  });
  useEffect(() => {
    return editor.registerCommand(TOGGLE_CONNECT_COMMAND, payload => {
      if (connect !== void 0 && disconnect !== void 0) {
        const shouldConnect = payload;
        if (shouldConnect) {
          console.log("Collaboration connected!");
          connect();
        } else {
          console.log("Collaboration disconnected!");
          disconnect();
        }
      }
      return true;
    }, COMMAND_PRIORITY_EDITOR);
  });
  return binding;
}
function useYjsFocusTracking(editor, provider, name, color, awarenessData) {
  useEffect(() => {
    return mergeRegister9(editor.registerCommand(FOCUS_COMMAND, () => {
      setLocalStateFocus(provider, name, color, true, awarenessData || {});
      return false;
    }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(BLUR_COMMAND, () => {
      setLocalStateFocus(provider, name, color, false, awarenessData || {});
      return false;
    }, COMMAND_PRIORITY_EDITOR));
  });
}
function useYjsHistory(editor, binding) {
  const undoManager = computed4(() => createUndoManager(binding, binding.root.getSharedType()));
  useEffect(() => {
    const undo = () => {
      undoManager.value.undo();
    };
    const redo = () => {
      undoManager.value.redo();
    };
    return mergeRegister9(editor.registerCommand(UNDO_COMMAND, () => {
      undo();
      return true;
    }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(REDO_COMMAND, () => {
      redo();
      return true;
    }, COMMAND_PRIORITY_EDITOR));
  });
  const clearHistory = () => {
    undoManager.value.clear();
  };
  return clearHistory;
}
function initializeEditor(editor, initialEditorState) {
  editor.update(() => {
    const root = $getRoot();
    if (root.isEmpty()) {
      if (initialEditorState) {
        switch (typeof initialEditorState) {
          case "string":
            {
              const parsedEditorState = editor.parseEditorState(initialEditorState);
              editor.setEditorState(parsedEditorState, {
                tag: "history-merge"
              });
              break;
            }
          case "object":
            {
              editor.setEditorState(initialEditorState, {
                tag: "history-merge"
              });
              break;
            }
          case "function":
            {
              editor.update(() => {
                const root1 = $getRoot();
                if (root1.isEmpty()) initialEditorState(editor);
              }, {
                tag: "history-merge"
              });
              break;
            }
        }
      } else {
        const paragraph = $createParagraphNode();
        root.append(paragraph);
        const {
          activeElement
        } = document;
        if ($getSelection5() !== null || activeElement !== null && activeElement === editor.getRootElement()) paragraph.select();
      }
    }
  }, {
    tag: "history-merge"
  });
}
function clearEditorSkipCollab(editor, binding) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();
    root.select();
  }, {
    tag: "skip-collab"
  });
  if (binding.cursors == null) return;
  const cursors = binding.cursors;
  if (cursors == null) return;
  const cursorsContainer = binding.cursorsContainer;
  if (cursorsContainer == null) return;
  const cursorsArr = Array.from(cursors.values());
  for (let i = 0; i < cursorsArr.length; i++) {
    const cursor = cursorsArr[i];
    const selection = cursor.selection;
    if (selection && selection.selections !== null) {
      const selections = selection.selections;
      for (let j = 0; j < selections.length; j++) cursorsContainer.removeChild(selections[i]);
    }
  }
}

// src/components/LexicalDecoratedTeleports.ts
import { defineComponent as defineComponent2 } from "vue";
var LexicalDecoratedTeleports_default = defineComponent2({
  name: "LexicalDecoratedTeleports",
  setup() {
    const editor = useEditor();
    const decorators = useDecorators(editor);
    return () => decorators.value;
  }
});

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalContentEditable.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent3 } from "vue";
import { openBlock as _openBlock2, createElementBlock as _createElementBlock } from "vue";
import { ref as ref9 } from "vue";
var _hoisted_1 = ["id", "aria-activedescendant", "aria-autocomplete", "aria-controls", "aria-describedby", "aria-expanded", "aria-label", "aria-labelledby", "aria-multiline", "aria-owns", "aria-required", "autocapitalize", "autocomplete", "autocorrect", "contenteditable", "role", "spellcheck", "tabindex"];
var LexicalContentEditable_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent3({
  __name: "LexicalContentEditable",
  props: {
    ariaActivedescendant: {
      type: String,
      required: false
    },
    ariaAutocomplete: {
      type: String,
      required: false
    },
    ariaControls: {
      type: String,
      required: false
    },
    ariaDescribedby: {
      type: String,
      required: false
    },
    ariaExpanded: {
      type: Boolean,
      required: false
    },
    ariaLabel: {
      type: String,
      required: false
    },
    ariaLabelledby: {
      type: String,
      required: false
    },
    ariaMultiline: {
      type: Boolean,
      required: false
    },
    ariaOwns: {
      type: String,
      required: false
    },
    ariaRequired: {
      type: Boolean,
      required: false
    },
    autoCapitalize: {
      type: Boolean,
      required: false
    },
    autoComplete: {
      type: Boolean,
      required: false
    },
    autoCorrect: {
      type: Boolean,
      required: false
    },
    id: {
      type: String,
      required: false
    },
    editable: {
      type: Boolean,
      required: false
    },
    role: {
      type: String,
      required: false,
      default: "textbox"
    },
    spellcheck: {
      type: Boolean,
      required: false,
      default: true
    },
    tabindex: {
      type: Number,
      required: false
    },
    enableGrammarly: {
      type: Boolean,
      required: false
    }
  },
  setup(__props) {
    const root = ref9(null);
    const editor = useEditor();
    const editable = ref9(false);
    useMounted(() => {
      if (root.value) {
        editor.setRootElement(root.value);
        editable.value = editor.isEditable();
      }
      return editor.registerEditableListener(currentIsEditable => {
        editable.value = currentIsEditable;
      });
    });
    return (_ctx, _cache) => {
      return _openBlock2(), _createElementBlock("div", {
        id: _ctx.id,
        ref_key: "root",
        ref: root,
        "aria-activedescendant": !editable.value ? void 0 : _ctx.ariaActivedescendant,
        "aria-autocomplete": !editable.value ? void 0 : _ctx.ariaAutocomplete,
        "aria-controls": !editable.value ? void 0 : _ctx.ariaControls,
        "aria-describedby": _ctx.ariaDescribedby,
        "aria-expanded": !editable.value ? void 0 : _ctx.role === "combobox" ? !!_ctx.ariaExpanded ? _ctx.ariaExpanded : void 0 : void 0,
        "aria-label": _ctx.ariaLabel,
        "aria-labelledby": _ctx.ariaLabelledby,
        "aria-multiline": _ctx.ariaMultiline,
        "aria-owns": !editable.value ? void 0 : _ctx.ariaOwns,
        "aria-required": _ctx.ariaRequired,
        autocapitalize: `${_ctx.autoCapitalize}`,
        autocomplete: _ctx.autoComplete,
        autocorrect: `${_ctx.autoCorrect}`,
        contenteditable: editable.value,
        role: !editable.value ? void 0 : _ctx.role,
        spellcheck: _ctx.spellcheck,
        tabindex: _ctx.tabindex
      }, null, 8, _hoisted_1);
    };
  }
});

// src/components/LexicalContentEditable.vue
var LexicalContentEditable_default = /* @__PURE__ */export_helper_default(LexicalContentEditable_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalContentEditable.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalPlainTextPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent4 } from "vue";
import { unref as _unref2, renderSlot as _renderSlot3, createCommentVNode as _createCommentVNode2, createVNode as _createVNode, Fragment as _Fragment, openBlock as _openBlock3, createElementBlock as _createElementBlock2 } from "vue";
var LexicalPlainTextPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent4({
  __name: "LexicalPlainTextPlugin",
  setup(__props) {
    const editor = useEditor();
    const showPlaceholder = useCanShowPlaceholder(editor);
    usePlainTextSetup(editor);
    return (_ctx, _cache) => {
      return _openBlock3(), _createElementBlock2(_Fragment, null, [_unref2(showPlaceholder) ? _renderSlot3(_ctx.$slots, "placeholder", {
        key: 0
      }) : _createCommentVNode2("v-if", true), _renderSlot3(_ctx.$slots, "contentEditable"), _createVNode(_unref2(LexicalDecoratedTeleports_default))], 64
      /* STABLE_FRAGMENT */);
    };
  }
});

// src/components/LexicalPlainTextPlugin.vue
var LexicalPlainTextPlugin_default = /* @__PURE__ */export_helper_default(LexicalPlainTextPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalPlainTextPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalComposer.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent5 } from "vue";
import { renderSlot as _renderSlot4 } from "vue";
import { onMounted as onMounted2, provide } from "vue";
import _defaultImport30 from "lexical";
const createEditor = _defaultImport30.createEditor;
const $getSelection6 = _defaultImport30.$getSelection;
const $getRoot2 = _defaultImport30.$getRoot;
const $createParagraphNode2 = _defaultImport30.$createParagraphNode;
var LexicalComposer_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent5({
  __name: "LexicalComposer",
  props: {
    initialConfig: {
      type: Object,
      required: true
    }
  },
  emits: ["error"],
  setup(__props, {
    emit
  }) {
    const props = __props;
    const HISTORY_MERGE_OPTIONS = {
      tag: "history-merge"
    };
    const editor = createEditor({
      editable: false,
      namespace: props.initialConfig.namespace,
      nodes: props.initialConfig.nodes,
      theme: props.initialConfig.theme,
      onError(error) {
        emit("error", error);
      }
    });
    initializeEditor2(editor, props.initialConfig.editorState);
    function initializeEditor2(editor2, initialEditorState) {
      if (initialEditorState === null) return;
      if (initialEditorState === void 0) {
        editor2.update(() => {
          const root = $getRoot2();
          if (root.isEmpty()) {
            const paragraph = $createParagraphNode2();
            root.append(paragraph);
            const activeElement = document.activeElement;
            if ($getSelection6() !== null || activeElement !== null && activeElement === editor2.getRootElement()) paragraph.select();
          }
        }, HISTORY_MERGE_OPTIONS);
      } else if (initialEditorState !== null) {
        switch (typeof initialEditorState) {
          case "string":
            {
              const parsedEditorState = editor2.parseEditorState(initialEditorState);
              editor2.setEditorState(parsedEditorState, HISTORY_MERGE_OPTIONS);
              break;
            }
          case "object":
            {
              editor2.setEditorState(initialEditorState, HISTORY_MERGE_OPTIONS);
              break;
            }
          case "function":
            {
              editor2.update(() => {
                const root = $getRoot2();
                if (root.isEmpty()) initialEditorState(editor2);
              }, HISTORY_MERGE_OPTIONS);
              break;
            }
        }
      }
    }
    provide(editorKey, editor);
    onMounted2(() => {
      const isEditable = props.initialConfig.editable;
      editor.setEditable(isEditable || false);
    });
    return (_ctx, _cache) => {
      return _renderSlot4(_ctx.$slots, "default");
    };
  }
});

// src/components/LexicalComposer.vue
var LexicalComposer_default = /* @__PURE__ */export_helper_default(LexicalComposer_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalComposer.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalOnChangePlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent6 } from "vue";
var LexicalOnChangePlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent6({
  __name: "LexicalOnChangePlugin",
  props: {
    ignoreInitialChange: {
      type: Boolean,
      required: false,
      default: true
    },
    ignoreSelectionChange: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  emits: ["change"],
  setup(__props, {
    emit
  }) {
    const props = __props;
    const editor = useEditor();
    useMounted(() => {
      return editor.registerUpdateListener(({
        editorState,
        dirtyElements,
        dirtyLeaves,
        prevEditorState
      }) => {
        if (props.ignoreSelectionChange && dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        if (props.ignoreInitialChange && prevEditorState.isEmpty()) return;
        emit("change", editorState, editor);
      });
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalOnChangePlugin.vue
var LexicalOnChangePlugin_default = /* @__PURE__ */export_helper_default(LexicalOnChangePlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalOnChangePlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalHistoryPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent7 } from "vue";
var LexicalHistoryPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent7({
  __name: "LexicalHistoryPlugin",
  props: {
    externalHistoryState: {
      type: Object,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    useHistory(editor, props.externalHistoryState);
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalHistoryPlugin.vue
var LexicalHistoryPlugin_default = /* @__PURE__ */export_helper_default(LexicalHistoryPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalHistoryPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTreeViewPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent8 } from "vue";
import { normalizeClass as _normalizeClass, openBlock as _openBlock4, createElementBlock as _createElementBlock3, createCommentVNode as _createCommentVNode3, toDisplayString as _toDisplayString, createElementVNode as _createElementVNode } from "vue";
import _defaultImport31 from "@lexical/mark";
const $isMarkNode = _defaultImport31.$isMarkNode;
import _defaultImport32 from "lexical";
const $isTextNode4 = _defaultImport32.$isTextNode;
const $isRangeSelection4 = _defaultImport32.$isRangeSelection;
const $isNodeSelection2 = _defaultImport32.$isNodeSelection;
const $isElementNode2 = _defaultImport32.$isElementNode;
const $getSelection7 = _defaultImport32.$getSelection;
const $getRoot3 = _defaultImport32.$getRoot;
import { computed as computed5, onUnmounted as onUnmounted2, ref as ref10, watchEffect as watchEffect2 } from "vue";
import _defaultImport33 from "@lexical/link";
const $isLinkNode2 = _defaultImport33.$isLinkNode;
import _defaultImport34 from "@lexical/table";
const $isGridSelection = _defaultImport34.$isGridSelection;
var _hoisted_12 = ["max"];
var LexicalTreeViewPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent8({
  __name: "LexicalTreeViewPlugin",
  props: {
    timeTravelButtonClassName: {
      type: String,
      required: true
    },
    timeTravelPanelSliderClassName: {
      type: String,
      required: true
    },
    timeTravelPanelButtonClassName: {
      type: String,
      required: true
    },
    timeTravelPanelClassName: {
      type: String,
      required: true
    },
    viewClassName: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    const NON_SINGLE_WIDTH_CHARS_REPLACEMENT = Object.freeze({
      "	": "\\t",
      "\n": "\\n"
    });
    const NON_SINGLE_WIDTH_CHARS_REGEX = new RegExp(Object.keys(NON_SINGLE_WIDTH_CHARS_REPLACEMENT).join("|"), "g");
    const SYMBOLS = Object.freeze({
      ancestorHasNextSibling: "|",
      ancestorIsLastChild: " ",
      hasNextSibling: "\u251C",
      isLastChild: "\u2514",
      selectedChar: "^",
      selectedLine: ">"
    });
    function printRangeSelection(selection) {
      let res = "";
      const formatText = printFormatProperties(selection);
      res += `: range ${formatText !== "" ? `{ ${formatText} }` : ""}`;
      const anchor = selection.anchor;
      const focus = selection.focus;
      const anchorOffset = anchor.offset;
      const focusOffset = focus.offset;
      res += `
  \u251C anchor { key: ${anchor.key}, offset: ${anchorOffset === null ? "null" : anchorOffset}, type: ${anchor.type} }`;
      res += `
  \u2514 focus { key: ${focus.key}, offset: ${focusOffset === null ? "null" : focusOffset}, type: ${focus.type} }`;
      return res;
    }
    function printNodeSelection(selection) {
      if (!$isNodeSelection2(selection)) return "";
      return `: node
  \u2514 [${Array.from(selection._nodes).join(", ")}]`;
    }
    function printGridSelection(selection) {
      return `: grid
  \u2514 { grid: ${selection.gridKey}, anchorCell: ${selection.anchor.key}, focusCell: ${selection.focus.key} }`;
    }
    function generateContent(editorState) {
      let res = " root\n";
      const selectionString = editorState.read(() => {
        const selection = $getSelection7();
        visitTree($getRoot3(), (node, indent) => {
          const nodeKey = node.getKey();
          const nodeKeyDisplay = `(${nodeKey})`;
          const typeDisplay = node.getType() || "";
          const isSelected = node.isSelected();
          const idsDisplay = $isMarkNode(node) ? ` id: [ ${node.getIDs().join(", ")} ] ` : "";
          res += `${isSelected ? SYMBOLS.selectedLine : " "} ${indent.join(" ")} ${nodeKeyDisplay} ${typeDisplay} ${idsDisplay} ${printNode(node)}
`;
          res += printSelectedCharsLine({
            indent,
            isSelected,
            node,
            nodeKeyDisplay,
            selection,
            typeDisplay
          });
        });
        return selection === null ? ": null" : $isRangeSelection4(selection) ? printRangeSelection(selection) : $isGridSelection(selection) ? printGridSelection(selection) : printNodeSelection(selection);
      });
      return `${res}
 selection${selectionString}`;
    }
    function visitTree(currentNode, visitor, indent = []) {
      const childNodes = currentNode.getChildren();
      const childNodesLength = childNodes.length;
      childNodes.forEach((childNode, i) => {
        visitor(childNode, indent.concat(i === childNodesLength - 1 ? SYMBOLS.isLastChild : SYMBOLS.hasNextSibling));
        if ($isElementNode2(childNode)) {
          visitTree(childNode, visitor, indent.concat(i === childNodesLength - 1 ? SYMBOLS.ancestorIsLastChild : SYMBOLS.ancestorHasNextSibling));
        }
      });
    }
    function normalize(text) {
      return Object.entries(NON_SINGLE_WIDTH_CHARS_REPLACEMENT).reduce((acc, [key, value]) => acc.replace(new RegExp(key, "g"), String(value)), text);
    }
    function printNode(node) {
      if ($isTextNode4(node)) {
        const text = node.getTextContent();
        const title = text.length === 0 ? "(empty)" : `"${normalize(text)}"`;
        const properties = printAllTextNodeProperties(node);
        return [title, properties.length !== 0 ? `{ ${properties} }` : null].filter(Boolean).join(" ").trim();
      } else if ($isLinkNode2(node)) {
        const link = node.getURL();
        const title = link.length === 0 ? "(empty)" : `"${normalize(link)}"`;
        const properties = printAllLinkNodeProperties(node);
        return [title, properties.length !== 0 ? `{ ${properties} }` : null].filter(Boolean).join(" ").trim();
      } else {
        return "";
      }
    }
    const FORMAT_PREDICATES = [node => node.hasFormat("bold") && "Bold", node => node.hasFormat("code") && "Code", node => node.hasFormat("italic") && "Italic", node => node.hasFormat("strikethrough") && "Strikethrough", node => node.hasFormat("subscript") && "Subscript", node => node.hasFormat("superscript") && "Superscript", node => node.hasFormat("underline") && "Underline"];
    const DETAIL_PREDICATES = [node => node.isDirectionless() && "Directionless", node => node.isUnmergeable() && "Unmergeable"];
    const MODE_PREDICATES = [node => node.isToken() && "Token", node => node.isSegmented() && "Segmented"];
    function printAllTextNodeProperties(node) {
      return [printFormatProperties(node), printDetailProperties(node), printModeProperties(node)].filter(Boolean).join(", ");
    }
    function printAllLinkNodeProperties(node) {
      return [printTargetProperties(node), printRelProperties(node)].filter(Boolean).join(", ");
    }
    function printDetailProperties(nodeOrSelection) {
      let str = DETAIL_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(", ").toLocaleLowerCase();
      if (str !== "") str = `detail: ${str}`;
      return str;
    }
    function printModeProperties(nodeOrSelection) {
      let str = MODE_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(", ").toLocaleLowerCase();
      if (str !== "") str = `mode: ${str}`;
      return str;
    }
    function printFormatProperties(nodeOrSelection) {
      let str = FORMAT_PREDICATES.map(predicate => predicate(nodeOrSelection)).filter(Boolean).join(", ").toLocaleLowerCase();
      if (str !== "") str = `format: ${str}`;
      return str;
    }
    function printTargetProperties(node) {
      let str = node.getTarget();
      if (str != null) str = `target: ${str}`;
      return str;
    }
    function printRelProperties(node) {
      let str = node.getRel();
      if (str != null) str = `rel: ${str}`;
      return str;
    }
    function printSelectedCharsLine({
      indent,
      isSelected,
      node,
      nodeKeyDisplay,
      selection,
      typeDisplay
    }) {
      if (!$isTextNode4(node) || !$isRangeSelection4(selection) || !isSelected || $isElementNode2(node)) return "";
      const anchor = selection.anchor;
      const focus = selection.focus;
      if (node.getTextContent() === "" || anchor.getNode() === selection.focus.getNode() && anchor.offset === focus.offset) return "";
      const [start, end] = $getSelectionStartEnd(node, selection);
      if (start === end) return "";
      const selectionLastIndent = indent[indent.length - 1] === SYMBOLS.hasNextSibling ? SYMBOLS.ancestorHasNextSibling : SYMBOLS.ancestorIsLastChild;
      const indentionChars = [...indent.slice(0, indent.length - 1), selectionLastIndent];
      const unselectedChars = Array(start + 1).fill(" ");
      const selectedChars = Array(end - start).fill(SYMBOLS.selectedChar);
      const paddingLength = typeDisplay.length + 3;
      const nodePrintSpaces = Array(nodeKeyDisplay.length + paddingLength).fill(" ");
      return `${[SYMBOLS.selectedLine, indentionChars.join(" "), [...nodePrintSpaces, ...unselectedChars, ...selectedChars].join("")].join(" ")}
`;
    }
    function $getSelectionStartEnd(node, selection) {
      const anchor = selection.anchor;
      const focus = selection.focus;
      const textContent = node.getTextContent();
      const textLength = textContent.length;
      let start = -1;
      let end = -1;
      if (anchor.type === "text" && focus.type === "text") {
        const anchorNode = anchor.getNode();
        const focusNode = focus.getNode();
        if (anchorNode === focusNode && node === anchorNode && anchor.offset !== focus.offset) {
          [start, end] = anchor.offset < focus.offset ? [anchor.offset, focus.offset] : [focus.offset, anchor.offset];
        } else if (node === anchorNode) {
          [start, end] = anchorNode.isBefore(focusNode) ? [anchor.offset, textLength] : [0, anchor.offset];
        } else if (node === focusNode) {
          [start, end] = focusNode.isBefore(anchorNode) ? [focus.offset, textLength] : [0, focus.offset];
        } else {
          [start, end] = [0, textLength];
        }
      }
      const numNonSingleWidthCharBeforeSelection = (textContent.slice(0, start).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
      const numNonSingleWidthCharInSelection = (textContent.slice(start, end).match(NON_SINGLE_WIDTH_CHARS_REGEX) || []).length;
      return [start + numNonSingleWidthCharBeforeSelection, end + numNonSingleWidthCharBeforeSelection + numNonSingleWidthCharInSelection];
    }
    const editor = useEditor();
    const timeStampedEditorStates = ref10([]);
    const content = ref10("");
    const timeTravelEnabled = ref10(false);
    const playingIndexRef = ref10(0);
    const treeElementRef = ref10(null);
    const inputRef = ref10(null);
    const isPlaying = ref10(false);
    let unregisterListener;
    watchEffect2(onInvalidate => {
      content.value = generateContent(editor.getEditorState());
      unregisterListener = editor.registerUpdateListener(({
        editorState
      }) => {
        const compositionKey = editor._compositionKey;
        const treeText = generateContent(editor.getEditorState());
        const compositionText = compositionKey !== null && `Composition key: ${compositionKey}`;
        content.value = [treeText, compositionText].filter(Boolean).join("\n\n");
        if (!timeTravelEnabled.value) {
          timeStampedEditorStates.value = [...timeStampedEditorStates.value, [Date.now(), editorState]];
        }
      });
      onInvalidate(() => {
        unregisterListener();
      });
    });
    const totalEditorStates = computed5(() => timeStampedEditorStates.value.length);
    let timeoutId;
    watchEffect2(onInvalidate => {
      if (isPlaying.value) {
        const play = () => {
          const currentIndex = playingIndexRef.value;
          if (currentIndex === totalEditorStates.value - 1) {
            isPlaying.value = false;
            return;
          }
          const currentTime = timeStampedEditorStates.value[currentIndex][0];
          const nextTime = timeStampedEditorStates.value[currentIndex + 1][0];
          const timeDiff = nextTime - currentTime;
          timeoutId = setTimeout(() => {
            playingIndexRef.value++;
            const index = playingIndexRef.value;
            const input = inputRef.value;
            if (input) input.value = String(index);
            editor.setEditorState(timeStampedEditorStates.value[index][1]);
            play();
          }, timeDiff);
        };
        play();
      }
      onInvalidate(() => {
        clearTimeout(timeoutId);
      });
    });
    let element = null;
    watchEffect2(() => {
      element = treeElementRef.value;
      if (element) {
        element.__lexicalEditor = editor;
      }
    });
    onUnmounted2(() => {
      unregisterListener?.();
      clearTimeout(timeoutId);
      if (element) {
        element.__lexicalEditor = null;
      }
    });
    function enableTimeTravel() {
      const rootElement = editor.getRootElement();
      if (rootElement !== null) {
        rootElement.contentEditable = "false";
        playingIndexRef.value = totalEditorStates.value - 1;
        timeTravelEnabled.value = true;
      }
    }
    function updateEditorState(e) {
      const editorStateIndex = Number(e.target.value);
      const timeStampedEditorState = timeStampedEditorStates.value[editorStateIndex];
      if (timeStampedEditorState) {
        playingIndexRef.value = editorStateIndex;
        editor.setEditorState(timeStampedEditorState[1]);
      }
    }
    function exit() {
      const rootElement = editor.getRootElement();
      if (rootElement) {
        rootElement.contentEditable = "true";
        const index = timeStampedEditorStates.value.length - 1;
        const timeStampedEditorState = timeStampedEditorStates.value[index];
        editor.setEditorState(timeStampedEditorState[1]);
        const input = inputRef.value;
        if (input) input.value = String(index);
        timeTravelEnabled.value = false;
        isPlaying.value = false;
      }
    }
    return (_ctx, _cache) => {
      return _openBlock4(), _createElementBlock3("div", {
        class: _normalizeClass(_ctx.viewClassName)
      }, [!timeTravelEnabled.value && totalEditorStates.value > 2 ? (_openBlock4(), _createElementBlock3("button", {
        key: 0,
        class: _normalizeClass(_ctx.timeTravelButtonClassName),
        onClick: enableTimeTravel
      }, " Time Travel ", 2
      /* CLASS */)) : _createCommentVNode3("v-if", true), _createElementVNode("pre", {
        ref_key: "treeElementRef",
        ref: treeElementRef
      }, _toDisplayString(content.value), 513
      /* TEXT, NEED_PATCH */), timeTravelEnabled.value ? (_openBlock4(), _createElementBlock3("div", {
        key: 1,
        class: _normalizeClass(_ctx.timeTravelPanelClassName)
      }, [_createElementVNode("button", {
        class: _normalizeClass(_ctx.timeTravelPanelButtonClassName),
        onClick: _cache[0] || (_cache[0] = $event => isPlaying.value = !isPlaying.value)
      }, _toDisplayString(isPlaying.value ? "Pause" : "Play"), 3
      /* TEXT, CLASS */), _createElementVNode("input", {
        ref_key: "inputRef",
        ref: inputRef,
        class: _normalizeClass(_ctx.timeTravelPanelSliderClassName),
        type: "range",
        min: "1",
        max: totalEditorStates.value - 1,
        onInput: updateEditorState
      }, null, 42, _hoisted_12), _createElementVNode("button", {
        class: _normalizeClass(_ctx.timeTravelPanelButtonClassName),
        onClick: exit
      }, " Exit ", 2
      /* CLASS */)], 2
      /* CLASS */)) : _createCommentVNode3("v-if", true)], 2
      /* CLASS */);
    };
  }
});

// src/components/LexicalTreeViewPlugin.vue
var LexicalTreeViewPlugin_default = /* @__PURE__ */export_helper_default(LexicalTreeViewPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTreeViewPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoFocusPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent9 } from "vue";
import { nextTick, onMounted as onMounted3 } from "vue";
var LexicalAutoFocusPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent9({
  __name: "LexicalAutoFocusPlugin",
  props: {
    defaultSelection: {
      type: String,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    onMounted3(() => {
      nextTick(() => {
        editor.focus(() => {
          const activeElement = document.activeElement;
          const rootElement = editor.getRootElement();
          if (rootElement !== null && (activeElement === null || !rootElement.contains(activeElement))) {
            rootElement.focus({
              preventScroll: true
            });
          }
        }, {
          defaultSelection: props.defaultSelection
        });
      });
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalAutoFocusPlugin.vue
var LexicalAutoFocusPlugin_default = /* @__PURE__ */export_helper_default(LexicalAutoFocusPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoFocusPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalRichTextPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent10 } from "vue";
import { unref as _unref3, renderSlot as _renderSlot5, createCommentVNode as _createCommentVNode4, createVNode as _createVNode2, Fragment as _Fragment2, openBlock as _openBlock5, createElementBlock as _createElementBlock4 } from "vue";
var LexicalRichTextPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent10({
  __name: "LexicalRichTextPlugin",
  setup(__props) {
    const editor = useEditor();
    const showPlaceholder = useCanShowPlaceholder(editor);
    useRichTextSetup(editor);
    return (_ctx, _cache) => {
      return _openBlock5(), _createElementBlock4(_Fragment2, null, [_unref3(showPlaceholder) ? _renderSlot5(_ctx.$slots, "placeholder", {
        key: 0
      }) : _createCommentVNode4("v-if", true), _renderSlot5(_ctx.$slots, "contentEditable"), _createVNode2(_unref3(LexicalDecoratedTeleports_default))], 64
      /* STABLE_FRAGMENT */);
    };
  }
});

// src/components/LexicalRichTextPlugin.vue
var LexicalRichTextPlugin_default = /* @__PURE__ */export_helper_default(LexicalRichTextPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalRichTextPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalListPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent11 } from "vue";
var LexicalListPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent11({
  __name: "LexicalListPlugin",
  setup(__props) {
    const editor = useEditor();
    useList(editor);
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalListPlugin.vue
var LexicalListPlugin_default = /* @__PURE__ */export_helper_default(LexicalListPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalListPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoLinkPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent12 } from "vue";
var LexicalAutoLinkPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent12({
  __name: "LexicalAutoLinkPlugin",
  props: {
    matchers: {
      type: Array,
      required: true
    }
  },
  emits: ["change"],
  setup(__props, {
    emit
  }) {
    const props = __props;
    const editor = useEditor();
    useAutoLink(editor, props.matchers, (url, prevUrl) => {
      emit("change", {
        url,
        prevUrl
      });
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalAutoLinkPlugin.vue
var LexicalAutoLinkPlugin_default = /* @__PURE__ */export_helper_default(LexicalAutoLinkPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoLinkPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalLinkPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent13 } from "vue";
import _defaultImport35 from "@lexical/link";
const toggleLink = _defaultImport35.toggleLink;
const TOGGLE_LINK_COMMAND = _defaultImport35.TOGGLE_LINK_COMMAND;
const LinkNode = _defaultImport35.LinkNode;
import _defaultImport36 from "lexical";
const COMMAND_PRIORITY_EDITOR2 = _defaultImport36.COMMAND_PRIORITY_EDITOR;
var LexicalLinkPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent13({
  __name: "LexicalLinkPlugin",
  setup(__props) {
    const editor = useEditor();
    useMounted(() => {
      if (!editor.hasNodes([LinkNode])) throw new Error("LinkPlugin: LinkNode not registered on editor");
      return editor.registerCommand(TOGGLE_LINK_COMMAND, payload => {
        if (typeof payload === "string" || payload === null) {
          toggleLink(payload);
        } else {
          const {
            url,
            target,
            rel
          } = payload;
          toggleLink(url, {
            rel,
            target
          });
        }
        return true;
      }, COMMAND_PRIORITY_EDITOR2);
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalLinkPlugin.vue
var LexicalLinkPlugin_default = /* @__PURE__ */export_helper_default(LexicalLinkPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalLinkPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTablePlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent14 } from "vue";
import _defaultImport37 from "@lexical/table";
const applyTableHandlers = _defaultImport37.applyTableHandlers;
const TableRowNode = _defaultImport37.TableRowNode;
const TableNode = _defaultImport37.TableNode;
const TableCellNode = _defaultImport37.TableCellNode;
const INSERT_TABLE_COMMAND = _defaultImport37.INSERT_TABLE_COMMAND;
const $isTableNode = _defaultImport37.$isTableNode;
const $isTableCellNode = _defaultImport37.$isTableCellNode;
const $createTableNodeWithDimensions = _defaultImport37.$createTableNodeWithDimensions;
const $createTableCellNode = _defaultImport37.$createTableCellNode;
import _defaultImport38 from "lexical";
const DEPRECATED_$isGridRowNode = _defaultImport38.DEPRECATED_$isGridRowNode;
const DEPRECATED_$getNodeTriplet = _defaultImport38.DEPRECATED_$getNodeTriplet;
const DEPRECATED_$computeGridMap = _defaultImport38.DEPRECATED_$computeGridMap;
const COMMAND_PRIORITY_EDITOR3 = _defaultImport38.COMMAND_PRIORITY_EDITOR;
const $nodesOfType = _defaultImport38.$nodesOfType;
const $isTextNode5 = _defaultImport38.$isTextNode;
const $getNodeByKey2 = _defaultImport38.$getNodeByKey;
import _defaultImport39 from "@lexical/utils";
const $insertNodeToNearestRoot = _defaultImport39.$insertNodeToNearestRoot;
var LexicalTablePlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent14({
  __name: "LexicalTablePlugin",
  props: {
    hasCellMerge: {
      type: Boolean,
      required: false,
      default: true
    },
    hasCellBackgroundColor: {
      type: Boolean,
      required: false,
      default: true
    },
    hasTabHandler: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    function $insertFirst(parent, node) {
      const firstChild = parent.getFirstChild();
      if (firstChild !== null) firstChild.insertBefore(node);else parent.append(node);
    }
    useMounted(() => {
      if (!editor.hasNodes([TableNode, TableCellNode, TableRowNode])) {
        throw new Error("TablePlugin: TableNode, TableCellNode or TableRowNode not registered on editor");
      }
      return editor.registerCommand(INSERT_TABLE_COMMAND, ({
        columns,
        rows,
        includeHeaders
      }) => {
        const tableNode = $createTableNodeWithDimensions(Number(rows), Number(columns), includeHeaders);
        $insertNodeToNearestRoot(tableNode);
        const firstDescendant = tableNode.getFirstDescendant();
        if ($isTextNode5(firstDescendant)) firstDescendant.select();
        return true;
      }, COMMAND_PRIORITY_EDITOR3);
    });
    useMounted(() => {
      const tableSelections = /* @__PURE__ */new Map();
      const initializeTableNode = tableNode => {
        const nodeKey = tableNode.getKey();
        const tableElement = editor.getElementByKey(nodeKey);
        if (tableElement && !tableSelections.has(nodeKey)) {
          const tableSelection = applyTableHandlers(tableNode, tableElement, editor, props.hasTabHandler);
          tableSelections.set(nodeKey, tableSelection);
        }
      };
      editor.getEditorState().read(() => {
        const tableNodes = $nodesOfType(TableNode);
        for (const tableNode of tableNodes) {
          if ($isTableNode(tableNode)) initializeTableNode(tableNode);
        }
      });
      const unregisterMutationListener = editor.registerMutationListener(TableNode, nodeMutations => {
        for (const [nodeKey, mutation] of nodeMutations) {
          if (mutation === "created") {
            editor.getEditorState().read(() => {
              const tableNode = $getNodeByKey2(nodeKey);
              if ($isTableNode(tableNode)) initializeTableNode(tableNode);
            });
          } else if (mutation === "destroyed") {
            const tableSelection = tableSelections.get(nodeKey);
            if (tableSelection !== void 0) {
              tableSelection.removeListeners();
              tableSelections.delete(nodeKey);
            }
          }
        }
      });
      return () => {
        unregisterMutationListener();
        for (const [, tableSelection] of tableSelections) tableSelection.removeListeners();
      };
    });
    useEffect(() => {
      if (props.hasCellMerge) return;
      return editor.registerNodeTransform(TableCellNode, node => {
        if (node.getColSpan() > 1 || node.getRowSpan() > 1) {
          const [,, gridNode] = DEPRECATED_$getNodeTriplet(node);
          const [gridMap] = DEPRECATED_$computeGridMap(gridNode, node, node);
          const rowsCount = gridMap.length;
          const columnsCount = gridMap[0].length;
          let row = gridNode.getFirstChild();
          if (!DEPRECATED_$isGridRowNode(row)) throw new Error("Expected TableNode first child to be a RowNode");
          const unmerged = [];
          for (let i = 0; i < rowsCount; i++) {
            if (i !== 0) {
              row = row.getNextSibling();
              if (!DEPRECATED_$isGridRowNode(row)) throw new Error("Expected TableNode first child to be a RowNode");
            }
            let lastRowCell = null;
            for (let j = 0; j < columnsCount; j++) {
              const cellMap = gridMap[i][j];
              const cell = cellMap.cell;
              if (cellMap.startRow === i && cellMap.startColumn === j) {
                lastRowCell = cell;
                unmerged.push(cell);
              } else if (cell.getColSpan() > 1 || cell.getRowSpan() > 1) {
                if (!$isTableCellNode(cell)) throw new Error("Expected TableNode cell to be a TableCellNode");
                const newCell = $createTableCellNode(cell.__headerState);
                if (lastRowCell !== null) lastRowCell.insertAfter(newCell);else {
                  $insertFirst(row, newCell);
                }
              }
            }
          }
          for (const cell of unmerged) {
            cell.setColSpan(1);
            cell.setRowSpan(1);
          }
        }
      });
    });
    useEffect(() => {
      if (props.hasCellBackgroundColor) return;
      return editor.registerNodeTransform(TableCellNode, node => {
        if (node.getBackgroundColor() !== null) node.setBackgroundColor(null);
      });
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalTablePlugin.vue
var LexicalTablePlugin_default = /* @__PURE__ */export_helper_default(LexicalTablePlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTablePlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalClearEditorPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent15 } from "vue";
import _defaultImport40 from "lexical";
const COMMAND_PRIORITY_EDITOR4 = _defaultImport40.COMMAND_PRIORITY_EDITOR;
const CLEAR_EDITOR_COMMAND = _defaultImport40.CLEAR_EDITOR_COMMAND;
const $getSelection8 = _defaultImport40.$getSelection;
const $getRoot4 = _defaultImport40.$getRoot;
const $createParagraphNode3 = _defaultImport40.$createParagraphNode;
import { useAttrs } from "vue";
var LexicalClearEditorPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent15({
  __name: "LexicalClearEditorPlugin",
  emits: ["clear"],
  setup(__props, {
    emit
  }) {
    const editor = useEditor();
    const attrs = useAttrs();
    useMounted(() => {
      const emitExists = Boolean(attrs.onClear);
      return editor.registerCommand(CLEAR_EDITOR_COMMAND, _payload => {
        editor.update(() => {
          if (emitExists) {
            const root = $getRoot4();
            const selection = $getSelection8();
            const paragraph = $createParagraphNode3();
            root.clear();
            root.append(paragraph);
            if (selection !== null) paragraph.select();
          } else {
            emit("clear");
          }
        });
        return true;
      }, COMMAND_PRIORITY_EDITOR4);
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalClearEditorPlugin.vue
var LexicalClearEditorPlugin_default = /* @__PURE__ */export_helper_default(LexicalClearEditorPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalClearEditorPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCharacterLimitPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent16 } from "vue";
import { toDisplayString as _toDisplayString2, normalizeClass as _normalizeClass2, openBlock as _openBlock6, createElementBlock as _createElementBlock5 } from "vue";
import { computed as computed6, ref as ref11 } from "vue";
var CHARACTER_LIMIT = 5;
var LexicalCharacterLimitPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent16({
  __name: "LexicalCharacterLimitPlugin",
  props: {
    charset: {
      type: String,
      required: false,
      default: "UTF-16"
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    let textEncoderInstance = null;
    function textEncoder() {
      if (window.TextEncoder === void 0) return null;
      if (textEncoderInstance === null) textEncoderInstance = new window.TextEncoder();
      return textEncoderInstance;
    }
    function utf8Length(text) {
      const currentTextEncoder = textEncoder();
      if (currentTextEncoder === null) {
        const m = encodeURIComponent(text).match(/%[89ABab]/g);
        return text.length + (m ? m.length : 0);
      }
      return currentTextEncoder.encode(text).length;
    }
    const remainingCharacters = ref11(0);
    function setRemainingCharacters(payload) {
      remainingCharacters.value = payload;
    }
    const characterLimitProps = computed6(() => ({
      remainingCharacters: setRemainingCharacters,
      strlen: text => {
        if (props.charset === "UTF-8") return utf8Length(text);else if (props.charset === "UTF-16") return text.length;else throw new Error("Unrecognized charset");
      }
    }));
    useCharacterLimit(editor, CHARACTER_LIMIT, characterLimitProps.value);
    return (_ctx, _cache) => {
      return _openBlock6(), _createElementBlock5("span", {
        class: _normalizeClass2(`characters-limit ${remainingCharacters.value < 0 ? "characters-limit-exceeded" : ""}`)
      }, _toDisplayString2(remainingCharacters.value), 3
      /* TEXT, CLASS */);
    };
  }
});

// src/components/LexicalCharacterLimitPlugin.vue
var LexicalCharacterLimitPlugin_default = /* @__PURE__ */export_helper_default(LexicalCharacterLimitPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCharacterLimitPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoScrollPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent17 } from "vue";
import _defaultImport41 from "lexical";
const $isRangeSelection5 = _defaultImport41.$isRangeSelection;
const $getSelection9 = _defaultImport41.$getSelection;
var LexicalAutoScrollPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent17({
  __name: "LexicalAutoScrollPlugin",
  props: {
    scrollRef: {
      type: null,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    useMounted(() => {
      return editor.registerUpdateListener(({
        tags,
        editorState
      }) => {
        const scrollElement = props.scrollRef;
        if (!scrollElement || !tags.has("scroll-into-view")) return;
        const selection = editorState.read(() => $getSelection9());
        if (!$isRangeSelection5(selection) || !selection.isCollapsed()) return;
        const anchorElement = editor.getElementByKey(selection.anchor.key);
        if (anchorElement === null) return;
        const scrollRect = scrollElement.getBoundingClientRect();
        const rect = anchorElement.getBoundingClientRect();
        if (rect.bottom > scrollRect.bottom) anchorElement.scrollIntoView(false);else if (rect.top < scrollRect.top) anchorElement.scrollIntoView();
      });
    });
    return () => {};
  }
});

// src/components/LexicalAutoScrollPlugin.vue
var LexicalAutoScrollPlugin_default = /* @__PURE__ */export_helper_default(LexicalAutoScrollPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalAutoScrollPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalHashtagPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent18 } from "vue";
import _defaultImport42 from "@lexical/hashtag";
const HashtagNode = _defaultImport42.HashtagNode;
const $createHashtagNode = _defaultImport42.$createHashtagNode;
import { onMounted as onMounted4 } from "vue";
var LexicalHashtagPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent18({
  __name: "LexicalHashtagPlugin",
  setup(__props) {
    function getHashtagRegexStringChars() {
      const latinAccents = "\xC0-\xD6\xD8-\xF6\xF8-\xFF\u0100-\u024F\u0253-\u0254\u0256-\u0257\u0259\u025B\u0263\u0268\u026F\u0272\u0289\u028B\u02BB\u0300-\u036F\u1E00-\u1EFF";
      const nonLatinChars = "\u0400-\u04FF\u0500-\u0527\u2DE0-\u2DFF\uA640-\uA69F\u0591-\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F4\uFB12-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFB4F\u0610-\u061A\u0620-\u065F\u066E-\u06D3\u06D5-\u06DC\u06DE-\u06E8\u06EA-\u06EF\u06FA-\u06FC\u06FF\u0750-\u077F\u08A0\u08A2-\u08AC\u08E4-\u08FE\uFB50-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\u200C-\u200C\u0E01-\u0E3A\u0E40-\u0E4E\u1100-\u11FF\u3130-\u3185\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF\uFFA1-\uFFDC";
      const charCode = String.fromCharCode;
      const cjkChars = `\u30A1-\u30FA\u30FC-\u30FE\uFF66-\uFF9F\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\u3041-\u3096\u3099-\u309E\u3400-\u4DBF\u4E00-\u9FFF${// Kanji (Unified)
      // Disabled as it breaks the Regex.
      // charCode(0x20000) + '-' + charCode(0x2A6DF) + // Kanji (CJK Extension B)
      charCode(173824)}-${charCode(177983)}${charCode(177984)}-${charCode(178207)}${charCode(194560)}-${charCode(195103)}\u3003\u3005\u303B`;
      const otherChars = latinAccents + nonLatinChars + cjkChars;
      const unicodeLetters = "A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u0241\u0250-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EE\u037A\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03F5\u03F7-\u0481\u048A-\u04CE\u04D0-\u04F9\u0500-\u050F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0621-\u063A\u0640-\u064A\u066E-\u066F\u0671-\u06D3\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u076D\u0780-\u07A5\u07B1\u0904-\u0939\u093D\u0950\u0958-\u0961\u097D\u0985-\u098C\u098F-\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC-\u09DD\u09DF-\u09E1\u09F0-\u09F1\u0A05-\u0A0A\u0A0F-\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32-\u0A33\u0A35-\u0A36\u0A38-\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2-\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0-\u0AE1\u0B05-\u0B0C\u0B0F-\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32-\u0B33\u0B35-\u0B39\u0B3D\u0B5C-\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99-\u0B9A\u0B9C\u0B9E-\u0B9F\u0BA3-\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C60-\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0-\u0CE1\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D60-\u0D61\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32-\u0E33\u0E40-\u0E46\u0E81-\u0E82\u0E84\u0E87-\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA-\u0EAB\u0EAD-\u0EB0\u0EB2-\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDD\u0F00\u0F40-\u0F47\u0F49-\u0F6A\u0F88-\u0F8B\u1000-\u1021\u1023-\u1027\u1029-\u102A\u1050-\u1055\u10A0-\u10C5\u10D0-\u10FA\u10FC\u1100-\u1159\u115F-\u11A2\u11A8-\u11F9\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u1676\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19A9\u19C1-\u19C7\u1A00-\u1A16\u1D00-\u1DBF\u1E00-\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u2094\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2131\u2133-\u2139\u213C-\u213F\u2145-\u2149\u2C00-\u2C2E\u2C30-\u2C5E\u2C80-\u2CE4\u2D00-\u2D25\u2D30-\u2D65\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3006\u3031-\u3035\u303B-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312C\u3131-\u318E\u31A0-\u31B7\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FBB\uA000-\uA48C\uA800-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uAC00-\uD7A3\uF900-\uFA2D\uFA30-\uFA6A\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC";
      const unicodeAccents = "\u0300-\u036F\u0483-\u0486\u0591-\u05B9\u05BB-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C5\u05C7\u0610-\u0615\u064B-\u065E\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u0901-\u0903\u093C\u093E-\u094D\u0951-\u0954\u0962-\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7-\u09C8\u09CB-\u09CD\u09D7\u09E2-\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47-\u0A48\u0A4B-\u0A4D\u0A70-\u0A71\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2-\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B43\u0B47-\u0B48\u0B4B-\u0B4D\u0B56-\u0B57\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55-\u0C56\u0C82-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5-\u0CD6\u0D02-\u0D03\u0D3E-\u0D43\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D82-\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2-\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB-\u0EBC\u0EC8-\u0ECD\u0F18-\u0F19\u0F35\u0F37\u0F39\u0F3E-\u0F3F\u0F71-\u0F84\u0F86-\u0F87\u0F90-\u0F97\u0F99-\u0FBC\u0FC6\u102C-\u1032\u1036-\u1039\u1056-\u1059\u135F\u1712-\u1714\u1732-\u1734\u1752-\u1753\u1772-\u1773\u17B6-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8-\u19C9\u1A17-\u1A1B\u1DC0-\u1DC3\u20D0-\u20DC\u20E1\u20E5-\u20EB\u302A-\u302F\u3099-\u309A\uA802\uA806\uA80B\uA823-\uA827\uFB1E\uFE00-\uFE0F\uFE20-\uFE23";
      const unicodeDigits = "0-9\u0660-\u0669\u06F0-\u06F9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\uFF10-\uFF19";
      const alpha = unicodeLetters + unicodeAccents + otherChars;
      const numeric = `${unicodeDigits}_`;
      const alphanumeric = alpha + numeric;
      const hashChars = "#\\uFF03";
      return {
        alpha,
        alphanumeric,
        hashChars
      };
    }
    function getHashtagRegexString() {
      const {
        alpha,
        alphanumeric,
        hashChars
      } = getHashtagRegexStringChars();
      const hashtagAlpha = `[${alpha}]`;
      const hashtagAlphanumeric = `[${alphanumeric}]`;
      const hashtagBoundary = `^|$|[^&/${alphanumeric}]`;
      const hashCharList = `[${hashChars}]`;
      const hashtag = `(${hashtagBoundary})(${hashCharList})(${hashtagAlphanumeric}*${hashtagAlpha}${hashtagAlphanumeric}*)`;
      return hashtag;
    }
    const REGEX = new RegExp(getHashtagRegexString(), "i");
    const editor = useEditor();
    onMounted4(() => {
      if (!editor.hasNodes([HashtagNode])) throw new Error("HashtagPlugin: HashtagNode not registered on editor");
    });
    function createHashtagNode(textNode) {
      return $createHashtagNode(textNode.getTextContent());
    }
    function getHashtagMatch(text) {
      const matchArr = REGEX.exec(text);
      if (matchArr === null) return null;
      const hashtagLength = matchArr[3].length + 1;
      const startOffset = matchArr.index + matchArr[1].length;
      const endOffset = startOffset + hashtagLength;
      return {
        end: endOffset,
        start: startOffset
      };
    }
    useLexicalTextEntity(getHashtagMatch, HashtagNode, createHashtagNode);
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalHashtagPlugin.vue
var LexicalHashtagPlugin_default = /* @__PURE__ */export_helper_default(LexicalHashtagPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalHashtagPlugin.vue"]]);

// src/components/LexicalDecoratorBlockNode.ts
import _defaultImport43 from "lexical";
const DecoratorNode = _defaultImport43.DecoratorNode;
var DecoratorBlockNode = class extends DecoratorNode {
  __format;
  constructor(format, key) {
    super(key);
    this.__format = format || "";
  }
  exportJSON() {
    return {
      format: this.__format || "",
      type: "decorator-block",
      version: 1
    };
  }
  createDOM() {
    return document.createElement("div");
  }
  updateDOM() {
    return false;
  }
  setFormat(format) {
    const self = this.getWritable();
    self.__format = format;
  }
};
function $createDecoratorBlockNode() {
  return new DecoratorBlockNode();
}
function $isDecoratorBlockNode(node) {
  return node instanceof DecoratorBlockNode;
}

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalBlockWithAlignableContents.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent19 } from "vue";
import { unref as _unref4, renderSlot as _renderSlot6, normalizeClass as _normalizeClass3, normalizeStyle as _normalizeStyle, openBlock as _openBlock7, createElementBlock as _createElementBlock6 } from "vue";
import _defaultImport44 from "@lexical/utils";
const mergeRegister10 = _defaultImport44.mergeRegister;
const $getNearestBlockElementAncestorOrThrow = _defaultImport44.$getNearestBlockElementAncestorOrThrow;
import _defaultImport45 from "lexical";
const KEY_DELETE_COMMAND = _defaultImport45.KEY_DELETE_COMMAND;
const KEY_BACKSPACE_COMMAND = _defaultImport45.KEY_BACKSPACE_COMMAND;
const FORMAT_ELEMENT_COMMAND = _defaultImport45.FORMAT_ELEMENT_COMMAND;
const COMMAND_PRIORITY_LOW3 = _defaultImport45.COMMAND_PRIORITY_LOW;
const CLICK_COMMAND = _defaultImport45.CLICK_COMMAND;
const $isRangeSelection6 = _defaultImport45.$isRangeSelection;
const $isNodeSelection3 = _defaultImport45.$isNodeSelection;
const $isDecoratorNode = _defaultImport45.$isDecoratorNode;
const $getSelection10 = _defaultImport45.$getSelection;
const $getNodeByKey3 = _defaultImport45.$getNodeByKey;
import { ref as ref12 } from "vue";
var LexicalBlockWithAlignableContents_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent19({
  __name: "LexicalBlockWithAlignableContents",
  props: {
    format: {
      type: String,
      required: false
    },
    nodeKey: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    const {
      isSelected,
      setSelected,
      clearSelection
    } = useLexicalNodeSelection(props.nodeKey);
    const containerRef = ref12(null);
    function onDelete(event) {
      if (isSelected.value && $isNodeSelection3($getSelection10())) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey3(props.nodeKey);
          if ($isDecoratorNode(node)) node?.remove();
          setSelected(false);
        });
      }
      return false;
    }
    useMounted(() => {
      return mergeRegister10(editor.registerCommand(FORMAT_ELEMENT_COMMAND, formatType => {
        if (isSelected.value) {
          const selection = $getSelection10();
          if ($isNodeSelection3(selection)) {
            const node = $getNodeByKey3(props.nodeKey);
            if (node && $isDecoratorBlockNode(node)) node.setFormat(formatType);
          } else if ($isRangeSelection6(selection)) {
            const nodes = selection.getNodes();
            for (const node of nodes) {
              if ($isDecoratorBlockNode(node)) {
                node.setFormat(formatType);
              } else {
                const element = $getNearestBlockElementAncestorOrThrow(node);
                element.setFormat(formatType);
              }
            }
          }
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW3), editor.registerCommand(CLICK_COMMAND, event => {
        if (event.target === containerRef.value) {
          event.preventDefault();
          if (!event.shiftKey) clearSelection();
          setSelected(!isSelected.value);
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW3), editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW3), editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW3));
    });
    return (_ctx, _cache) => {
      return _openBlock7(), _createElementBlock6("div", {
        ref_key: "containerRef",
        ref: containerRef,
        style: _normalizeStyle(`text-align: ${_ctx.format}`),
        class: _normalizeClass3(`embed-block${_unref4(isSelected) ? " focused" : ""}`)
      }, [_renderSlot6(_ctx.$slots, "default")], 6
      /* CLASS, STYLE */);
    };
  }
});

// src/components/LexicalBlockWithAlignableContents.vue
var LexicalBlockWithAlignableContents_default = /* @__PURE__ */export_helper_default(LexicalBlockWithAlignableContents_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalBlockWithAlignableContents.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCheckListPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent20 } from "vue";
import _defaultImport46 from "lexical";
const KEY_SPACE_COMMAND = _defaultImport46.KEY_SPACE_COMMAND;
const KEY_ESCAPE_COMMAND2 = _defaultImport46.KEY_ESCAPE_COMMAND;
const KEY_ARROW_UP_COMMAND2 = _defaultImport46.KEY_ARROW_UP_COMMAND;
const KEY_ARROW_LEFT_COMMAND = _defaultImport46.KEY_ARROW_LEFT_COMMAND;
const KEY_ARROW_DOWN_COMMAND2 = _defaultImport46.KEY_ARROW_DOWN_COMMAND;
const COMMAND_PRIORITY_LOW4 = _defaultImport46.COMMAND_PRIORITY_LOW;
const $isRangeSelection7 = _defaultImport46.$isRangeSelection;
const $isElementNode3 = _defaultImport46.$isElementNode;
const $getSelection11 = _defaultImport46.$getSelection;
const $getNearestNodeFromDOMNode = _defaultImport46.$getNearestNodeFromDOMNode;
import _defaultImport47 from "@lexical/list";
const insertList2 = _defaultImport47.insertList;
const INSERT_CHECK_LIST_COMMAND = _defaultImport47.INSERT_CHECK_LIST_COMMAND;
const $isListNode = _defaultImport47.$isListNode;
const $isListItemNode = _defaultImport47.$isListItemNode;
import _defaultImport48 from "@lexical/utils";
// src/composables/listenerManager.ts
const mergeRegister11 = _defaultImport48.mergeRegister;
const $findMatchingParent = _defaultImport48.$findMatchingParent;
var handleClickAndPointerDownListenersCount = 0;
var handleClickAndPointerDownListenersUnregister;
function registerClickAndPointerListeners(register, unregister) {
  if (handleClickAndPointerDownListenersCount++ === 0) {
    register();
    handleClickAndPointerDownListenersUnregister = unregister;
  }
  return () => {
    if (--handleClickAndPointerDownListenersCount === 0) {
      handleClickAndPointerDownListenersUnregister?.();
      handleClickAndPointerDownListenersUnregister = void 0;
    }
  };
}

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCheckListPlugin.vue?vue&type=script&setup=true&lang.ts
var LexicalCheckListPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent20({
  __name: "LexicalCheckListPlugin",
  setup(__props) {
    const editor = useEditor();
    useMounted(() => {
      return mergeRegister11(editor.registerCommand(INSERT_CHECK_LIST_COMMAND, () => {
        insertList2(editor, "check");
        return true;
      }, COMMAND_PRIORITY_LOW4), editor.registerCommand(KEY_ARROW_DOWN_COMMAND2, event => {
        return handleArrownUpOrDown(event, editor, false);
      }, COMMAND_PRIORITY_LOW4), editor.registerCommand(KEY_ARROW_UP_COMMAND2, event => {
        return handleArrownUpOrDown(event, editor, true);
      }, COMMAND_PRIORITY_LOW4), editor.registerCommand(KEY_ESCAPE_COMMAND2, _event => {
        const activeItem = getActiveCheckListItem();
        if (activeItem != null) {
          const rootElement = editor.getRootElement();
          if (rootElement != null) rootElement.focus();
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW4), editor.registerCommand(KEY_SPACE_COMMAND, event => {
        const activeItem = getActiveCheckListItem();
        if (activeItem != null) {
          editor.update(() => {
            const listItemNode = $getNearestNodeFromDOMNode(activeItem);
            if ($isListItemNode(listItemNode)) {
              event.preventDefault();
              listItemNode.toggleChecked();
            }
          });
          return true;
        }
        return false;
      }, COMMAND_PRIORITY_LOW4), editor.registerCommand(KEY_ARROW_LEFT_COMMAND, event => {
        return editor.getEditorState().read(() => {
          const selection = $getSelection11();
          if ($isRangeSelection7(selection) && selection.isCollapsed()) {
            const {
              anchor
            } = selection;
            const isElement = anchor.type === "element";
            if (isElement || anchor.offset === 0) {
              const anchorNode = anchor.getNode();
              const elementNode = $findMatchingParent(anchorNode, node => $isElementNode3(node) && !node.isInline());
              if ($isListItemNode(elementNode)) {
                const parent = elementNode.getParent();
                if ($isListNode(parent) && parent.getListType() === "check" && (isElement || elementNode.getFirstDescendant() === anchorNode)) {
                  const domNode = editor.getElementByKey(elementNode.__key);
                  if (domNode != null && document.activeElement !== domNode) {
                    domNode.focus();
                    event.preventDefault();
                    return true;
                  }
                }
              }
            }
          }
          return false;
        });
      }, COMMAND_PRIORITY_LOW4), listenPointerDown());
    });
    function listenPointerDown() {
      return registerClickAndPointerListeners(() => {
        document.addEventListener("click", handleClick);
        document.addEventListener("pointerdown", handlePointerDown);
      }, () => {
        document.removeEventListener("click", handleClick);
        document.removeEventListener("pointerdown", handlePointerDown);
      });
    }
    function handleCheckItemEvent(event, callback) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const firstChild = target.firstChild;
      if (firstChild != null && (firstChild.tagName === "UL" || firstChild.tagName === "OL")) return;
      const parentNode = target.parentNode;
      if (!parentNode || parentNode.__lexicalListType !== "check") return;
      const pageX = event.pageX;
      const rect = target.getBoundingClientRect();
      if (target.dir === "rtl" ? pageX < rect.right && pageX > rect.right - 20 : pageX > rect.left && pageX < rect.left + 20) callback();
    }
    function handleClick(event) {
      handleCheckItemEvent(event, () => {
        const domNode = event.target;
        const editor2 = findEditor(domNode);
        if (editor2 !== null) {
          editor2.update(() => {
            const node = $getNearestNodeFromDOMNode(domNode);
            if ($isListItemNode(node)) {
              domNode.focus();
              node.toggleChecked();
            }
          });
        }
      });
    }
    function handlePointerDown(event) {
      handleCheckItemEvent(event, () => {
        event.preventDefault();
      });
    }
    function findEditor(target) {
      let node = target;
      while (node) {
        if (node.__lexicalEditor) return node.__lexicalEditor;
        node = node.parentNode;
      }
      return null;
    }
    function getActiveCheckListItem() {
      const {
        activeElement
      } = document;
      return activeElement !== null && activeElement.tagName === "LI" && activeElement.parentNode !== null && activeElement.parentNode.__lexicalListType === "check" ? activeElement : null;
    }
    function findCheckListItemSibling(node, backward) {
      let sibling = backward ? node.getPreviousSibling() : node.getNextSibling();
      let parent = node;
      while (sibling == null && $isListItemNode(parent)) {
        parent = parent.getParentOrThrow().getParent();
        if (parent !== null) {
          sibling = backward ? parent.getPreviousSibling() : parent.getNextSibling();
        }
      }
      while ($isListItemNode(sibling)) {
        const firstChild = backward ? sibling.getLastChild() : sibling.getFirstChild();
        if (!$isListNode(firstChild)) return sibling;
        sibling = backward ? firstChild.getLastChild() : firstChild.getFirstChild();
      }
      return null;
    }
    function handleArrownUpOrDown(event, editor2, backward) {
      const activeItem = getActiveCheckListItem();
      if (activeItem != null) {
        editor2.update(() => {
          const listItem = $getNearestNodeFromDOMNode(activeItem);
          if (!$isListItemNode(listItem)) return;
          const nextListItem = findCheckListItemSibling(listItem, backward);
          if (nextListItem != null) {
            nextListItem.selectStart();
            const dom = editor2.getElementByKey(nextListItem.__key);
            if (dom != null) {
              event.preventDefault();
              setTimeout(() => {
                dom.focus();
              }, 0);
            }
          }
        });
      }
      return false;
    }
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalCheckListPlugin.vue
var LexicalCheckListPlugin_default = /* @__PURE__ */export_helper_default(LexicalCheckListPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCheckListPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalMarkdownShortcutPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent21 } from "vue";
import _defaultImport49 from "@lexical/markdown";
const registerMarkdownShortcuts = _defaultImport49.registerMarkdownShortcuts;
const TRANSFORMERS = _defaultImport49.TRANSFORMERS;
var LexicalMarkdownShortcutPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent21({
  __name: "LexicalMarkdownShortcutPlugin",
  props: {
    transformers: {
      type: Array,
      required: false,
      default: () => [...TRANSFORMERS]
    }
  },
  setup(__props) {
    const props = __props;
    const editor = useEditor();
    useMounted(() => {
      return registerMarkdownShortcuts(editor, props.transformers);
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalMarkdownShortcutPlugin.vue
var LexicalMarkdownShortcutPlugin_default = /* @__PURE__ */export_helper_default(LexicalMarkdownShortcutPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalMarkdownShortcutPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTabIndentationPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent22 } from "vue";
import _defaultImport50 from "lexical";
const OUTDENT_CONTENT_COMMAND = _defaultImport50.OUTDENT_CONTENT_COMMAND;
const KEY_TAB_COMMAND2 = _defaultImport50.KEY_TAB_COMMAND;
const INDENT_CONTENT_COMMAND = _defaultImport50.INDENT_CONTENT_COMMAND;
const COMMAND_PRIORITY_EDITOR5 = _defaultImport50.COMMAND_PRIORITY_EDITOR;
const $isRangeSelection8 = _defaultImport50.$isRangeSelection;
const $getSelection12 = _defaultImport50.$getSelection;
var LexicalTabIndentationPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent22({
  __name: "LexicalTabIndentationPlugin",
  setup(__props) {
    const editor = useEditor();
    useMounted(() => {
      return editor.registerCommand(KEY_TAB_COMMAND2, event => {
        const selection = $getSelection12();
        if (!$isRangeSelection8(selection)) return false;
        event.preventDefault();
        return editor.dispatchCommand(event.shiftKey ? OUTDENT_CONTENT_COMMAND : INDENT_CONTENT_COMMAND, void 0);
      }, COMMAND_PRIORITY_EDITOR5);
    });
    return (_ctx, _cache) => {
      return null;
    };
  }
});

// src/components/LexicalTabIndentationPlugin.vue
var LexicalTabIndentationPlugin_default = /* @__PURE__ */export_helper_default(LexicalTabIndentationPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalTabIndentationPlugin.vue"]]);

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCollaborationPlugin.vue?vue&type=script&setup=true&lang.ts
import { defineComponent as _defineComponent23 } from "vue";
import { unref as _unref5, createElementVNode as _createElementVNode2, Teleport as _Teleport, openBlock as _openBlock8, createBlock as _createBlock2 } from "vue";
import { computed as computed7, watchEffect as watchEffect3 } from "vue";

// src/composables/useCollaborationContext.ts
import { ref as ref13 } from "vue";
var entries = [["Cat", "rgb(125, 50, 0)"], ["Dog", "rgb(100, 0, 0)"], ["Rabbit", "rgb(150, 0, 0)"], ["Frog", "rgb(200, 0, 0)"], ["Fox", "rgb(200, 75, 0)"], ["Hedgehog", "rgb(0, 75, 0)"], ["Pigeon", "rgb(0, 125, 0)"], ["Squirrel", "rgb(75, 100, 0)"], ["Bear", "rgb(125, 100, 0)"], ["Tiger", "rgb(0, 0, 150)"], ["Leopard", "rgb(0, 0, 200)"], ["Zebra", "rgb(0, 0, 250)"], ["Wolf", "rgb(0, 100, 150)"], ["Owl", "rgb(0, 100, 100)"], ["Gull", "rgb(100, 0, 100)"], ["Squid", "rgb(150, 0, 150)"]];
var randomEntry = entries[Math.floor(Math.random() * entries.length)];
var useCollaborationContext_default = ref13({
  clientID: 0,
  color: randomEntry[1],
  isCollabActive: false,
  name: randomEntry[0],
  yjsDocMap: /* @__PURE__ */new Map()
});

// unplugin-vue:/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCollaborationPlugin.vue?vue&type=script&setup=true&lang.ts
var LexicalCollaborationPlugin_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */_defineComponent23({
  __name: "LexicalCollaborationPlugin",
  props: {
    id: {
      type: String,
      required: true
    },
    providerFactory: {
      type: Function,
      required: true
    },
    shouldBootstrap: {
      type: Boolean,
      required: true
    },
    username: {
      type: String,
      required: false
    },
    cursorColor: {
      type: String,
      required: false
    },
    cursorsContainerRef: {
      type: null,
      required: false
    },
    initialEditorState: {
      type: [null, String, Object, Function],
      required: false
    },
    excludedProperties: {
      type: Map,
      required: false
    },
    awarenessData: {
      type: Object,
      required: false
    }
  },
  setup(__props) {
    const props = __props;
    watchEffect3(() => {
      if (props.username !== void 0) useCollaborationContext_default.value.name = props.username;
      if (props.cursorColor !== void 0) useCollaborationContext_default.value.color = props.cursorColor;
    });
    const editor = useEditor();
    useEffect(() => {
      useCollaborationContext_default.value.isCollabActive = true;
      return () => {
        if (editor._parentEditor == null) useCollaborationContext_default.value.isCollabActive = false;
      };
    });
    const provider = computed7(() => props.providerFactory(props.id, useCollaborationContext_default.value.yjsDocMap));
    const binding = useYjsCollaboration(editor, props.id, provider.value, useCollaborationContext_default.value.yjsDocMap, useCollaborationContext_default.value.name, useCollaborationContext_default.value.color, props.shouldBootstrap, props.initialEditorState, props.excludedProperties, props.awarenessData);
    watchEffect3(() => {
      useCollaborationContext_default.value.clientID = binding.value.clientID;
    });
    useYjsHistory(editor, binding.value);
    useYjsFocusTracking(editor, provider.value, useCollaborationContext_default.value.name, useCollaborationContext_default.value.color, props.awarenessData);
    return (_ctx, _cache) => {
      return _openBlock8(), _createBlock2(_Teleport, {
        to: _ctx.cursorsContainerRef || "body"
      }, [_createElementVNode2("div", {
        ref: element => _unref5(binding).cursorsContainer = element
      }, null, 512
      /* NEED_PATCH */)], 8, ["to"]);
    };
  }
});

// src/components/LexicalCollaborationPlugin.vue
var LexicalCollaborationPlugin_default = /* @__PURE__ */export_helper_default(LexicalCollaborationPlugin_vue_vue_type_script_setup_true_lang_default, [["__file", "/Users/wing/ParacraftDevelop/lexical-vue/src/components/LexicalCollaborationPlugin.vue"]]);
export { $createDecoratorBlockNode, $isDecoratorBlockNode, DecoratorBlockNode, LexicalAutoFocusPlugin_default as LexicalAutoFocusPlugin, LexicalAutoLinkPlugin_default as LexicalAutoLinkPlugin, LexicalAutoScrollPlugin_default as LexicalAutoScrollPlugin, LexicalBlockWithAlignableContents_default as LexicalBlockWithAlignableContents, LexicalCharacterLimitPlugin_default as LexicalCharacterLimitPlugin, LexicalCheckListPlugin_default as LexicalCheckListPlugin, LexicalClearEditorPlugin_default as LexicalClearEditorPlugin, LexicalCollaborationPlugin_default as LexicalCollaborationPlugin, LexicalComposer_default as LexicalComposer, LexicalContentEditable_default as LexicalContentEditable, LexicalDecoratedTeleports_default as LexicalDecoratedTeleports, LexicalHashtagPlugin_default as LexicalHashtagPlugin, LexicalHistoryPlugin_default as LexicalHistoryPlugin, LexicalLinkPlugin_default as LexicalLinkPlugin, LexicalListPlugin_default as LexicalListPlugin, LexicalMarkdownShortcutPlugin_default as LexicalMarkdownShortcutPlugin, LexicalOnChangePlugin_default as LexicalOnChangePlugin, LexicalPlainTextPlugin_default as LexicalPlainTextPlugin, LexicalPopoverMenu_default as LexicalPopoverMenu, LexicalRichTextPlugin_default as LexicalRichTextPlugin, LexicalTabIndentationPlugin_default as LexicalTabIndentationPlugin, LexicalTablePlugin_default as LexicalTablePlugin, LexicalTreeViewPlugin_default as LexicalTreeViewPlugin, LexicalTypeaheadMenuPlugin_default as LexicalTypeaheadMenuPlugin, PUNCTUATION, TypeaheadOption, mergePrevious, useAutoLink, useBasicTypeaheadTriggerMatch, useCanShowPlaceholder, useCharacterLimit, useDecorators, useDynamicPositioning, useEditor, useEffect, useHistory, useLexicalIsTextContentEmpty, useLexicalNodeSelection, useLexicalTextEntity, useLexicalTypeaheadMenuPlugin, useList, useMenuAnchorRef, useMounted, usePlainTextSetup, useRichTextSetup, useYjsCollaboration, useYjsFocusTracking, useYjsHistory };
/*!
 * Original code by Meta Platforms
 * MIT Licensed, Copyright (c) Meta Platforms, Inc. and affiliates, see https://github.com/facebook/lexical/blob/main/LICENSE for details
 *
 */
