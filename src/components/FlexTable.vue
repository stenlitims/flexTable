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
  <div class="ft:group/flextbl ft:relative">
    <!-- Table wrapper -->
    <div
      class="ft:overflow-x-auto ft:rounded-lg ft:bg-white ft:dark:bg-gray-800 ft:shadow-sm ft:ring-1 ft:ring-gray-200 ft:dark:ring-gray-700 ft:relative"
      :class="{ 'ft:overflow-y-auto': virtualScroll }"
      :style="virtualScroll ? { maxHeight: virtualScrollMaxHeight } : undefined"
      ref="scrollContainerRef"
      @scroll="virtualScroll ? onScroll() : undefined"
    >
      <!-- Column settings button — visible on hover -->
      <button
        @click="toggleColumnSettings"
        class="ft:absolute ft:top-1.5 ft:right-1.5 ft:z-10 ft:w-6 ft:h-6 ft:opacity-0 ft:group-hover/flextbl:opacity-100 ft:focus:opacity-100 ft:bg-white/90 ft:dark:bg-gray-800/90 ft:backdrop-blur-sm ft:hover:bg-gray-100 ft:dark:hover:bg-gray-700 ft:ring-1 ft:ring-gray-200 ft:dark:ring-gray-600 ft:rounded-md ft:flex ft:items-center ft:justify-center ft:transition-all ft:duration-200"
        :title="texts?.columnSettingsTitle ?? 'Column Settings'"
      >
        <svg
          class="ft:w-3.5 ft:h-3.5 ft:text-gray-500 ft:dark:text-gray-400"
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

      <table class="ft:w-full ft:text-xs ft:md:text-sm" style="table-layout: fixed">
        <thead class="ft:bg-gray-50 ft:dark:bg-gray-700 ft:sticky ft:top-0 ft:z-[1]">
          <tr>
            <th
              v-for="header in visibleHeaders"
              :key="header.value"
              :style="{
                width: (header.width || 100) + 'px',
                maxWidth: (header.width || 100) + 'px',
              }"
              :class="[
                'ft:px-2.5 ft:py-2 ft:text-left ft:text-[11px] ft:md:text-xs ft:font-semibold ft:uppercase ft:tracking-wider ft:text-gray-500 ft:dark:text-gray-400 ft:overflow-hidden ft:border-b ft:border-gray-200 ft:dark:border-gray-700 ft:select-none',
                header.sortable !== false && header.sortable ? 'ft:cursor-pointer ft:hover:text-gray-700 ft:dark:hover:text-gray-200 ft:hover:bg-gray-100 ft:dark:hover:bg-gray-700 ft:transition-colors' : 'ft:cursor-default',
              ]"
              @click="sort(header)"
            >
              <div class="ft:flex ft:items-center ft:gap-1 ft:min-w-0">
                <span class="ft:truncate">
                  <slot :name="`header-${header.value}`" :header="header">
                    {{ header.text }}
                  </slot>
                </span>
                <span
                  v-if="header.sortable && sortTable?.by === header.value"
                  class="ft:flex-shrink-0 ft:text-[10px] ft:text-gray-400 ft:dark:text-gray-500"
                >
                  <svg v-if="sortTable?.dir === 'asc'" class="ft:w-3 ft:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg v-else class="ft:w-3 ft:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="ft:divide-y ft:divide-gray-100 ft:dark:divide-gray-700/50">
          <!-- Virtual scroll spacer (top) -->
          <tr v-if="virtualScroll && topSpacerHeight > 0" aria-hidden="true">
            <td :style="{ height: topSpacerHeight + 'px', padding: 0, border: 'none' }" :colspan="visibleHeaders.length" />
          </tr>

          <tr
            v-for="item in renderedItems"
            :key="String(item[keyRow] ?? item)"
            :class="[
              'ft:hover:bg-gray-50/80 ft:dark:hover:bg-gray-700/40 ft:cursor-pointer ft:transition-colors ft:duration-100',
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
              class="ft:px-2.5 ft:py-1.5 ft:text-gray-700 ft:dark:text-gray-200 ft:overflow-hidden"
            >
              <div class="ft:truncate" :title="String(item[header.value] ?? '')">
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
              class="ft:text-center ft:py-8 ft:text-gray-400 ft:dark:text-gray-500"
            >
              <div class="ft:flex ft:flex-col ft:items-center ft:gap-1.5">
                <svg class="ft:w-8 ft:h-8 ft:text-gray-300 ft:dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span class="ft:text-sm">{{ texts?.emptyText ?? 'No data' }}</span>
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
