<script setup lang="ts">
import { computed, ref, toRefs, watch, onMounted, onBeforeUnmount } from 'vue'
import FlexTableColumnSettings from './FlexTableColumnSettings.vue'
import type { TableHeader, TableSort, FlexTableTexts } from '../types'

interface Props {
  headers: TableHeader[]
  items: Record<string, unknown>[]
  sortTable?: TableSort
  tableId?: string
  keyRow?: string
  serverSort?: boolean
  virtualScroll?: boolean
  rowHeight?: number
  virtualScrollMaxHeight?: string
  virtualScrollBuffer?: number
  texts?: FlexTableTexts
}

const props = withDefaults(defineProps<Props>(), {
  headers: () => [],
  items: () => [],
  sortTable: () => ({ by: undefined, dir: 'asc' }),
  tableId: '',
  keyRow: 'id',
  serverSort: false,
  virtualScroll: false,
  rowHeight: 36,
  virtualScrollMaxHeight: '70vh',
  virtualScrollBuffer: 5,
  texts: () => ({}),
})

const emit = defineEmits<{
  'update:sortTable': [value: TableSort]
  'update:headers': [value: TableHeader[]]
  rowClick: [item: Record<string, unknown>]
  'server-sort': [value: TableSort]
}>()

const { headers, items, sortTable, keyRow, tableId, serverSort } = toRefs(props)

const showColumnSettings = ref(false)
const localHeaders = ref<TableHeader[]>([])

// --- Virtual scroll state ---
const scrollContainerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)

function onScroll() {
  if (scrollContainerRef.value) {
    scrollTop.value = scrollContainerRef.value.scrollTop
  }
}

const visibleRange = computed(() => {
  if (!props.virtualScroll) return { start: 0, end: sortedItems.value.length }

  const containerHeight = scrollContainerRef.value?.clientHeight ?? 600
  const headerHeight = 36
  const effectiveScroll = Math.max(0, scrollTop.value - headerHeight)

  const start = Math.max(0, Math.floor(effectiveScroll / props.rowHeight) - props.virtualScrollBuffer)
  const visibleCount = Math.ceil(containerHeight / props.rowHeight)
  const end = Math.min(sortedItems.value.length, start + visibleCount + props.virtualScrollBuffer * 2)

  return { start, end }
})

const updateVisibleRange = () => {
  if (props.virtualScroll && scrollContainerRef.value) {
    scrollTop.value = scrollContainerRef.value.scrollTop
  }
}

onMounted(() => {
  if (props.virtualScroll) {
    window.addEventListener('resize', updateVisibleRange)
  }
})

onBeforeUnmount(() => {
  if (props.virtualScroll) {
    window.removeEventListener('resize', updateVisibleRange)
  }
})

const topSpacerHeight = computed(() => visibleRange.value.start * props.rowHeight)
const bottomSpacerHeight = computed(() => (sortedItems.value.length - visibleRange.value.end) * props.rowHeight)

const renderedItems = computed(() => {
  if (!props.virtualScroll) return sortedItems.value
  return sortedItems.value.slice(visibleRange.value.start, visibleRange.value.end)
})

// --- localStorage persistence ---
function saveTableSettings() {
  if (!tableId.value) return

  try {
    const settings = {
      headers: localHeaders.value.map((h) => ({
        value: h.value,
        width: h.width,
        visible: h.visible,
      })),
    }

    localStorage.setItem(
      `flex_table_settings_${tableId.value}`,
      JSON.stringify(settings),
    )
  } catch {
    // Silently fail — localStorage may be unavailable (SSR, private browsing)
  }
}

function loadTableSettings(): { value: string; width?: number; visible?: boolean }[] | null {
  if (!tableId.value) return null

  try {
    const saved = localStorage.getItem(`flex_table_settings_${tableId.value}`)
    if (saved) {
      const settings = JSON.parse(saved)
      return settings.headers || null
    }
  } catch {
    // Silently fail
  }

  return null
}

// Initialize local headers from props, merging saved settings
watch(
  headers,
  (newHeaders) => {
    if (!newHeaders?.length) return

    const savedSettings = loadTableSettings()

    if (savedSettings) {
      const headerMap = new Map(newHeaders.map((h) => [h.value, h]))
      const orderedHeaders: TableHeader[] = []

      // Add in saved order first
      for (const saved of savedSettings) {
        const original = headerMap.get(saved.value)
        if (original) {
          orderedHeaders.push({
            ...original,
            visible: saved.visible !== undefined ? saved.visible : original.visible !== false,
            width: saved.width || original.width || 100,
          })
          headerMap.delete(saved.value)
        }
      }

      // Add new columns not in saved settings
      for (const [, h] of headerMap) {
        orderedHeaders.push({
          ...h,
          visible: h.visible !== false,
          width: h.width || 100,
        })
      }

      localHeaders.value = orderedHeaders
    } else {
      localHeaders.value = newHeaders.map((h) => ({
        ...h,
        visible: h.visible !== false,
        width: h.width || 100,
      }))
    }
  },
  { immediate: true },
)

const visibleHeaders = computed(() => {
  return localHeaders.value.filter((h) => h.visible !== false)
})

