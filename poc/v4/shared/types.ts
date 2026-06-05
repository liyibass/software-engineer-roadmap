// 前後端共用的型別定義 —— 整個專案對「一筆待辦長什麼樣」的唯一事實來源。
//
// 前端和後端都用 `import type { Todo } from "../../shared/types"` 引入這份定義。
// 改這裡一次，兩邊同步；不會再像 V2/V3 那樣前後端各維護一份、容易不同步。

export interface Todo {
  id: number
  text: string
  completed: boolean
}
