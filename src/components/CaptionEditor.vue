<template>
  <!-- 描述富文本框（# 话题 / @ 提及），从发布页抽出来的，供批量发布页每集各用一个。
       内容以纯文本（innerText）通过 v-model 往外给，和单个发布页提交的 description 一致 -->
  <div class="caption-editor">
    <div class="desc-input-wrap">
      <div
        ref="captionRef"
        class="description-content"
        contenteditable="true"
        :placeholder="placeholder"
        @input="handleCaptionInput"
        @keydown="handleCaptionKeydown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @click="handleCaptionClick"
        @blur="onCaptionBlur"
        @paste="handlePaste"
      ></div>

      <div class="caption-actions-box">
        <div class="caption-actions">
          <button class="action-btn" @click="onActionBtnClick('#')">
            #{{ t("submit.topic") }}
          </button>
          <button class="action-btn" @click="onActionBtnClick('@')">
            @{{ t("submit.mention") }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mention/Topic Dropdown -->
    <div
      v-if="showDropdown"
      class="mention-dropdown"
      :style="getDropdownStyle()"
    >
      <div class="dropdown-list">
        <div v-if="isDropdownLoading" class="dropdown-loading">
          <div class="loading-spinner"></div>
          <span>{{ t('loading') }}</span>
        </div>
        <template v-else>
          <div
            v-for="item in dropdownItems"
            :key="item.value"
            class="dropdown-item"
            @click="selectDropdownItem(item)"
          >
            <div class="item-left">
              <img v-if="dropdownType === '@'" :src="item.avatar" class="avatar" alt="" />
              <span class="label">{{ item.label }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api/index';
import { toast } from '@/util/toast';

const props = withDefaults(defineProps<{
  modelValue?: string;
  maxLength?: number;
  placeholder?: string;
}>(), {
  modelValue: '',
  maxLength: 4000,
  placeholder: '',
});
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'update:length', value: number): void;
}>();

const { t } = useI18n();
const captionRef = ref<HTMLDivElement | null>(null);
const captionLength = ref(0);
// 下面的函数都是从发布页原样搬过来的，读写的是 form.value.description，这里保留同样的形状
const form = ref({ description: props.modelValue || '' });

interface DropdownItem {
  label: string;
  value: string;
  views?: string;
  followers?: string;
  avatar?: string;
}

const showDropdown = ref(false);
const dropdownType = ref<"#" | "@" | "">("");
const dropdownItems = ref<DropdownItem[]>([]);
const dropdownPosition = ref<{ top?: number; left?: number; right?: number; position?: 'above'; bottom?: number }>({ top: 0, left: 0 });
const lastRange = ref<Range | null>(null);
const isDropdownLoading = ref(false);
const isOpeningDropdown = ref(false);
// True while an IME (Chinese / Japanese pinyin, etc.) composition is running.
const isComposingText = ref(false);