const sortedItems = computed(() => {
  if (serverSort.value) {
    return items.value || []
  }

  if (!sortTable.value?.by || !items.value) return items.value || []

  return [...items.value].sort((a, b) => {
    const dir = sortTable.value?.dir === 'asc' ? 1 : -1
    const fieldName = sortTable.value?.by || ''

    const valA = a[fieldName]
    const valB = b[fieldName]

    if (valA == null && valB == null) return 0
    if (valA == null) return 1
    if (valB == null) return -1

    if (valA < valB) return -1 * dir
    if (valA > valB) return 1 * dir
    return 0
  })
})

function sort(header: TableHeader) {
  if (!header.sortable) return

  const currentSort: TableSort = {
    ...(sortTable.value || { by: undefined, dir: 'asc' }),
  }

  if (currentSort.by === header.value) {
    currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.by = header.value
    currentSort.dir = 'desc'
  }

  const nextSort = { ...currentSort }
  emit('update:sortTable', nextSort)

  if (serverSort.value) {
    emit('server-sort', nextSort)
  }
}

function toggleColumnSettings() {
  showColumnSettings.value = !showColumnSettings.value
}

function onUpdateSettingsHeaders(newHeaders: TableHeader[]) {
  localHeaders.value = newHeaders
  emit('update:headers', [...localHeaders.value])
  saveTableSettings()
}
</script>

<template>
  <div class="group/ft relative">
    <!-- Table wrapper -->
    <div
      class="overflow-x-auto rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 relative"
      :class="{ 'overflow-y-auto': virtualScroll }"
      :style="virtualScroll ? { maxHeight: virtualScrollMaxHeight } : undefined"
      ref="scrollContainerRef"
      @scroll="virtualScroll ? onScroll() : undefined"
    >
      <!-- Column settings button — visible on hover -->
      <button
        @click="toggleColumnSettings"
        class="absolute top-1.5 right-1.5 z-10 w-6 h-6 opacity-0 group-hover/ft:opacity-100 focus:opacity-100 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 ring-1 ring-gray-200 dark:ring-gray-600 rounded-md flex items-center justify-center transition-all duration-200"
        :title="texts?.columnSettingsTitle ?? 'Column Settings'"
      >
        <svg
          class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      <table class="w-full text-xs md:text-sm" style="table-layout: fixed">
        <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-[1]">
          <tr>
            <th
              v-for="header in visibleHeaders"
              :key="header.value"
              :style="{
                width: (header.width || 100) + 'px',
                maxWidth: (header.width || 100) + 'px',
              }"
              :class="[
                'px-2.5 py-2 text-left text-[11px] md:text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 overflow-hidden border-b border-gray-200 dark:border-gray-700 select-none',
                header.sortable !== false && header.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors' : 'cursor-default',
              ]"
              @click="sort(header)"
            >
              <div class="flex items-center gap-1 min-w-0">
                <span class="truncate">
                  <slot :name="`header-${header.value}`" :header="header">
                    {{ header.text }}
                  </slot>
                </span>
                <span
                  v-if="header.sortable && sortTable?.by === header.value"
                  class="flex-shrink-0 text-[10px] text-gray-400 dark:text-gray-500"
                >
                  <svg v-if="sortTable?.dir === 'asc'" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <!-- Virtual scroll spacer (top) -->
          <tr v-if="virtualScroll && topSpacerHeight > 0" aria-hidden="true">
            <td :style="{ height: topSpacerHeight + 'px', padding: 0, border: 'none' }" :colspan="visibleHeaders.length" />
          </tr>

          <tr
            v-for="item in renderedItems"
            :key="String(item[keyRow] ?? item)"
            :class="[
              'hover:bg-gray-50/80 dark:hover:bg-gray-700/40 cursor-pointer transition-colors duration-100',
              (item as any)._rowClass || '',
            ]"
            :style="virtualScroll ? { height: rowHeight + 'px' } : undefined"
            @click="emit('rowClick', item)"
          >
            <td
              v-for="header in visibleHeaders"
              :key="header.value"
              :style="{
                width: (header.width || 100) + 'px',
                maxWidth: (header.width || 100) + 'px',
              }"
              class="px-2.5 py-1.5 text-gray-700 dark:text-gray-200 overflow-hidden"
            >
              <div class="truncate" :title="String(item[header.value] ?? '')">
                <slot
                  :name="`cell-${header.value}`"
                  :item="item"
                  :header="header"
                >
                  {{ item[header.value] }}
                </slot>
              </div>
            </td>
          </tr>

          <!-- Virtual scroll spacer (bottom) -->
          <tr v-if="virtualScroll && bottomSpacerHeight > 0" aria-hidden="true">
            <td :style="{ height: bottomSpacerHeight + 'px', padding: 0, border: 'none' }" :colspan="visibleHeaders.length" />
          </tr>

          <!-- Empty state -->
          <tr v-if="!sortedItems?.length">
            <td
              :colspan="visibleHeaders.length"
              class="text-center py-8 text-gray-400 dark:text-gray-500"
            >
              <div class="flex flex-col items-center gap-1.5">
                <svg class="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span class="text-sm">{{ texts?.emptyText ?? 'No data' }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Column settings modal -->
    <FlexTableColumnSettings
      v-model="showColumnSettings"
      :headers="localHeaders"
      :texts="texts"
      @update:headers="onUpdateSettingsHeaders"
    />
  </div>
</template>
