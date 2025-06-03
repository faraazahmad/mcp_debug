<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top Navbar -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo/Title -->
          <div class="flex items-center">
            <h1 class="text-xl font-semibold text-gray-900">MCP Debug Client</h1>
          </div>
          
          <!-- Connection Status & Controls -->
          <div class="flex items-center space-x-4">
            <!-- Connection Status -->
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <div 
                  :class="[
                    'w-2 h-2 rounded-full mr-2',
                    mcpStore.isConnected ? 'bg-green-500' : 'bg-red-500'
                  ]"
                ></div>
                <span class="text-sm text-gray-600">
                  {{ mcpStore.isConnected ? 'Connected' : 'Disconnected' }}
                </span>
                <span v-if="mcpStore.serverInfo && mcpStore.isConnected" class="text-xs text-gray-500 ml-1">
                  ({{ mcpStore.serverInfo.name }})
                </span>
              </div>
            </div>
            
            <!-- Connect/Disconnect Button -->
            <button 
              @click="connectToServer" 
              :disabled="mcpStore.isConnecting || !canConnect"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                mcpStore.isConnected 
                  ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 focus:ring-red-500' 
                  : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 focus:ring-green-500',
                (mcpStore.isConnecting || !canConnect) && 'opacity-50 cursor-not-allowed'
              ]"
            >
              {{ mcpStore.isConnecting ? 'Connecting...' : (mcpStore.isConnected ? 'Disconnect' : 'Connect') }}
            </button>
            
            <!-- Settings Dropdown -->
            <div class="relative">
              <button 
              @click="showSettingsDropdown = !showSettingsDropdown"
              class="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Settings
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Dropdown Menu -->
            <div 
              v-if="showSettingsDropdown"
              @click.stop
              class="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
            >
              <div class="py-1">
                <div class="px-4 py-3 border-b border-gray-100">
                  <h3 class="text-sm font-medium text-gray-900">MCP Server Configuration</h3>
                </div>
                
                <!-- Server Configuration -->
                <div class="p-4 space-y-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Server Command:</label>
                    <input 
                      v-model="mcpStore.settings.serverCommand"
                      @change="mcpStore.saveSettings()"
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="node"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Server Arguments:</label>
                    <input 
                      :value="mcpStore.settings.serverArgs.join(', ')"
                      @input="updateServerArgs($event.target.value)"
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="../../build/mcp.js"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Anthropic API Key:</label>
                    <input 
                      v-model="mcpStore.settings.anthropicApiKey"
                      @change="mcpStore.saveSettings()"
                      type="password" 
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="sk-ant-..."
                    />
                  </div>

                  <!-- Environment Variables -->
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <label class="block text-xs font-medium text-gray-700">Environment Variables:</label>
                      <button 
                        @click="addEnvVar" 
                        type="button"
                        class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                      <div 
                        v-for="(key, index) in envVarKeys" 
                        :key="index"
                        class="flex gap-2 items-center"
                      >
                        <input
                          v-model="envVarKeys[index]"
                          @input="updateEnvVarKey(index, $event.target.value)"
                          class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          type="text"
                          placeholder="Variable name"
                        />
                        <input
                          v-model="mcpStore.settings.environmentVariables[key]"
                          @change="mcpStore.saveSettings()"
                          class="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          type="password"
                          placeholder="Variable value"
                        />
                        <button
                          @click="removeEnvVar(index)"
                          type="button"
                          class="w-6 h-6 text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center text-xs transition-colors"
                        >×</button>
                      </div>
                      <div v-if="envVarKeys.length === 0" class="text-xs text-gray-500 text-center py-2">
                        No environment variables configured
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Development Mode Toggle -->
                <div class="px-4 py-3 border-t border-gray-100">
                  <label class="flex items-center">
                    <input 
                      type="checkbox" 
                      v-model="isDevelopmentMode"
                      @change="toggleDevelopmentMode"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span class="ml-2 text-sm text-gray-700">Development mode</span>
                  </label>
                  <p class="text-xs text-gray-500 mt-1">Use mock data for testing</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container mx-auto p-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex">
            <button 
              @click="activeTab = 'chat'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
                activeTab === 'chat' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.863 9.863 0 01-4.906-1.308L3 21l2.308-5.094A9.863 9.863 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
              </svg>
              Chat
            </button>
            <button 
              v-if="mcpStore.isConnected"
              @click="activeTab = 'tools'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
                activeTab === 'tools' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Tools
            </button>
            <button 
              v-if="mcpStore.isConnected"
              @click="activeTab = 'resources'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors duration-200',
                activeTab === 'resources' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              Resources
            </button>
          </nav>
        </div>
        
        <!-- Tab Content -->
        <div class="p-0">
          <ChatPanel v-if="activeTab === 'chat'" />
          <ToolsPanel v-if="activeTab === 'tools'" />
          <ResourcesPanel v-if="activeTab === 'resources'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useMcpStore } from './stores/mcp'
