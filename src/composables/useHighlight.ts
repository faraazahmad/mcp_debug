import { onMounted, nextTick } from 'vue'
import hljs from 'highlight.js/lib/core'
import json from 'highlight.js/lib/languages/json'
import 'highlight.js/styles/github.css'

// Register JSON language
hljs.registerLanguage('json', json)

export function useHighlight() {
  const highlightAll = () => {
    nextTick(() => {
      hljs.highlightAll()
    })
  }

  const highlightCode = (code: string, language: string = 'json'): string => {
    try {
      return hljs.highlight(code, { language }).value
    } catch (error) {
      return code
    }
  }

  onMounted(() => {
    highlightAll()
  })

  return {
    highlightAll,
    highlightCode
  }
}