// 把 form.description 渲染进描述富文本框（# 话题 / @ 提及做成不可编辑的标签）。
// 编辑作品时不能在 getPostDetails 里直接渲染：那时 isInitializing 还是 true，内容区（v-if）没挂载，
// captionRef 是空的，描述就丢了；要等 isInitializing 置回 false、DOM 更新后再调这个函数。
function renderCaptionContent() {
  if (!captionRef.value) return;
  const content = form.value.description || "";
  captionRef.value.innerHTML = '';

  let currentIndex = 0;
  let pos = 0;
  const contentLength = content.length;

  while (pos < contentLength) {
    const tagIndex = content.indexOf('#', pos);
    const mentionIndex = content.indexOf('@', pos);

    let nextMatchIndex = -1;
    let isTag = false;

    if (tagIndex === -1 && mentionIndex === -1) {
      break;
    } else if (tagIndex === -1) {
      nextMatchIndex = mentionIndex;
      isTag = false;
    } else if (mentionIndex === -1) {
      nextMatchIndex = tagIndex;
      isTag = true;
    } else {
      nextMatchIndex = Math.min(tagIndex, mentionIndex);
      isTag = nextMatchIndex === tagIndex;
    }

    if (nextMatchIndex > currentIndex) {
      const textBefore = content.substring(currentIndex, nextMatchIndex);
      const textNode = document.createTextNode(textBefore);
      captionRef.value?.appendChild(textNode);
    }

    let endIndex = nextMatchIndex + 1;
    while (endIndex < contentLength) {
      const char = content[endIndex];
      if (char === '\u0020' || char === '\n' || char === '\t') {
        break;
      }
      endIndex++;
    }

    const matchText = content.substring(nextMatchIndex, endIndex);

    const span = document.createElement('span');
    span.className = isTag ? 'tag topic' : 'tag mention';
    span.style.color = '#00d3f2';
    span.contentEditable = 'false';
    span.textContent = matchText;
    captionRef.value?.appendChild(span);

    const space = document.createTextNode('\u0020');
    captionRef.value?.appendChild(space);

    currentIndex = endIndex;
    pos = endIndex;
  }

  if (currentIndex < content.length) {
    const textAfter = content.substring(currentIndex);
    const textNode = document.createTextNode(textAfter);
    captionRef.value?.appendChild(textNode);
  }

  captionLength.value = content.length;
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault();

  const text = e.clipboardData?.getData('text/plain') || '';

  const selection = window.getSelection();
  if (!selection) return;

  const range = selection.getRangeAt(0);

  const currentText = captionRef.value?.innerText || '';
  const currentLength = currentText.length;
  const remainingLength = props.maxLength - currentLength;
  const pasteText = remainingLength > 0 ? text.substring(0, remainingLength) : '';

  range.deleteContents();

  const textNode = document.createTextNode(pasteText);
  range.insertNode(textNode);

  const newRange = document.createRange();
  newRange.setStartAfter(textNode);
  newRange.collapse(true);
  selection.removeAllRanges();
  selection.addRange(newRange);

  // Restore tag span styles
  captionRef.value?.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });

  updateCaptionStats();
  requestAnimationFrame(() => scrollCaptionToCursor());
}

function truncateContentPreservingTags(element: HTMLElement, maxLength: number) {
  const childNodes = Array.from(element.childNodes);
  let totalLength = 0;
  let overflow = false;

  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    if (overflow) {
      element.removeChild(node);
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const nodeLength = text.replace(/\n$/, '').length;

      if (totalLength + nodeLength > maxLength) {
        const remaining = maxLength - totalLength;
        node.textContent = text.substring(0, remaining > 0 ? remaining : 0);
        overflow = true;
      } else {
        totalLength += nodeLength;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const elText = el.innerText || '';
      const elLength = elText.replace(/\n$/, '').length;

      if (totalLength + elLength > maxLength) {
        if (el.classList.contains('tag')) {
          element.removeChild(node);
        } else {
          truncateContentPreservingTags(el, maxLength - totalLength);
          overflow = true;
        }
      } else {
        totalLength += elLength;
      }
    }
  }

  element.querySelectorAll('.tag').forEach((span: Element) => {
    const el = span as HTMLElement;
    el.style.color = '#00d3f2';
    el.contentEditable = 'false';
  });
}

