import './flex-table.css'

import type { App } from 'vue'
import FlexTable from './components/FlexTable.vue'
import FlexTableColumnSettings from './components/FlexTableColumnSettings.vue'

export { FlexTable, FlexTableColumnSettings }
export type { TableHeader, TableSort, FlexTableTexts } from './types'

export const FlexTablePlugin = {
  install(app: App) {
    app.component('FlexTable', FlexTable)
    app.component('FlexTableColumnSettings', FlexTableColumnSettings)
  },
}

export default FlexTablePlugin
