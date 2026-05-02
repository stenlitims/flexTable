export interface TableHeader {
  text: string
  value: string
  width?: number
  sortable?: boolean
  visible?: boolean
}

export interface TableSort {
  by?: string
  dir?: 'asc' | 'desc'
}

export interface FlexTableTexts {
  /** Text shown when table has no items. Default: "No data" */
  emptyText?: string
  /** Title of the column settings modal. Default: "Column Settings" */
  columnSettingsTitle?: string
  /** Button text to show all columns. Default: "Show all" */
  showAllText?: string
  /** Button text to hide all columns. Default: "Hide all" */
  hideAllText?: string
  /** Button text to reset column widths. Default: "Reset widths" */
  resetWidthsText?: string
  /** Button text to reset all settings. Default: "Reset all" */
  resetAllText?: string
  /** Close button text. Default: "Close" */
  closeText?: string
  /** Text when no columns available. Default: "No columns to configure" */
  noColumnsText?: string
  /** Width unit label. Default: "px" */
  widthLabel?: string
}
