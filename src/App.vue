<template>
  <div class="container p-4 flex flex-col gap-4">
    <header>
      <h1 class="text-3xl">MCP Debug Client</h1>
      <p>Debug and test your Model Context Protocol server</p>
    </header>

    <div class="grid grid-cols-2 gap-4">
      <SettingsPanel />
      <ChatPanel />
    </div>

    <div v-if="mcpStore.isConnected" class="tabs-container">
      <div class="tabs">
        <button 
          :class="['tab', { active: activeTab === 'tools' }]"
          @click="activeTab = 'tools'"
        >
          Tools
        </button>
        <button 
          :class="['tab', { active: activeTab === 'resources' }]"
          @click="activeTab = 'resources'"
        >
          Resources
        </button>
      </div>
      
      <div class="tab-content">
        <ToolsPanel v-if="activeTab === 'tools'" />
        <ResourcesPanel v-if="activeTab === 'resources'" />
      </div>
    </div>

    <!-- Development Mode Toggle -->
    <div class="card" style="margin-top: 20px;">
      <h3>Development Mode</h3>
      <p>
        In development mode, the client uses mock data instead of connecting to the actual MCP server.
        This is useful for testing the UI when the server is not available.
      </p>
      <label style="display: flex; align-items: center; gap: 10px;">
        <input 
          type="checkbox" 
          v-model="isDevelopmentMode"
          @change="toggleDevelopmentMode"
        />
        Use mock data (development mode)
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMcpStore } from './stores/mcp'
import SettingsPanel from './components/SettingsPanel.vue'
import ToolsPanel from './components/ToolsPanel.vue'
import ResourcesPanel from './components/ResourcesPanel.vue'
import ChatPanel from './components/ChatPanel.vue'

const mcpStore = useMcpStore()
const isDevelopmentMode = ref(false)
const activeTab = ref('tools')

function toggleDevelopmentMode() {
  // Save preference
  localStorage.setItem('mcpDevelopmentMode', isDevelopmentMode.value.toString())
  
  if (mcpStore.isConnected) {
    // Disconnect and reconnect with new mode
    // This would trigger the appropriate connection method
    console.log('Development mode toggled to:', isDevelopmentMode.value)
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
})
</script>

<style>
header {
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 2px solid #eee;
}

header h1 {
  color: #333;
  margin-bottom: 10px;
}

header p {
  color: #6c757d;
  font-size: 16px;
}

.tabs-container {
  margin-top: 20px;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 20px;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab:hover {
  color: #333;
  background-color: #f5f5f5;
}

.tab.active {
  color: #007acc;
  border-bottom-color: #007acc;
}

.tab-content {
  min-height: 300px;
}
</style>