async function handleCaptionInput(e: Event) {
  const target = e.target as HTMLDivElement;

  if (isComposingText.value || (e as InputEvent).isComposing) {
    captionLength.value = (target.innerText || "").replace(/\n$/, "").length;
    return;
  }

  // Restore tag span styling that may have been lost during input
  if (captionRef.value) {
    captionRef.value.querySelectorAll('.tag').forEach((span: Element) => {
      const el = span as HTMLElement;
      el.style.color = '#00d3f2';
      el.contentEditable = 'false';
    });
  }

  const text = target.innerText || "";
  const trimmedText = text.replace(/\n$/, "");
  const currentLength = trimmedText.length;

  if (currentLength > props.maxLength) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      truncateContentPreservingTags(target, props.maxLength);
      captionLength.value = props.maxLength;

      const range = document.createRange();
      range.selectNodeContents(target);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    return;
  }

  captionLength.value = currentLength;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 检查是否在 span 标签内（已选中的话题/提及标签）
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') {
      inSpan = true;
      break;
    }
    node = node.parentNode;
  }
  if (inSpan) {
    showDropdown.value = false;
    return;
  }

  const caretPos = resolveCaretPosition(range);
  const textBefore = caretPos
    ? (caretPos.node.textContent || "").substring(0, caretPos.offset)
    : (range.startContainer.textContent?.substring(0, range.startOffset) || "");

  // 只有光标在 # 或 @ 后面（包括正在输入中）才显示下拉框
  const match = textBefore.match(/([#@])([^#@\s]*)$/u);
  if (match) {
    const trigger = match[1] as "#" | "@";
    const query = match[2];
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
    setTimeout(() => {
      isOpeningDropdown.value = false;
    }, 100);
  } else {
    showDropdown.value = false;
  }

  requestAnimationFrame(() => scrollCaptionToCursor());
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const debouncedSearchTags = debounce(async (type: "#" | "@", query: string) => {
  isDropdownLoading.value = true;
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    console.error("Search error:", error);
    dropdownItems.value = [];
  } finally {
    isDropdownLoading.value = false;
  }
}, 300);

async function searchTags(type: "#" | "@", query: string) {
  debouncedSearchTags(type, query);
}

async function searchTagsImmediate(type: "#" | "@", query: string) {
  isDropdownLoading.value = true;
  try {
    if (type === "#") {
      const res = await api.searchTopic({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.name,
        value: item.name,
        views: item.view_count,
        id: item.id
      }));
    } else {
      const res = await api.searchUser({ keyword: query });
      dropdownItems.value = (res.data || []).map((item: any) => ({
        label: item.nickname,
        value: item.nickname,
        avatar: item.avatar,
        followers: item.follower_count,
        id: item.id
      }));
    }
  } catch (error) {
    console.error("Search error:", error);
    dropdownItems.value = [];
  } finally {
    isDropdownLoading.value = false;
  }
}

function handleCaptionClick() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);

  // 检查是否在 span 标签内（已选中的话题/提及标签）
  let node: Node | null = range.startContainer;
  let inSpan = false;
  while (node && node !== captionRef.value) {
    if (node.nodeName === 'SPAN') {
      inSpan = true;
      break;
    }
    node = node.parentNode;
  }
  if (inSpan) {
    showDropdown.value = false;
    return;
  }

  const textBefore = range.startContainer.textContent?.substring(0, range.startOffset) || "";

  // 只有光标紧跟在 # 或 @ 后面才显示下拉框
  // 检查 textBefore 是否以 # 或 @ 结尾
  if (textBefore.endsWith('#') || textBefore.endsWith('@')) {
    const trigger = textBefore.endsWith('#') ? '#' : '@';
    const query = '';
    dropdownType.value = trigger;
    isOpeningDropdown.value = true;
    showDropdown.value = true;
    lastRange.value = range.cloneRange();
    updateDropdownPosition();
    searchTags(trigger, query);
    setTimeout(() => {
      isOpeningDropdown.value = false;
    }, 100);
  } else {
    showDropdown.value = false;
  }
}

function handleCompositionStart() {
  isComposingText.value = true;
  showDropdown.value = false;
}

function handleCompositionEnd(e: CompositionEvent) {
  isComposingText.value = false;
  handleCaptionInput(e as unknown as Event);
}

