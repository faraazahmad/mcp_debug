<template>
  <div class="h-full flex flex-col">
    <div v-if="!mcpStore.hasTools && mcpStore.isConnected" class="text-center py-10 text-gray-600 text-base">
      No tools available
    </div>
    
    <div v-else-if="!mcpStore.isConnected" class="text-center py-10 text-gray-600 text-base">
      Connect to MCP server to see available tools
    </div>

    <div v-else class="flex overflow-hidden bg-white h-full">
      <!-- Column 1: Tools List -->
      <div class="flex flex-col border-r border-gray-300 w-75 min-w-60">
        <div class="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-300 font-semibold">
          <h3 class="m-0 text-base text-gray-800">Tools</h3>
          <span class="bg-blue-500 text-white px-2 py-0.5 rounded-xl text-xs font-medium">{{ mcpStore.tools.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div 
            v-for="tool in mcpStore.tools" 
            :key="tool.name"
            class="px-5 py-3 border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
            :class="{ 'bg-blue-50 border-r-4 border-r-blue-500': selectedTool?.name === tool.name }"
            @click="selectTool(tool)"
          >
            <div class="font-mono font-semibold text-gray-800 text-sm">{{ tool.name }}</div>
            <div class="text-xs text-gray-600 mt-1 leading-tight" v-if="tool.description">{{ tool.description }}</div>
          </div>
        </div>
      </div>

      <!-- Column 2: Schema & Input -->
      <div class="flex flex-col border-r border-gray-300 flex-1 min-w-96">
        <div class="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-300 font-semibold">
          <h3 class="m-0 text-base text-gray-800">{{ selectedTool ? selectedTool.name : 'Select a tool' }}</h3>
        </div>
        <div v-if="selectedTool" class="flex-1 p-5 overflow-y-auto">
          <h4 class="m-0 mb-2.5 text-sm font-semibold text-gray-800 uppercase tracking-wide">Description</h4>
          <div class="text-gray-600 mb-5 p-3 bg-gray-50 rounded-md border border-gray-200" v-if="selectedTool.description">
            {{ selectedTool.description }}
          </div>
          
          <div class="mb-6">
            <h4 class="m-0 mb-2.5 text-sm font-semibold text-gray-800 uppercase tracking-wide">Schema</h4>
            <pre class="bg-gray-50 border border-gray-300 rounded-md p-4 text-xs overflow-x-auto max-h-72 overflow-y-auto"><code class="language-json" v-html="highlightCode(JSON.stringify(selectedTool.inputSchema, null, 2))"></code></pre>
          </div>

          <div class="mb-6">
            <h4 class="m-0 mb-2.5 text-sm font-semibold text-gray-800 uppercase tracking-wide">Request Body</h4>
            <textarea 
              v-model="toolArgs" 
              class="w-full min-h-30 p-4 border border-gray-300 rounded-md font-mono text-sm resize-y bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder='{"parameter": "value"}'
            ></textarea>
            
            <div class="mt-4 flex gap-3">
              <button 
                @click="generateRequestBody" 
                class="bg-gray-500 text-white border-0 px-4 py-2.5 rounded-md font-semibold cursor-pointer transition-colors duration-200 hover:bg-gray-600"
              >
                Generate
              </button>
              <button 
                @click="executeTool" 
                class="bg-blue-500 text-white border-0 px-6 py-2.5 rounded-md font-semibold cursor-pointer transition-colors duration-200 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                :disabled="isExecuting"
              >
                {{ isExecuting ? 'Executing...' : 'Send' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="flex-1 flex items-center justify-center text-gray-600 italic text-center p-10">
          Select a tool from the left panel to view its schema and test it
        </div>
      </div>

      <!-- Column 3: Response -->
      <div class="flex flex-col w-96 min-w-80">
        <div class="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-300 font-semibold">
          <h3 class="m-0 text-base text-gray-800">Response</h3>
          <span v-if="responseTime" class="bg-green-500 text-white px-2 py-0.5 rounded-xl text-xs font-medium">{{ responseTime }}ms</span>
        </div>
        <div class="flex-1 p-5 overflow-y-auto">
          <div v-if="toolResult" class="h-full">
            <pre class="bg-gray-50 border border-gray-300 rounded-md p-4 text-xs text-wrap overflow-y-auto h-full"><code class="language-json" v-html="highlightCode(JSON.stringify(toolResult, null, 2))"></code></pre>
          </div>

          <div v-else-if="toolError" class="h-full">
            <div class="px-3 py-1.5 rounded text-xs font-semibold mb-4 inline-block bg-red-100 text-red-800 border border-red-200">Error</div>
            <div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-800 font-mono text-sm">{{ toolError }}</div>
          </div>

          <div v-else-if="!selectedTool" class="flex-1 flex items-center justify-center text-gray-600 italic text-center p-10">
            Select a tool and execute it to see the response
          </div>

          <div v-else class="flex-1 flex items-center justify-center text-gray-600 italic text-center p-10">
            Click "Send" to execute the tool
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMcpStore } from '../stores/mcp'
import { callTool } from '../services/mcpClient'
import type { McpTool } from '../types'
import { useHighlight } from '../composables/useHighlight'

const mcpStore = useMcpStore()
const { highlightCode } = useHighlight()

const selectedTool = ref<McpTool | null>(null)
const toolArgs = ref('')
const toolResult = ref<any>(null)
const toolError = ref<string | null>(null)
const isExecuting = ref(false)
const responseTime = ref<number | null>(null)

function selectTool(tool: McpTool) {
  selectedTool.value = tool
  toolArgs.value = ''
  toolResult.value = null
  toolError.value = null
  responseTime.value = null
}

function generateRequestBody() {
  if (!selectedTool.value?.inputSchema) return
  
  const schema = selectedTool.value.inputSchema
  const example = generateExampleFromSchema(schema)
  toolArgs.value = JSON.stringify(example, null, 2)
}

function generateExampleFromSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return {}
  
  if (schema.type === 'object' && schema.properties) {
    const example: any = {}
    for (const [key, prop] of Object.entries(schema.properties as any)) {
      example[key] = generateExampleFromProperty(prop)
    }
    return example
  }
  
  return generateExampleFromProperty(schema)
}

function generateExampleFromProperty(prop: any): any {
  if (!prop || typeof prop !== 'object') return ''
  
  switch (prop.type) {
    case 'string':
      return prop.example || prop.default || 'example'
    case 'number':
      return prop.example || prop.default || 42
    case 'integer':
      return prop.example || prop.default || 1
    case 'boolean':
      return prop.example !== undefined ? prop.example : (prop.default !== undefined ? prop.default : true)
    case 'array':
      const itemExample = prop.items ? generateExampleFromProperty(prop.items) : 'item'
      return [itemExample]
    case 'object':
      if (prop.properties) {
        const example: any = {}
        for (const [key, subProp] of Object.entries(prop.properties)) {
          example[key] = generateExampleFromProperty(subProp)
        }
        return example
      }
      return {}
    default:
      return prop.example || prop.default || ''
  }
}

async function executeTool() {
  if (!selectedTool.value) return
  
  isExecuting.value = true
  toolError.value = null
  toolResult.value = null
  responseTime.value = null
  
  const startTime = performance.now()
  
  try {
    const args = toolArgs.value.trim() ? JSON.parse(toolArgs.value) : {}
    const isDevelopmentMode = localStorage.getItem('mcpDevelopmentMode') === 'true'
    
    const result = isDevelopmentMode 
      ? await callToolMock(selectedTool.value.name, args)
      : await callTool(selectedTool.value.name, args)
    toolResult.value = result
    responseTime.value = Math.round(performance.now() - startTime)
  } catch (error) {
    toolError.value = error instanceof Error ? error.message : 'Unknown error'
    responseTime.value = Math.round(performance.now() - startTime)
  } finally {
    isExecuting.value = false
  }
}

// Mock function for development mode (if not already defined)
async function callToolMock(toolName: string, args: any) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  return {
    mock: true,
    tool: toolName,
    args,
    timestamp: new Date().toISOString()
  }
}
</script>

<style scoped>
/* Custom widths not available in default Tailwind */
.w-75 {
  width: 300px;
}

.min-h-30 {
  min-height: 120px;
}
</style>
