<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { newTask } from '~/logic/task'
import { onNewTask } from '@/logic/task'
import Response from '~/components/ai/Response/Response.vue'
import ProviderPicker from '~/components/common/ProviderPicker/ProviderPicker.vue'
import { useExplainChat, type Message } from '~/logic/explain'
import { defaultModel, llmProviders } from '~/logic/storage'
import { routeToTakingNote } from '~/entrypoints/sidepanel/router'

const initialQuery = ref<string>('')
const tabId = ref<number>()
const followUpInput = ref<string>('')

// Chat state
const messages = ref<Message[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const selectedModel = ref(defaultModel.value)

const explainChat = computed(() => {
  return useExplainChat({
    modelString: selectedModel.value,
    providers: llmProviders.value,
    onUpdate: (update) => {
      if (update.messages !== undefined) messages.value = update.messages
      if (update.isLoading !== undefined) isLoading.value = update.isLoading
      if (update.error !== undefined) errorMessage.value = update.error
    },
    onError: (error) => {
      console.error('Chat error:', error)
    },
    onFinish() {
      // Clear input after successful send
      followUpInput.value = ''
    },
  })
})

const startExplanation = async () => {
  try {
    if (!initialQuery.value) {
      throw new Error('Nothing to explain')
    }
    await explainChat.value.sendMessage(initialQuery.value, tabId.value)
  } catch (error) {
    console.error('Error starting explanation:', error)
  }
}

const sendFollowUp = async () => {
  const message = followUpInput.value.trim()
  if (!message || isLoading.value) return

  try {
    await explainChat.value.sendMessage(message)
  } catch (error) {
    console.error('Error sending follow-up:', error)
  }
}

const stopExplanation = () => {
  explainChat.value.stop()
}

const retryExplanation = () => {
  if (initialQuery.value) {
    explainChat.value.reset()
    startExplanation()
  }
}

const saveConversation = async () => {
  // Convert all messages to a formatted text
  const conversationText = messages.value
    .map((msg) => `**${msg.role === 'user' ? 'Question' : 'Answer'}:**\n${msg.content}`)
    .join('\n\n---\n\n')

  await newTask({
    type: 'taking-note',
    parameters: { text: conversationText },
    from: 'sidepanel',
  })
  routeToTakingNote()
}

const saveQuery = (event: Event) => {
  const newText = (event.target as HTMLElement).innerText.trim()
  initialQuery.value = newText
  if (newText && messages.value.length === 0) {
    startExplanation()
  }
}

const handleFollowUpKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendFollowUp()
  }
}

watch(initialQuery, (newQuery) => {
  if (newQuery && messages.value.length === 0) {
    startExplanation()
  }
})

watch(selectedModel, () => {
  if (initialQuery.value && messages.value.length === 0) {
    startExplanation()
  }
})

watch(
  defaultModel,
  (value) => {
    selectedModel.value = value
  },
  { immediate: true }
)

onNewTask('explain', (task) => {
  initialQuery.value = task.parameters.selectedText
  tabId.value = task.sender.tabId
})
</script>

<template>
  <div class="explain-container">
    <header class="explain-header">
      <h1 class="explain-title">
        解释
        <span
          contenteditable
          @blur="saveQuery"
          @keydown.enter.prevent="saveQuery"
          class="editable-text"
          >{{ initialQuery }}</span
        >
      </h1>
      <!-- Model selector -->
      <ProviderPicker v-model="selectedModel" />
    </header>
    <main class="explain-content">
      <div v-if="errorMessage" class="error-message">
        <p>{{ errorMessage }}</p>
        <p v-if="!llmProviders.some((p) => p.apiKey)" class="config-hint">
          请在扩展选项中配置至少一个 LLM 提供商的 API Key。
        </p>
      </div>

      <!-- Conversation Display -->
      <div class="conversation">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', `message-${message.role}`]"
        >
          <div class="message-role">
            {{ message.role === 'user' ? '问题' : '回答' }}
          </div>
          <div class="message-content">
            <Response :content="message.content" />
          </div>
        </div>

        <!-- Loading indicator for streaming message -->
        <div v-if="isLoading" class="message message-assistant">
          <div class="message-role">回答</div>
          <div class="message-content">
            <Response content="" :is-loading="true" />
          </div>
        </div>
      </div>

      <!-- Action buttons for initial conversation -->
      <div v-if="messages.length > 0" class="action-buttons">
        <span class="provider-info">{{ selectedModel }}</span>
        <button
          v-if="isLoading"
          @click="stopExplanation"
          class="stop-button"
          title="Stop generation"
        >
          <i class="i-mdi-stop"></i>
        </button>
        <button
          v-if="initialQuery && !isLoading"
          @click="retryExplanation"
          class="retry-button"
          title="Retry"
        >
          <i class="i-mdi-refresh"></i>
        </button>
        <button
          v-if="messages.length > 0 && !isLoading"
          @click="saveConversation"
          class="save-button"
        >
          保存对话
        </button>
      </div>

      <!-- Follow-up input -->
      <div v-if="messages.length > 0" class="follow-up-container">
        <textarea
          v-model="followUpInput"
          @keydown="handleFollowUpKeydown"
          placeholder="继续追问..."
          class="follow-up-input"
          :disabled="isLoading"
          rows="2"
        ></textarea>
        <button
          @click="sendFollowUp"
          :disabled="!followUpInput.trim() || isLoading"
          class="send-button"
        >
          <i class="i-mdi-send"></i>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss" src="./Explain.scss"></style>
