<template>
  <div class="p-6 bg-white rounded-lg shadow border border-gray-200 max-h-[80vh] flex flex-col">
    <div class="flex justify-between items-center mb-5 pb-2.5 border-b border-gray-200">
      <h2 class="text-2xl text-gray-800">Claude Chat with MCP Tools</h2>
      <button @click="clearChat" class="px-4 py-2 bg-rose-100 hover:bg-rose-200 border border-rose-400 rounded text-rose-700 transition-colors">
        Clear Chat
      </button>
    </div>

    <div class="flex-1 gap-2 overflow-y-auto overflow-x-hidden py-2.5 border border-gray-300 rounded bg-gray-50" ref="messagesContainer">
      <div v-if="chatStore.messages.length === 0" class="text-center text-gray-500 py-10 px-5 italic">
        Start a conversation with Claude. Your MCP tools will be available automatically when connected.
      </div>
      
      <div 
        v-for="message in chatStore.messages" 
        :key="message.id"
        :class="[
          'mx-2.5 p-4 rounded-lg max-w-[80%] break-words mb-2',
          message.role === 'user' 
            ? 'bg-blue-100 border border-blue-300 text-black ml-auto mr-2.5'
            : 'bg-white border border-gray-300 mr-auto ml-2.5'
        ]"
      >
        <div class="flex justify-between items-center mb-2 text-xs opacity-80">
          <span class="font-semibold">{{ message.role === 'user' ? 'You' : 'Claude' }}</span>
          <span class="text-[11px]">{{ formatTime(message.timestamp) }}</span>
        </div>
        
        <div>
          <pre v-if="message.role === 'assistant'" class="m-0 whitespace-pre-wrap break-words max-w-full font-inherit">{{ message.content }}</pre>
          <p v-else class="m-0">{{ message.content }}</p>
        </div>

        <div v-if="message.tools && message.tools.length > 0" class="mt-4 pt-4 border-t border-gray-200">
          <h4 class="m-0 mb-2.5 text-gray-500 text-sm">Tool Calls:</h4>
          <div 
            v-for="(tool, index) in message.tools" 
            :key="index"
            class="rounded mb-2.5 font-mono"
          >
            <strong class="block mb-1 text-blue-600">{{ tool.name }}</strong>
            <pre class="my-1 text-xs border border-gray-200 rounded whitespace-pre-wrap break-words max-w-full"><code class="language-json" v-html="highlightCode(JSON.stringify(tool.arguments, null, 2))"></code></pre>
            <div v-if="tool.result" class="mt-2.5 pt-2.5">
              <strong class="block mb-1 text-blue-600">Result:</strong>
              <pre class="my-1 text-xs border border-gray-200 rounded whitespace-pre-wrap break-words max-w-full"><code class="language-json" v-html="highlightCode(JSON.stringify(tool.result, null, 2))"></code></pre>
            </div>
          </div>
        </div>
      </div>

      <div v-if="chatStore.isLoading" class="mx-2.5 p-4 rounded-lg max-w-[80%] break-words bg-gray-100 mr-auto ml-2.5">
        <div class="flex justify-between items-center mb-2 text-xs opacity-80">
          <span class="font-semibold">Claude</span>
        </div>
        <div>
          <div class="flex gap-1 items-center">
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style="animation-delay: -0.32s;"></span>
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style="animation-delay: -0.16s;"></span>
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-5">
      <div v-if="chatStore.error" class="mb-2 p-2 bg-red-100 text-red-700 rounded">
        {{ chatStore.error }}
      </div>
      
      <div class="flex gap-2.5 items-end">
        <textarea 
          v-model="newMessage"
          @keydown="handleKeyDown"
          class="flex-1 resize-none p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type your message... (Shift+Enter for new line, Enter to send)"
          rows="3"
        ></textarea>
        
        <button 
          @click="sendMessage"
          class="px-5 py-2.5 bg-blue-100 border border-blue-400 text-blue-700 rounded hover:bg-blue-200 transition-colors h-fit"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useChatStore } from '../stores/chat'
import { useMcpStore } from '../stores/mcp'
import { sendChatMessage } from '../services/chatService'
import { useHighlight } from '../composables/useHighlight'

const chatStore = useChatStore()
const mcpStore = useMcpStore()
const { highlightCode } = useHighlight()

const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()

const canSendMessage = computed(() => 
  newMessage.value.trim() !== '' && 
  !chatStore.isLoading &&
  mcpStore.settings.anthropicApiKey.trim() !== ''
)

function formatTime(date: Date): string {
  return date.toLocaleTimeString()
}

async function sendMessage() {
  if (!canSendMessage.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''

  // Add user message
  chatStore.addMessage({
    role: 'user',
    content
  })

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Send to Claude
  await sendChatMessage(content)
  
  // Scroll to bottom again after response
  await nextTick()
  scrollToBottom()
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

function clearChat() {
  chatStore.clearMessages()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
})
</script>


