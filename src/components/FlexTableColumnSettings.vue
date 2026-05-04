<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref, nextTick } from 'vue'
import Sortable from 'sortablejs'
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

const listRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

function destroySortable() {
  sortableInstance?.destroy()
  sortableInstance = null
}

function bindSortable() {
  destroySortable()
  const el = listRef.value
  if (!el || !props.headers.length)
    return

  sortableInstance = new Sortable(el, {
    animation: 150,
    handle: '.ft-drag-handle',
    draggable: '[data-col-row]',
    onEnd(evt: Sortable.SortableEvent) {
      const oi = evt.oldIndex
      const ni = evt.newIndex
      if (oi === undefined || ni === undefined || oi === ni)
        return
      const next = [...props.headers]
      const [moved] = next.splice(oi, 1)
      next.splice(ni, 0, moved)
      emit('update:headers', next)
      nextTick(() => bindSortable())
    },
  })
}

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
  header.width = Number.parseInt(target.value, 10) || 100
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
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      await nextTick()
      bindSortable()
    }
    else {
      document.body.style.overflow = ''
      destroySortable()
    }
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.body.style.overflow = ''
  destroySortable()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="ft-backdrop">
      <div
        v-if="modelValue"
        class="ft:fixed ft:inset-0 ft:flex ft:items-center ft:justify-center"
        style="z-index: 1000"
      >
        <!-- Backdrop -->
        <div
          class="ft:absolute ft:inset-0 ft:bg-black/50 ft:backdrop-blur-sm"
          @click="close"
        />

        <!-- Dialog -->
        <Transition name="ft-dialog">
          <div
            v-if="modelValue"
            class="ft:relative ft:bg-white ft:dark:bg-gray-800 ft:rounded-lg ft:shadow-xl ft:w-full ft:mx-4 ft:max-w-md ft:max-h-[90vh] ft:overflow-auto ft-modal-container"
          >
            <!-- Header -->
            <div class="ft:flex ft:justify-between ft:items-center ft:px-4 ft:py-3 ft:border-b ft:border-gray-200 ft:dark:border-gray-700 ft:sticky ft:top-0 ft:bg-white ft:dark:bg-gray-800 ft:z-10">
              <h3 class="ft:text-lg ft:font-medium ft:text-gray-900 ft:dark:text-gray-100">
                {{ texts?.columnSettingsTitle ?? 'Column Settings' }}
              </h3>
              <button
                @click="close"
                class="ft:text-gray-400 ft:hover:text-gray-600 ft:dark:hover:text-gray-300 ft:transition-colors ft:w-8 ft:h-8 ft:flex ft:items-center ft:justify-center ft:rounded-full ft:hover:bg-gray-100 ft:dark:hover:bg-gray-700"
              >
                <svg class="ft:w-4 ft:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="ft:p-4 ft:space-y-1 ft:max-h-[60vh] ft:overflow-y-auto ft:pr-1">
              <div v-if="headers.length">
                <div ref="listRef" class="ft:space-y-1">
                  <div
                    v-for="header in headers"
                    :key="header.value"
                    data-col-row
                    class="ft:flex ft:items-center ft:gap-2 ft:px-2.5 ft:py-1.5 ft:bg-gray-50 ft:dark:bg-gray-700/50 ft:ring-1 ft:ring-gray-200 ft:dark:ring-gray-600 ft:rounded-md ft:hover:bg-gray-100 ft:dark:hover:bg-gray-700 ft:transition-colors"
                  >
                    <!-- Drag handle -->
                    <div
                      class="ft-drag-handle ft:cursor-move ft:text-gray-400 ft:dark:text-gray-500 ft:hover:text-gray-600 ft:dark:hover:text-gray-300 ft:flex-shrink-0"
                    >
                      <svg class="ft:w-3.5 ft:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                      </svg>
                    </div>

                    <!-- Visibility checkbox -->
                    <input
                      type="checkbox"
                      :checked="header.visible !== false"
                      @change="toggleColumnVisibility(header)"
                      class="ft:rounded ft:border ft:border-gray-300 ft:dark:border-gray-600 ft:text-blue-600 ft:focus:ring-blue-500 ft:dark:bg-gray-600 ft:w-3.5 ft:h-3.5 ft:flex-shrink-0"
                    />

                    <!-- Column name -->
                    <span
                      class="ft:flex-1 ft:text-xs ft:font-medium ft:text-gray-700 ft:dark:text-gray-200 ft:truncate ft:min-w-0"
                    >{{ header.text || header.value }}</span>

                    <!-- Width input -->
                    <div class="ft:flex ft:items-center ft:gap-1 ft:flex-shrink-0">
                      <input
                        type="number"
                        :value="header.width || 100"
                        @input="updateColumnWidth(header, $event)"
                        min="50"
                        max="500"
                        class="ft:w-14 ft:px-1.5 ft:py-0.5 ft:text-xs ft:border ft:border-gray-300 ft:dark:border-gray-600 ft:rounded ft:focus:outline-none ft:focus:ring-1 ft:focus:ring-blue-500 ft:bg-white ft:dark:bg-gray-600 ft:text-gray-700 ft:dark:text-gray-100"
                      >
                      <span class="ft:text-[10px] ft:text-gray-400 ft:dark:text-gray-500">
                        {{ texts?.widthLabel ?? 'px' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="ft:text-center ft:text-gray-500 ft:dark:text-gray-400 ft:py-4">
                {{ texts?.noColumnsText ?? 'No columns to configure' }}
              </div>
            </div>

            <!-- Quick actions -->
            <div class="ft:px-4 ft:pb-4 ft:pt-3 ft:border-t ft:border-gray-200 ft:dark:border-gray-700">
              <div class="ft:grid ft:grid-cols-3 ft:gap-1.5 ft:mb-1.5">
                <button
                  @click="showAllColumns"
                  class="ft:px-2 ft:py-1.5 ft:text-xs ft:bg-green-50 ft:dark:bg-green-900/30 ft:text-green-700 ft:dark:text-green-300 ft:rounded-md ft:hover:bg-green-100 ft:dark:hover:bg-green-900/50 ft:transition-colors"
                >
                  {{ texts?.showAllText ?? 'Show all' }}
                </button>
                <button
                  @click="hideAllColumns"
                  class="ft:px-2 ft:py-1.5 ft:text-xs ft:bg-red-50 ft:dark:bg-red-900/30 ft:text-red-700 ft:dark:text-red-300 ft:rounded-md ft:hover:bg-red-100 ft:dark:hover:bg-red-900/50 ft:transition-colors"
                >
                  {{ texts?.hideAllText ?? 'Hide all' }}
                </button>
                <button
                  @click="resetColumnWidths"
                  class="ft:px-2 ft:py-1.5 ft:text-xs ft:bg-blue-50 ft:dark:bg-blue-900/30 ft:text-blue-700 ft:dark:text-blue-300 ft:rounded-md ft:hover:bg-blue-100 ft:dark:hover:bg-blue-900/50 ft:transition-colors"
                >
                  {{ texts?.resetWidthsText ?? 'Reset widths' }}
                </button>
              </div>
              <button
                @click="resetAllSettings"
                class="ft:w-full ft:px-2 ft:py-1.5 ft:text-xs ft:bg-orange-50 ft:dark:bg-orange-900/30 ft:text-orange-700 ft:dark:text-orange-300 ft:rounded-md ft:hover:bg-orange-100 ft:dark:hover:bg-orange-900/50 ft:transition-colors"
              >
                {{ texts?.resetAllText ?? 'Reset all' }}
              </button>
            </div>

            <!-- Footer -->
            <div class="ft:px-4 ft:pb-4 ft:pt-2 ft:border-t ft:border-gray-200 ft:dark:border-gray-700 ft:flex ft:justify-end">
              <button
                @click="close"
                class="ft:px-3 ft:py-1.5 ft:text-xs ft:bg-gray-500 ft:dark:bg-gray-600 ft:text-white ft:rounded-md ft:hover:bg-gray-600 ft:dark:hover:bg-gray-700 ft:transition-colors"
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
