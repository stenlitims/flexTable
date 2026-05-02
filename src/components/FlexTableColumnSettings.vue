<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import type { TableHeader, FlexTableTexts } from '../types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  headers: TableHeader[]
  texts?: FlexTableTexts
}>(), {
  texts: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:headers': [value: TableHeader[]]
}>()

function close() {
  emit('update:modelValue', false)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

function toggleColumnVisibility(header: TableHeader) {
  header.visible = !(header.visible !== false)
  emit('update:headers', [...props.headers])
}

function updateColumnWidth(header: TableHeader, event: Event) {
  const target = event.target as HTMLInputElement
  header.width = parseInt(target.value) || 100
  emit('update:headers', [...props.headers])
}

function onDragEnd() {
  emit('update:headers', [...props.headers])
}

function showAllColumns() {
  props.headers.forEach((header) => {
    header.visible = true
  })
  emit('update:headers', [...props.headers])
}

function hideAllColumns() {
  props.headers.forEach((header) => {
    header.visible = false
  })
  emit('update:headers', [...props.headers])
}

function resetColumnWidths() {
  emit('update:headers', [...props.headers])
}

function resetAllSettings() {
  const resetHeaders = props.headers.map((h) => ({
    ...h,
    visible: true,
    width: h.width || 100,
  }))
  emit('update:headers', resetHeaders)
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ft-backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 flex items-center justify-center"
        style="z-index: 1000"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        />

        <!-- Dialog -->
        <Transition name="ft-dialog">
          <div
            v-if="modelValue"
            class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full mx-4 max-w-md max-h-[90vh] overflow-auto ft-modal-container"
          >
            <!-- Header -->
            <div class="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                {{ texts?.columnSettingsTitle ?? 'Column Settings' }}
              </h3>
              <button
                @click="close"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-4 space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              <div v-if="headers.length">
                <draggable
                  :model-value="headers"
                  @update:model-value="(val: TableHeader[]) => emit('update:headers', val)"
                  @end="onDragEnd"
                  item-key="value"
                  class="space-y-1"
                >
                  <template #item="{ element: header }">
                    <div
                      class="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700/50 ring-1 ring-gray-200 dark:ring-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <!-- Drag handle -->
                      <div
                        class="cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                      >
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                        </svg>
                      </div>

                      <!-- Visibility checkbox -->
                      <input
                        type="checkbox"
                        :checked="header.visible !== false"
                        @change="toggleColumnVisibility(header)"
                        class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 w-3.5 h-3.5 flex-shrink-0"
                      />

                      <!-- Column name -->
                      <span
                        class="flex-1 text-xs font-medium text-gray-700 dark:text-gray-200 truncate min-w-0"
                      >{{ header.text || header.value }}</span>

                      <!-- Width input -->
                      <div class="flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          :value="header.width || 100"
                          @input="updateColumnWidth(header, $event)"
                          min="50"
                          max="500"
                          class="w-14 px-1.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100"
                        />
                        <span class="text-[10px] text-gray-400 dark:text-gray-500">
                          {{ texts?.widthLabel ?? 'px' }}
                        </span>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
              <div v-else class="text-center text-gray-500 dark:text-gray-400 py-4">
                {{ texts?.noColumnsText ?? 'No columns to configure' }}
              </div>
            </div>

            <!-- Quick actions -->
            <div class="px-4 pb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div class="grid grid-cols-3 gap-1.5 mb-1.5">
                <button
                  @click="showAllColumns"
                  class="px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                >
                  {{ texts?.showAllText ?? 'Show all' }}
                </button>
                <button
                  @click="hideAllColumns"
                  class="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                >
                  {{ texts?.hideAllText ?? 'Hide all' }}
                </button>
                <button
                  @click="resetColumnWidths"
                  class="px-2 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  {{ texts?.resetWidthsText ?? 'Reset widths' }}
                </button>
              </div>
              <button
                @click="resetAllSettings"
                class="w-full px-2 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
              >
                {{ texts?.resetAllText ?? 'Reset all' }}
              </button>
            </div>

            <!-- Footer -->
            <div class="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                @click="close"
                class="px-3 py-1.5 text-xs bg-gray-500 dark:bg-gray-600 text-white rounded-md hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                {{ texts?.closeText ?? 'Close' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ft-modal-container::-webkit-scrollbar {
  width: 6px;
}
.ft-modal-container::-webkit-scrollbar-track {
  background: transparent;
}
.ft-modal-container::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 6px;
}
</style>

<style>
.ft-backdrop-enter-active,
.ft-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.ft-backdrop-enter-from,
.ft-backdrop-leave-to {
  opacity: 0;
}

.ft-dialog-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.ft-dialog-leave-active {
  transition: all 0.2s ease;
}
.ft-dialog-enter-from,
.ft-dialog-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}
</style>