function resolveCaretPosition(range: Range): { node: Node; offset: number } | null {
  let node: Node = range.startContainer;
  let offset = range.startOffset;

  if (node.nodeType === Node.TEXT_NODE) {
    return { node, offset };
  }

  while (node.nodeType === Node.ELEMENT_NODE) {
    if (offset <= 0) return null;
    const child: Node | undefined = node.childNodes[offset - 1];
    if (!child) return null;
    if (child.nodeType === Node.TEXT_NODE) {
      const len = (child.textContent || "").length;
      if (len === 0) {
        offset -= 1;
        continue;
      }
      return { node: child, offset: len };
    }
    return null;
  }
  return null;
}

function handleCaptionKeydown(e: KeyboardEvent) {
  if (isComposingText.value || e.isComposing || e.keyCode === 229) return;

  if (e.key === " " || e.key === "Spacebar") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Protect existing tag spans: if cursor is right after a contentEditable=false span,
    // prevent default and manually insert the space to avoid browser destroying the span
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === 'SPAN') {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            node.textContent = '\u0020' + (node.textContent || '');
            const newRange = document.createRange();
            newRange.setStart(node, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
      if (node === captionRef.value && range.startOffset > 0) {
        const child = node.childNodes[range.startOffset - 1];
        if (child?.nodeName === 'SPAN') {
          const span = child as HTMLElement;
          if (span.classList.contains('tag')) {
            e.preventDefault();
            const space = document.createTextNode('\u0020');
            node.insertBefore(space, node.childNodes[range.startOffset] || null);
            const newRange = document.createRange();
            newRange.setStart(space, 1);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            updateCaptionStats();
            return;
          }
        }
      }
    }

    const caretPos = resolveCaretPosition(range);
    const textNode = caretPos ? caretPos.node : range.startContainer;
    const caretOffset = caretPos ? caretPos.offset : range.startOffset;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const textBefore = textNode.textContent?.substring(0, caretOffset) || "";

      // #  + letters / digits / CJK (any length, no symbols, no spaces)
      const hashMatch = textBefore.match(/#([\p{L}\p{N}\p{M}_]+)$/u);

      if (hashMatch) {
        const tagContent = hashMatch[1];
        const hasChineseChars = /[\u4e00-\u9fa5]/.test(tagContent);
        const hasSpaces = tagContent.includes(" ");
        const hasApostrophes = tagContent.includes("'") || tagContent.includes('"');

        if (hasApostrophes) {
          return;
        } else if (hasChineseChars || hasSpaces) {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              toast(t('submit.video.toastTopicLimit'));
              return;
            }
          }

          const fullMatch = "#" + tagContent.trim();
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (caretOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          if (newLength > props.maxLength) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, caretOffset);

          tagRange.deleteContents();

          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";

          tagRange.insertNode(span);

          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          tagRange.setStart(space, 1);
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          showDropdown.value = false;

          updateCaptionStats();
          return;
        } else {
          if (captionRef.value) {
            const existingTopicTags = captionRef.value.querySelectorAll('.tag.topic');
            if (existingTopicTags.length >= 5) {
              e.preventDefault();
              toast(t('submit.video.toastTopicLimit'));
              return;
            }
          }

          const fullMatch = hashMatch[0];
          const currentText = captionRef.value?.innerText || "";
          const currentLength = currentText.length;
          const spaceText = " ";
          const newLength = currentLength - (caretOffset - hashMatch.index!) + fullMatch.length + spaceText.length;

          if (newLength > props.maxLength) {
            e.preventDefault();
            return;
          }

          e.preventDefault();

          const matchStartIndex = hashMatch.index!;

          const tagRange = document.createRange();
          tagRange.setStart(textNode, matchStartIndex);
          tagRange.setEnd(textNode, caretOffset);

          tagRange.deleteContents();

          const span = document.createElement("span");
          span.className = "tag topic";
          span.contentEditable = "false";
          span.textContent = fullMatch;
          span.style.color = "#00d3f2";

          tagRange.insertNode(span);

          const space = document.createTextNode("\u0020");
          tagRange.setStartAfter(span);
          tagRange.insertNode(space);

          tagRange.setStart(space, 1);
          tagRange.collapse(true);

          selection.removeAllRanges();
          selection.addRange(tagRange);

          showDropdown.value = false;

          updateCaptionStats();
          return;
        }
      }
    }
  }

  if (e.key === "Backspace") {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      const node = range.startContainer;
      const offset = range.startOffset;

      if (node.nodeType === Node.TEXT_NODE && offset > 0) {
        const charBefore = node.textContent?.[offset - 1];

        if (charBefore === "\u0020" || charBefore === " ") {
          if (offset === 1 && node.previousSibling?.nodeName === "SPAN") {
            const span = node.previousSibling as HTMLElement;
            if (span.classList.contains("tag")) {
              return;
            }
          }
        }
      }

      if (offset === 0 && node.previousSibling?.nodeName === "SPAN") {
        const span = node.previousSibling as HTMLElement;
        if (span.classList.contains("tag")) {
          e.preventDefault();
          span.remove();
          showDropdown.value = false;
          updateCaptionStats();
          return;
        }
      }

      if (node.nodeType === Node.TEXT_NODE && offset === 0) {
        const prevSibling = node.previousSibling;
        if (prevSibling?.nodeName === "SPAN") {
          const span = prevSibling as HTMLElement;
          if (span.classList.contains("tag")) {
            e.preventDefault();
            span.remove();
            showDropdown.value = false;
            updateCaptionStats();
            return;
          }
        }
      }
    }
  }
}

