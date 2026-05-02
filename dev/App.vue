<script setup lang="ts">
import { ref } from 'vue'
import { FlexTable } from '../src/index'
import type { TableHeader, TableSort } from '../src/types'

const headers = ref<TableHeader[]>([
  { text: 'Name', value: 'name', sortable: true, width: 180 },
  { text: 'Email', value: 'email', sortable: true, width: 250 },
  { text: 'Role', value: 'role', sortable: true, width: 120 },
  { text: 'Status', value: 'status', sortable: true, width: 100 },
  { text: 'Created', value: 'created', sortable: true, width: 140 },
])

const items = ref(generateItems(50))

const sort = ref<TableSort>({ by: undefined, dir: 'asc' })
const virtualScrollEnabled = ref(false)

function generateItems(count: number) {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack']
  const roles = ['Admin', 'User', 'Editor', 'Viewer', 'Moderator']
  const statuses = ['Active', 'Inactive', 'Pending']

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase()}${i}@example.com`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length],
    created: new Date(2024, 0, 1 + i).toISOString().split('T')[0],
  }))
}

function addRows() {
  const currentLength = items.value.length
  const newItems = generateItems(50).map((item, i) => ({
    ...item,
    id: currentLength + i + 1,
  }))
  items.value = [...items.value, ...newItems]
}

function toggleDarkMode() {
  document.documentElement.classList.toggle('dark')
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">FlexTable Dev</h1>
      <div class="flex gap-2">
        <button
          @click="addRows"
          class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Add 50 rows ({{ items.length }})
        </button>
        <button
          @click="virtualScrollEnabled = !virtualScrollEnabled"
          :class="[
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            virtualScrollEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
          ]"
        >
          Virtual Scroll: {{ virtualScrollEnabled ? 'ON' : 'OFF' }}
        </button>
        <button
          @click="toggleDarkMode"
          class="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Toggle Dark
        </button>
      </div>
    </div>

    <FlexTable
      :headers="headers"
      :items="items"
      v-model:sort-table="sort"
      table-id="dev-table"
      :virtual-scroll="virtualScrollEnabled"
      row-height="36"
      virtual-scroll-max-height="70vh"
      :virtual-scroll-buffer="5"
    >
      <template #cell-status="{ item }">
        <span
          :class="[
            'inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
            item.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
            item.status === 'Inactive' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
          ]"
        >
          {{ item.status }}
        </span>
      </template>
    </FlexTable>
  </div>
</template>
