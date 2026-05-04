# flex-table-vue

A flexible, feature-rich Vue 3 data table component with sorting, virtual scrolling, and interactive column management. Styles ship as a pre-built CSS file (Tailwind compiled in-repo); fully typed with TypeScript.

**Repository:** [github.com/stenlitims/flexTable](https://github.com/stenlitims/flexTable) · **npm:** [flex-table-vue](https://www.npmjs.com/package/flex-table-vue)

## Features

- **Sorting** — client-side and server-side sorting with configurable sort direction
- **Virtual scrolling** — efficient rendering of large datasets with configurable row height and buffer
- **Column settings modal** — drag-and-drop reordering, per-column visibility toggle, and width controls
- **LocalStorage persistence** — user preferences (column order, visibility, width) saved per table via `tableId`
- **i18n-ready** — all UI text labels customizable via the `texts` prop
- **Bundled styles** — import `flex-table-vue/style.css` once. Utilities are emitted with an **`ft:` prefix** so they do not clash with the host app’s Tailwind and you do not add this package to Tailwind `content`. The bundle does **not** include Tailwind Preflight (no global reset for `*` / `button` from this file).
- **Named slots** — `header-{value}` and `cell-{value}` slots for custom rendering
- **TypeScript** — complete type definitions included
- **Vue plugin** — register globally with `app.use()`

## Installation

```bash
npm install flex-table-vue
```

### Requirements

- Vue 3.5+
- **Styling:** import `flex-table-vue/style.css` once. It contains only the **`ft:`‑prefixed** utilities used by the table and column-settings modal (no Tailwind Preflight — your app keeps its own base styles).
- If the host app already uses Tailwind, you can keep your own setup for layouts and slot content; you typically **do not** need to add `node_modules/flex-table-vue` to Tailwind `content` for the library’s own markup.
- Column reordering in the settings modal uses **SortableJS**, bundled in `flex-table-vue`.

### Tailwind / PostCSS in the host app

From **v0.1.8** onward, `style.css` is post-processed so **`@layer` blocks are removed** (rules stay the same). That avoids errors when the host app’s Tailwind v3 / PostCSS pipeline re-parses the file (e.g. `@layer base is used but no matching @tailwind base`). You can still import `flex-table-vue/style.css` like any global stylesheet.

## Usage

### Basic

```vue
<script setup>
import { ref } from 'vue'
import { FlexTable } from 'flex-table-vue'
import 'flex-table-vue/style.css'

const headers = [
  { text: 'Name', value: 'name', sortable: true, width: 200 },
  { text: 'Email', value: 'email', sortable: true, width: 250 },
  { text: 'Role', value: 'role', sortable: true, width: 120 },
]

const items = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'Editor' },
]

const sort = ref({ by: undefined, dir: 'asc' })
</script>

<template>
  <FlexTable
    :headers="headers"
    :items="items"
    v-model:sort-table="sort"
    table-id="users-table"
  />
</template>
```

### Global Registration

```ts
import { createApp } from 'vue'
import FlexTablePlugin from 'flex-table-vue'
import 'flex-table-vue/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(FlexTablePlugin)
app.mount('#app')
```

After registration, use `<FlexTable>` anywhere without importing.

### Custom Cell Rendering

Use named slots `cell-{value}` to customize cell content:

```vue
<FlexTable :headers="headers" :items="items">
  <template #cell-name="{ item }">
    <strong>{{ item.name }}</strong>
  </template>
  <template #cell-role="{ item }">
    <span class="badge">{{ item.role }}</span>
  </template>
</FlexTable>
```

### Custom Header Rendering

Use named slots `header-{value}` to customize header content:

```vue
<FlexTable :headers="headers" :items="items">
  <template #header-name="{ header }">
    <i class="icon-user" /> {{ header.text }}
  </template>
</FlexTable>
```

### Server-Side Sorting

```vue
<script setup>
const sort = ref({ by: 'name', dir: 'asc' })

function onServerSort(newSort) {
  // Fetch data from API with sort params
  fetchItems({ sortBy: newSort.by, sortDir: newSort.dir })
}
</script>

<template>
  <FlexTable
    :headers="headers"
    :items="items"
    v-model:sort-table="sort"
    :server-sort="true"
    @server-sort="onServerSort"
  />
</template>
```

### Virtual Scrolling

For large datasets (1000+ rows), enable virtual scrolling:

```vue
<FlexTable
  :headers="headers"
  :items="largeDataset"
  :virtual-scroll="true"
  row-height="36"
  virtual-scroll-max-height="70vh"
  :virtual-scroll-buffer="5"
/>
```

### i18n — Custom Text Labels

All text labels can be customized via the `texts` prop:

```vue
<FlexTable
  :headers="headers"
  :items="items"
  :texts="{
    emptyText: 'Немає даних',
    columnSettingsTitle: 'Налаштування колонок',
    showAllText: 'Показати всі',
    hideAllText: 'Приховати всі',
    resetWidthsText: 'Скинути ширину',
    resetAllText: 'Скинути налаштування',
    closeText: 'Закрити',
    noColumnsText: 'Немає колонок',
    widthLabel: 'px',
  }"
/>
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headers` | `TableHeader[]` | `[]` | Column definitions (required) |
| `items` | `Record<string, unknown>[]` | `[]` | Row data (required) |
| `sortTable` | `TableSort` | `{ by: undefined, dir: 'asc' }` | Current sort state (supports `v-model`) |
| `tableId` | `string` | `''` | Unique ID for localStorage persistence |
| `keyRow` | `string` | `'id'` | Property name used as row key |
| `serverSort` | `boolean` | `false` | Disable client-side sorting, emit `server-sort` instead |
| `virtualScroll` | `boolean` | `false` | Enable virtual scrolling |
| `rowHeight` | `number` | `36` | Row height in pixels (for virtual scroll) |
| `virtualScrollMaxHeight` | `string` | `'70vh'` | Max height of scrollable container |
| `virtualScrollBuffer` | `number` | `5` | Extra rows rendered above/below viewport |
| `texts` | `FlexTableTexts` | `{}` | Custom text labels for i18n |

### TableHeader

```ts
interface TableHeader {
  text: string       // Display name
  value: string      // Data property key
  width?: number     // Column width in pixels (default: 100)
  sortable?: boolean // Enable sorting for this column
  visible?: boolean  // Initial visibility (default: true)
}
```

### TableSort

```ts
interface TableSort {
  by?: string        // Sort field name
  dir?: 'asc' | 'desc'  // Sort direction
}
```

### FlexTableTexts

| Prop | Default | Description |
|------|---------|-------------|
| `emptyText` | `'No data'` | Text shown when table has no items |
| `columnSettingsTitle` | `'Column Settings'` | Title of the column settings modal |
| `showAllText` | `'Show all'` | Button text to show all columns |
| `hideAllText` | `'Hide all'` | Button text to hide all columns |
| `resetWidthsText` | `'Reset widths'` | Button text to reset column widths |
| `resetAllText` | `'Reset all'` | Button text to reset all settings |
| `closeText` | `'Close'` | Close button text |
| `noColumnsText` | `'No columns to configure'` | Text when no columns available |
| `widthLabel` | `'px'` | Width unit label |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:sortTable` | `TableSort` | Sort state changed (for `v-model`) |
| `update:headers` | `TableHeader[]` | Headers changed (visibility, width, order) |
| `rowClick` | `Record<string, unknown>` | Row was clicked |
| `server-sort` | `TableSort` | Sort requested (only when `serverSort` is `true`) |

### Slots

| Slot | Props | Description |
|------|-------|-------------|
| `header-{value}` | `{ header: TableHeader }` | Custom header cell content |
| `cell-{value}` | `{ item: Record, header: TableHeader }` | Custom body cell content |

## License

MIT