import { connectMcp, disconnectMcp } from './services/mcpClient'
import SettingsPanel from './components/SettingsPanel.vue'
import ToolsPanel from './components/ToolsPanel.vue'
import ResourcesPanel from './components/ResourcesPanel.vue'
import ChatPanel from './components/ChatPanel.vue'

const mcpStore = useMcpStore()
const isDevelopmentMode = ref(false)
const activeTab = ref('chat')
const showSettingsDropdown = ref(false)
const envVarKeys = ref<string[]>([])

const canConnect = computed(() => 
  mcpStore.settings.serverCommand.trim() !== '' &&
  mcpStore.settings.anthropicApiKey.trim() !== '' &&
  !mcpStore.isConnecting
)

async function connectToServer() {
  if (mcpStore.isConnected) {
    await disconnectMcp()
  } else {
    // Check if we're in development mode
    const isDevelopmentMode = localStorage.getItem('mcpDevelopmentMode') === 'true'
    
    if (isDevelopmentMode) {
      await connectMcpMock()
    } else {
      await connectMcp()
    }
  }
}

async function connectMcpMock() {
  // Mock connection function - implement as needed
  console.log('Mock MCP connection')
  mcpStore.setConnected(true)
  mcpStore.setServerInfo({ name: 'Mock Server', version: '1.0.0' })
}

function updateServerArgs(value: string) {
  const args = value.split(',').map(arg => arg.trim()).filter(arg => arg !== '')
  mcpStore.settings.serverArgs = args
  mcpStore.saveSettings()
}

function updateEnvVarKeys() {
  envVarKeys.value = Object.keys(mcpStore.settings.environmentVariables || {})
  if (envVarKeys.value.length === 0) {
    addEnvVar()
  }
}

function addEnvVar() {
  envVarKeys.value.push('')
}

function removeEnvVar(index: number) {
  const keyToRemove = envVarKeys.value[index]
  envVarKeys.value.splice(index, 1)
  if (keyToRemove && mcpStore.settings.environmentVariables) {
    delete mcpStore.settings.environmentVariables[keyToRemove]
    mcpStore.saveSettings()
  }
}

function updateEnvVarKey(index: number, newKey: string) {
  const oldKey = envVarKeys.value[index]
  if (oldKey && oldKey !== newKey && mcpStore.settings.environmentVariables) {
    const value = mcpStore.settings.environmentVariables[oldKey]
    delete mcpStore.settings.environmentVariables[oldKey]
    if (newKey.trim()) {
      mcpStore.settings.environmentVariables[newKey] = value || ''
    }
    mcpStore.saveSettings()
  } else if (newKey.trim() && mcpStore.settings.environmentVariables) {
    if (!mcpStore.settings.environmentVariables[newKey]) {
      mcpStore.settings.environmentVariables[newKey] = ''
    }
    mcpStore.saveSettings()
  }
  envVarKeys.value[index] = newKey
}

function toggleDevelopmentMode() {
  // Save preference
  localStorage.setItem('mcpDevelopmentMode', isDevelopmentMode.value.toString())
  
  if (mcpStore.isConnected) {
    // Disconnect and reconnect with new mode
    // This would trigger the appropriate connection method
    console.log('Development mode toggled to:', isDevelopmentMode.value)
  }
}

// Close dropdown when clicking outside
function handleClickOutside(event: Event) {
  if (showSettingsDropdown.value && !(event.target as Element).closest('.relative')) {
    showSettingsDropdown.value = false
  }
}

onMounted(() => {
  // Load development mode preference
  const saved = localStorage.getItem('mcpDevelopmentMode')
  if (saved) {
    isDevelopmentMode.value = saved === 'true'
  }

  // Load MCP settings
  mcpStore.loadSettings()
  
  // Initialize environment variables
  updateEnvVarKeys()
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

// Clean up event listener
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>