function scrollCaptionToCursor() {
  if (!captionRef.value) return;

  const el = captionRef.value;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const tmp = document.createElement('span');
  tmp.textContent = '\u200b';
  range.insertNode(tmp);
  const top = tmp.offsetTop;
  const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
  tmp.parentNode?.removeChild(tmp);
  el.normalize();
  if (top + lineHeight > el.scrollTop + el.clientHeight) {
    el.scrollTop = top + lineHeight - el.clientHeight;
  }
}

function updateCaptionStats() {
  if (captionRef.value) {
    const text = captionRef.value.innerText || "";
    captionLength.value = text.replace(/\n$/, "").length;
  }
}

function onCaptionBlur() {
  if (captionRef.value) {
    form.value.description = captionRef.value.innerText;
  }
}

function updateDropdownPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !captionRef.value) return;

  const range = selection.getRangeAt(0).cloneRange();

  let rect: DOMRect;
  if (range.collapsed) {
    const marker = document.createElement('span');
    marker.textContent = '\u200B';
    range.insertNode(marker);
    rect = marker.getBoundingClientRect();
    marker.parentNode?.removeChild(marker);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  } else {
    rect = range.getBoundingClientRect();
  }

  let absTop = rect.bottom + 5;
  let absLeft = rect.left;

  if ((rect.width === 0 && rect.height === 0) || absTop < 100 || absLeft < 10) {
    const captionRect = captionRef.value.getBoundingClientRect();
    absTop = captionRect.top + 26;
    absLeft = captionRect.left;
  }

  const dropdownHeight = 250;
  const dropdownWidth = 280;

  // 处理底部溢出
  if (absTop + dropdownHeight > window.innerHeight) {
    const spaceAbove = rect.top;
    if (spaceAbove >= dropdownHeight) {
      dropdownPosition.value = {
        top: 0,
        position: 'above',
        bottom: window.innerHeight - rect.top + 5,
        left: absLeft + 2,
      };
    } else {
      dropdownPosition.value = {
        top: 50,
        left: absLeft + 2,
      };
    }
  } else {
    dropdownPosition.value = {
      top: absTop,
      left: absLeft + 2,
    };
  }

  // 处理右边溢出，使用 right 属性定位
  if (absLeft + dropdownWidth > window.innerWidth) {
    dropdownPosition.value.left = undefined;
    dropdownPosition.value.right = 10;
  }
}

