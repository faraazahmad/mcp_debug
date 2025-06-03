<template>
  <div class="postman-ui">
    <h2>MCP Tools Explorer</h2>
    
    <div v-if="!mcpStore.hasTools && mcpStore.isConnected" class="no-tools">
      No tools available
    </div>
    
    <div v-else-if="!mcpStore.isConnected" class="not-connected">
      Connect to MCP server to see available tools
    </div>

    <div v-else class="three-column-layout">
      <!-- Column 1: Tools List -->
      <div class="column tools-list">
        <div class="column-header">
          <h3>Tools</h3>
          <span class="tool-count">{{ mcpStore.tools.length }}</span>
        </div>
        <div class="tools-scroll">
          <div 
            v-for="tool in mcpStore.tools" 
            :key="tool.name"
            class="tool-item"
            :class="{ active: selectedTool?.name === tool.name }"
            @click="selectTool(tool)"
          >
            <div class="tool-name">{{ tool.name }}</div>
            <div class="tool-desc" v-if="tool.description">{{ tool.description }}</div>
          </div>
        </div>
      </div>

      <!-- Column 2: Schema & Input -->
      <div class="column schema-input">
        <div class="column-header">
          <h3>{{ selectedTool ? selectedTool.name : 'Select a tool' }}</h3>
        </div>
        <div v-if="selectedTool" class="schema-content">
          <div class="tool-description" v-if="selectedTool.description">
            {{ selectedTool.description }}
          </div>
          
          <div class="schema-section">
            <h4>Schema</h4>
            <pre class="schema-display"><code class="language-json" v-html="highlightCode(JSON.stringify(selectedTool.inputSchema, null, 2))"></code></pre>
          </div>

          <div class="input-section">
            <h4>Request Body</h4>
            <textarea 
              v-model="toolArgs" 
              class="json-input"
              placeholder='{"parameter": "value"}'
            ></textarea>
            
            <div class="execute-controls">
              <button 
                @click="executeTool" 
                class="execute-btn"
                :disabled="isExecuting"
              >
                {{ isExecuting ? 'Executing...' : 'Send' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="no-selection">
          Select a tool from the left panel to view its schema and test it
        </div>
      </div>

      <!-- Column 3: Response -->
      <div class="column response">
        <div class="column-header">
          <h3>Response</h3>
          <span v-if="responseTime" class="response-time">{{ responseTime }}ms</span>
        </div>
        <div class="response-content">
          <div v-if="toolResult" class="result-section">
            <div class="status-indicator success">200 OK</div>
            <pre class="response-display"><code class="language-json" v-html="highlightCode(JSON.stringify(toolResult, null, 2))"></code></pre>
          </div>

          <div v-else-if="toolError" class="result-section">
            <div class="status-indicator error">Error</div>
            <div class="error-display">{{ toolError }}</div>
          </div>

          <div v-else-if="!selectedTool" class="no-response">
            Select a tool and execute it to see the response
          </div>

          <div v-else class="no-response">
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
.postman-ui {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.postman-ui h2 {
  margin: 0 0 20px 0;
  padding: 0 20px;
  font-size: 24px;
  color: #333;
}

.no-tools, .not-connected {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.three-column-layout {
  display: flex;
  height: calc(100vh - 120px);
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.column {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e1e1e1;
}

.column:last-child {
  border-right: none;
}

.tools-list {
  width: 300px;
  min-width: 250px;
}

.schema-input {
  flex: 1;
  min-width: 400px;
}

.response {
  width: 400px;
  min-width: 350px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e1e1;
  font-weight: 600;
}

.column-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.tool-count {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.response-time {
  background: #28a745;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tools-scroll {
  flex: 1;
  overflow-y: auto;
}

.tool-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.tool-item:hover {
  background: #f8f9fa;
}

.tool-item.active {
  background: #e3f2fd;
  border-right: 3px solid #007bff;
}

.tool-name {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.tool-desc {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  line-height: 1.4;
}

.schema-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.tool-description {
  color: #666;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.schema-section, .input-section {
  margin-bottom: 25px;
}

.schema-section h4, .input-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.schema-display {
  background: #f8f9fa;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  padding: 15px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.json-input {
  width: 100%;
  min-height: 120px;
  padding: 15px;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  resize: vertical;
  background: white;
}

.json-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.execute-controls {
  margin-top: 15px;
}

.execute-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.execute-btn:hover:not(:disabled) {
  background: #0056b3;
}

.execute-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.no-selection, .no-response {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 40px;
}

.response-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.result-section {
  height: 100%;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 15px;
  display: inline-block;
}

.status-indicator.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-indicator.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.response-display {
  background: #f8f9fa;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  padding: 15px;
  font-size: 12px;
  overflow: auto;
  height: calc(100% - 50px);
}

.error-display {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  padding: 15px;
  color: #721c24;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}
</style>
