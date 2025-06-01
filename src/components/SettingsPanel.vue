<template>
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">MCP Server Settings</h2>
    
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Server Command:</label>
      <input 
        v-model="localSettings.serverCommand" 
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        placeholder="node"
      />
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Server Arguments (comma-separated):</label>
      <input 
        v-model="serverArgsString" 
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        placeholder="../../build/mcp.js"
      />
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium font-mono text-gray-700 mb-2">Environment variables</label>
      <div class="border border-gray-300 rounded-md p-4 bg-gray-50">
        <div class="flex flex-col md:flex-row gap-2 mb-2 items-center" v-for="(key, index) in envVarKeys" :key="index">
          <input
            class="font-mono flex-1 min-w-0 md:min-w-[150px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="text"
            v-model="envVarKeys[index]"
            placeholder="Variable name"
            @input="updateEnvVarKey(index, $event.target.value)"
          >
          <input
            class="flex-2 min-w-0 md:min-w-[200px] px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            type="password"
            v-model="localSettings.environmentVariables[key]"
            placeholder="Variable value"
          >
          <button
            @click="removeEnvVar(index)"
            type="button"
            class="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >×</button>
        </div>
        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-2 transition-colors" @click="addEnvVar" type="button">+ Add Env var</button>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">Anthropic API Key:</label>
      <input 
        v-model="localSettings.anthropicApiKey" 
        type="password" 
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        placeholder="sk-ant-..."
      />
    </div>

    <div class="mb-4 space-x-2">
      <button 
        @click="saveSettings" 
        class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
        :disabled="!isValid"
      >
        Save Settings
      </button>
      
      <button 
        @click="connectToServer" 
        class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors"
        :disabled="!canConnect"
      >
        {{ mcpStore.isConnected ? 'Disconnect' : 'Connect to MCP Server' }}
      </button>
    </div>

    <div v-if="mcpStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {{ mcpStore.error }}
    </div>

    <div v-if="mcpStore.isConnecting" class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
      Connecting to MCP server...
    </div>

    <div v-if="mcpStore.serverInfo" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
      Connected to {{ mcpStore.serverInfo.name }} v{{ mcpStore.serverInfo.version }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMcpStore } from '../stores/mcp'
import { connectMcp, disconnectMcp } from '../services/mcpClient'

const mcpStore = useMcpStore()

const localSettings = ref({ ...mcpStore.settings })
const serverArgsString = ref(mcpStore.settings.serverArgs.join(', '))
const envVarKeys = ref<string[]>([]);

const isValid = computed(() => 
  localSettings.value.serverCommand.trim() !== '' &&
  localSettings.value.anthropicApiKey.trim() !== ''
)

const canConnect = computed(() => 
  isValid.value && !mcpStore.isConnecting
)

// Watch for changes in server args string
watch(serverArgsString, (newValue) => {
  localSettings.value.serverArgs = newValue
    .split(',')
    .map(arg => arg.trim())
    .filter(arg => arg !== '')
})

function saveSettings() {
  mcpStore.setSettings(localSettings.value)
  console.log(mcpStore.settings)
}

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
}

function updateEnvVarKeys() {
  envVarKeys.value = Object.keys(localSettings.value.environmentVariables || {})
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
  if (keyToRemove && localSettings.value.environmentVariables) {
    delete localSettings.value.environmentVariables[keyToRemove]
  }
}

function updateEnvVarKey(index: number, newKey: string) {
  const oldKey = envVarKeys.value[index]
  if (oldKey && oldKey !== newKey && localSettings.value.environmentVariables) {
    const value = localSettings.value.environmentVariables[oldKey]
    delete localSettings.value.environmentVariables[oldKey]
    if (newKey.trim()) {
      localSettings.value.environmentVariables[newKey] = value || ''
    }
  } else if (newKey.trim() && localSettings.value.environmentVariables) {
    localSettings.value.environmentVariables[newKey] = localSettings.value.environmentVariables[newKey] || ''
  }
  envVarKeys.value[index] = newKey
}

onMounted(() => {
  mcpStore.loadSettings()
  localSettings.value = { 
    ...mcpStore.settings,
    environmentVariables: mcpStore.settings.environmentVariables || {}
  }
  serverArgsString.value = mcpStore.settings.serverArgs.join(', ')
  updateEnvVarKeys()
})
</script>