function getDropdownStyle(): Record<string, string> {
  const style: Record<string, string> = {};

  if (dropdownPosition.value.position === 'above') {
    style.bottom = `${dropdownPosition.value.bottom}px`;
  } else {
    style.top = `${dropdownPosition.value.top}px`;
  }

  if (dropdownPosition.value.right !== undefined) {
    style.right = `${dropdownPosition.value.right}px`;
  } else if (dropdownPosition.value.left !== undefined) {
    style.left = `${dropdownPosition.value.left}px`;
  }

  return style;
}

function onActionBtnClick(symbol: "#" | "@") {
  if (!captionRef.value) return;
  captionRef.value.focus();

  const selection = window.getSelection();
  if (!selection) return;

  let range: Range;
  if (selection.rangeCount > 0) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(captionRef.value);
    range.collapse(false);
  }

  range.deleteContents();

  const textNode = document.createTextNode(symbol);
  range.insertNode(textNode);

  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  const insertedNode = textNode;

  dropdownType.value = symbol;

  nextTick(async () => {
    await searchTagsImmediate(symbol, "");

    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.rangeCount === 0) return;

    const currentRange = currentSelection.getRangeAt(0);
    lastRange.value = currentRange.cloneRange();

    const symbolRange = document.createRange();
    symbolRange.selectNodeContents(insertedNode);
    const rect = symbolRange.getBoundingClientRect();

    const captionRect = captionRef.value?.getBoundingClientRect();

    let absTop = rect.bottom + 5;
    let absLeft = rect.left;

    if ((rect.width === 0 && rect.height === 0) || !captionRect || absTop < 100 || absLeft < 10) {
      if (captionRect) {
        absTop = captionRect.top + 26;
        absLeft = captionRect.left;
      }
    }

    dropdownPosition.value = {
      top: absTop,
      left: absLeft,
    };

    const dropdownHeight = 250;
    if (absTop + dropdownHeight > window.innerHeight) {
      dropdownPosition.value.top = rect.top - dropdownHeight - 5;
    }

    showDropdown.value = true;
    captionRef.value?.focus();
  });
}

