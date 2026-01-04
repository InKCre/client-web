<template>
    <div v-if="show" class="writing-assist-container">
        <div v-show="showPanel" class="writing-assist-panel">
            <div class="panel-header">
                <span>写作建议：</span>
            </div>
            <div class="suggestions-list" v-if="suggestions.length > 0">
                <Suggestion
                    v-for="(suggestion, index) in suggestions"
                    :key="index"
                    :original="suggestion.original"
                    :replacement="suggestion.replacement"
                    @apply="applySuggestion"
                    @copied="displayToast"
                />
            </div>
            <div v-else-if="isLoading" class="loading-state">加载中...</div>
            <div v-else class="empty-state">无建议</div>
        </div>
        <div class="control-bar">
            <Transition name="toast">
                <div v-if="showToast" class="toast-message">复制成功</div>
            </Transition>
            <div class="toggle-button" @click="showPanel = !showPanel">
                <img :src="logo" alt="Logo" class="logo-icon" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Block } from "@/logic/info-base/block";
import logo from "~/assets/inkcre.svg";
import { Root } from "~/logic/info-base/root";
import { DEFAULT_STOPWORDS, stopwords, stopwordsReady } from "~/logic/storage";
import Suggestion from "../Suggestion.vue";

const show = ref(false);
const showPanel = ref(false);
const showToast = ref(false);
const suggestions = ref<{ original: string; replacement: string }[]>([]);
const isLoading = ref(false);
const currentElement = ref<HTMLElement | null>(null);
const debounceTimer = ref<NodeJS.Timeout | null>(null);

interface ReplacableUnit {
  unit: string; // word or phrase
  sentence: string; // full sentence containing the unit
}

const displayToast = () => {
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 2000);
};

const cleanText = (text: string): string => {
  // 移除HTML标签（以防万一）
  text = text.replace(/<[^>]*>/g, "");
  // 移除多余空格和换行
  text = text.replace(/\s+/g, " ").trim();
  // 移除URL
  text = text.replace(/https?:\/\/[^\s]+/g, "");
  // 移除非自然语言字符，保留英文、数字、基本标点
  text = text.replace(/[^\w\s.,!?;:''""()]/g, "");
  return text;
};

const loadStopwords = async (): Promise<string[]> => {
  // Wait for storage to be ready
  await stopwordsReady;

  // Return stored stopwords if available
  if (Array.isArray(stopwords.value) && stopwords.value.length > 0) {
    return stopwords.value.map((w: string) => w.toLowerCase());
  }

  // Fallback: try to load from network
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/stopwords-iso/stopwords-en/master/stopwords-en.json",
    );
    if (!response.ok) throw new Error("Failed to load stopwords");
    const data = await response.json();

    // Normalize to lowercase
    const normalizedData = data.map((w: string) => w.toLowerCase());

    // Save downloaded stopwords to storage for future use
    stopwords.value = normalizedData;

    return normalizedData;
  } catch (error) {
    console.warn(
      "Failed to load stopwords from network, using default list:",
      error,
    );
    // Default stopwords list as final fallback, ensure lowercase
    return DEFAULT_STOPWORDS.map((w: string) => w.toLowerCase());
  }
};

const getReplacableUnits = async (text: string): Promise<ReplacableUnit[]> => {
  if (!text.trim()) return [];
  const stopWords = await loadStopwords();
  const stopWordsSet = new Set(stopWords);
  const sentences = text.split(/[.!?]/).filter((s) => s.trim());
  const units: ReplacableUnit[] = [];
  for (const sentence of sentences) {
    const words = sentence.match(/\b\w+\b/g) || [];
    const seenWords = new Set<string>();
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (
        word.length > 1 &&
        !stopWordsSet.has(word.toLowerCase()) &&
        !seenWords.has(word.toLowerCase())
      ) {
        // 排除专有名词：如果不是句子第一个单词，且首字母大写，则跳过
        if (i > 0 && word[0] === word[0].toUpperCase()) {
          continue;
        }
        seenWords.add(word.toLowerCase());
        units.push({ unit: word, sentence });
      }
    }
  }
  return units;
};

const fetchSuggestions = async () => {
  suggestions.value = [];
  if (!currentElement.value) return;
  const text = cleanText(getTextFromElement(currentElement.value));
  const units = await getReplacableUnits(text);

  isLoading.value = true;
  try {
    for (const unit of units) {
      // find replacement for each unit
      const replacements = await Block.vectorSearch({
        query: unit.unit,
        resolver: "learn_english.lexical",
      });
      if (replacements.length === 0) continue;
      suggestions.value.push({
        original: unit.unit,
        replacement: JSON.parse(replacements[0].content).text,
      });
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  } finally {
    isLoading.value = false;
  }
};

const applySuggestion = (suggestion: string) => {
  if (currentElement.value) {
    setTextToElement(currentElement.value, suggestion);
  }
};

const getTextFromElement = (element: HTMLElement): string => {
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    return (element as HTMLInputElement | HTMLTextAreaElement).value;
  } else if (element.contentEditable === "true") {
    return element.innerText;
  }
  return "";
};

const setTextToElement = (element: HTMLElement, text: string) => {
  if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
    (element as HTMLInputElement | HTMLTextAreaElement).value = text;
  } else if (element.contentEditable === "true") {
    element.innerText = text;
  }
};

const isEditable = (element: HTMLElement): boolean => {
  return (
    (element.tagName === "INPUT" &&
      (element as HTMLInputElement).type === "text") ||
    element.tagName === "TEXTAREA" ||
    element.contentEditable === "true"
  );
};

const handleFocusIn = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (isEditable(target)) {
    // 清除现有定时器
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
      debounceTimer.value = null;
    }
    show.value = true;
    currentElement.value = target;
  }
};

const handleFocusOut = (event: FocusEvent) => {
  const target = event.target as HTMLElement;
  if (currentElement.value === target) {
    // 失焦时立即触发建议
    fetchSuggestions();
  }
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLElement;
  if (currentElement.value === target && isEditable(target)) {
    // 清除现有定时器
    if (debounceTimer.value) {
      clearTimeout(debounceTimer.value);
    }
    // 设置新定时器
    debounceTimer.value = setTimeout(() => {
      fetchSuggestions();
    }, 5000);
  }
};

onMounted(() => {
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", handleFocusOut);
  document.addEventListener("input", handleInput);
});

onUnmounted(() => {
  document.removeEventListener("focusin", handleFocusIn);
  document.removeEventListener("focusout", handleFocusOut);
  document.removeEventListener("input", handleInput);
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value);
  }
});
</script>

<style scoped lang="scss" src="./WritingAssist.scss"></style>