function selectDropdownItem(item: { label: string; value: string }) {
  if (!lastRange.value || !captionRef.value) return;

  const selection = window.getSelection();
  if (!selection) return;

  if (dropdownType.value === "#") {
    const topicCount = captionRef.value.querySelectorAll(".tag.topic").length;
    if (topicCount >= 5) {
      toast(t("submit.video.toastTopicLimit"));
      showDropdown.value = false;
      return;
    }
  }

  const currentText = captionRef.value.innerText || "";
  const currentLength = currentText.length;
  const tagText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  const spaceText = " ";
  const newLength = currentLength + tagText.length + spaceText.length;

  if (newLength > props.maxLength) {
    showDropdown.value = false;
    return;
  }

  const range = lastRange.value;
  const caretPos = resolveCaretPosition(range);
  const textNode = caretPos ? caretPos.node : range.startContainer;
  const offset = caretPos ? caretPos.offset : range.startOffset;
  const textContent = textNode.textContent || "";
  const textBefore = textContent.substring(0, offset);
  const match = textBefore.match(/([#@])([^#@\s]*)$/);

  if (match) {
    const triggerIndex = match.index!;
    range.setStart(textNode, triggerIndex);
    range.setEnd(textNode, offset);
    range.deleteContents();
  }

  const span = document.createElement("span");
  span.className = `tag ${dropdownType.value === "#" ? "topic" : "mention"}`;
  span.contentEditable = "false";
  span.innerText = dropdownType.value === "#" ? "#" + item.label : "@" + item.label;
  span.style.color = "#00d3f2";

  range.insertNode(span);

  const space = document.createTextNode("\u0020");
  range.setStartAfter(span);
  range.insertNode(space);
  range.setStartAfter(space);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);

  showDropdown.value = false;
  updateCaptionStats();
  captionRef.value.focus();
}

/** 往外给的描述：@提及 前面保证有空格（和发布页提交前做的处理一致） */
function normalizedDescription(): string {
  let processed = form.value.description || '';
  const el = captionRef.value;
  if (el) {
    el.querySelectorAll('.tag.mention').forEach((span) => {
      const spanText = span.textContent || '';
      if (spanText.startsWith('@')) {
        const username = spanText.substring(1);
        const regex = new RegExp(`(^|[^\\s])@${username}`, 'g');
        processed = processed.replace(regex, (_m, prefix) => `${prefix} @${username}`);
      }
    });
  }
  return processed;
}

watch(() => form.value.description, () => {
  emit('update:modelValue', normalizedDescription());
});
watch(captionLength, (n) => emit('update:length', n));

// 外面把值改了（比如重置）再同步回编辑框；自己打字触发的更新不重复渲染
watch(() => props.modelValue, (v) => {
  if ((v || '') === (form.value.description || '')) return;
  form.value.description = v || '';
  renderCaptionContent();
  captionLength.value = (captionRef.value?.innerText || '').length;
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  if (isOpeningDropdown.value) return;
  if (showDropdown.value &&
      !document.querySelector('.mention-dropdown')?.contains(target) &&
      !captionRef.value?.contains(target)) {
    showDropdown.value = false;
  }
}

onMounted(() => {
  if (form.value.description) {
    renderCaptionContent();
    captionLength.value = (captionRef.value?.innerText || '').length;
  }
  document.addEventListener('click', handleClickOutside);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
/* 样式从 Video.scss 里描述框 / 话题提及下拉那几块抠出来的，发布页改了这里要跟着改 */
.caption-editor {
  .desc-input-wrap {
    padding: 10px;
    margin-top: 12px;
    border: 1px solid #3d3d3d;
    border-radius: 14px;
    background: #1a1a1a;
    box-shadow: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus-within {
      border-color: #ff4f9a;
      box-shadow: none;
    }
  }

  .description-content {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #ddd;

    &::placeholder {
      color: #ddd;
      opacity: 0.4;
    }
  }

  .description-content {
    height: 90px;
    padding-bottom: 14px;
    word-break: normal;
    white-space: pre-wrap;
    overflow-y: auto;

    &:focus {
      outline: none;
    }

    &[contenteditable="true"]:empty:before {
      content: attr(placeholder);
      color: #ddd;
      opacity: 0.4;
      pointer-events: none;
      display: block;
    }

    :deep(.tag) {
      color: #00d3f2;
      margin-right: 4px;
      user-select: none;
    }
  }

  .caption-actions-box {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 14px;

    .char-count {
      font-size: 12px;
      font-weight: 600;
      color: #ddd;
      opacity: 0.45;
    }
  }

  .caption-actions {
    display: flex;
    gap: 12px;

    .action-btn {
      padding: 7px 16px;
      border-radius: 11px;
      border: 1px solid #3d3d3d;
      background: #1a1a1a;
      color: #ddd;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: none;
    }
  }

  .mention-dropdown {
    position: fixed;
    width: 480px;
    background: #1a1a1a;
    border: 1px solid #2c2c2c;
    border-radius: 14px;
    box-shadow: none;
    z-index: 10000;
    overflow: hidden;

    .dropdown-list {
      max-height: 240px;
      padding: 8px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 11px 12px;
      min-height: 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      border-radius: 11px;
      transition: background 0.15s;

      &:hover {
        background: rgba(255,79,154,0.12);
      }

      .item-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #3d3d3d;
          object-fit: cover;
        }

        .label {
          font-size: 14px;
          font-weight: 700;
          color: #ddd;
        }
      }

      .item-right {
        .stats {
          font-size: 12px;
          color: #ddd;
          opacity: 0.4;
        }
      }
    }

    .dropdown-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 30px 12px;
      font-size: 12px;
      font-weight: 700;
      color: #ddd;
      opacity: 0.55;

      .loading-spinner {
        width: 24px;
        height: 24px;
        border: 3px solid #2c2c2c;
        border-top: 1px solid #2c2c2c;
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
