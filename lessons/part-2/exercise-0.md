# Exercise-0：用 TypeScript 建立圖書館管理系統

> **練習目標**：建立一個完整的 TypeScript 專案，實際應用型別、介面、函式、泛型、模組、Utility Types 等概念。
>
> **對應章節**：[2-1 JS vs TS] · [2-2 基本型別] · [2-3 複合型別] · [2-4 介面與型別別名] · [2-5 函式] · [2-6 泛型] · [2-7 模組] · [2-8 Utility Types]

---

## 你將完成什麼

建立一個「圖書館管理系統」，支援：

- 新增書籍、查詢書籍、借出/歸還書籍
- 用 TypeScript 介面嚴格定義資料結構
- 用泛型建立統一的回應格式
- 將程式碼拆分到不同模組

---

## 步驟

### 步驟 1：建立 TypeScript 專案

```bash
mkdir library-system
cd library-system
npm init -y
npm install --save-dev typescript ts-node @types/node
code .
```

建立 `tsconfig.json`，**手動輸入**：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

在 `package.json` 的 `scripts` 加入：

```json
"scripts": {
  "start": "ts-node src/index.ts",
  "test": "ts-node src/index.ts"
}
```

建立 `src` 資料夾：

```bash
mkdir src
```

### 步驟 2：定義資料型別（types.ts）

建立 `src/types.ts`，**手動輸入**：

```typescript
export type BookStatus = "available" | "borrowed";

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  borrowedBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

思考一下：
- 為什麼 `status` 用 `BookStatus` 型別而不是直接用 `string`？
- 為什麼 `borrowedBy` 要加 `?`？什麼時候它會是 `undefined`？
- `ApiResponse<T>` 的 `<T>` 是什麼意思？`T` 可以是什麼？

### 步驟 3：實作書籍功能（books.ts）

建立 `src/books.ts`，**手動輸入**：

```typescript
import { Book, ApiResponse } from "./types";

const books: Book[] = [];
let nextId = 1;

export function addBook(
  title: string,
  author: string,
  isbn: string
): ApiResponse<Book> {
  const isDuplicate = books.some((book) => book.isbn === isbn);
  if (isDuplicate) {
    return { success: false, error: `ISBN ${isbn} 已存在` };
  }

  const newBook: Book = {
    id: nextId++,
    title,
    author,
    isbn,
    status: "available"
  };
  books.push(newBook);
  return { success: true, data: newBook };
}

export function findBookByTitle(title: string): ApiResponse<Book[]> {
  const results = books.filter((book) =>
    book.title.toLowerCase().includes(title.toLowerCase())
  );

  if (results.length === 0) {
    return { success: false, error: `找不到標題包含「${title}」的書` };
  }
  return { success: true, data: results };
}

export function borrowBook(bookId: number, borrowerName: string): ApiResponse<Book> {
  const book = books.find((book) => book.id === bookId);

  if (!book) {
    return { success: false, error: `找不到 ID 為 ${bookId} 的書` };
  }
  if (book.status === "borrowed") {
    return { success: false, error: `《${book.title}》目前被 ${book.borrowedBy} 借走了` };
  }

  book.status = "borrowed";
  book.borrowedBy = borrowerName;
  return { success: true, data: book };
}

export function returnBook(bookId: number): ApiResponse<Book> {
  const book = books.find((book) => book.id === bookId);

  if (!book) {
    return { success: false, error: `找不到 ID 為 ${bookId} 的書` };
  }
  if (book.status === "available") {
    return { success: false, error: `《${book.title}》沒有被借出` };
  }

  book.status = "available";
  book.borrowedBy = undefined;
  return { success: true, data: book };
}

export function getAllBooks(): Book[] {
  return [...books];
}
```

### 步驟 4：實作更新書籍資訊（使用 Utility Type）

在 `src/books.ts` 底部新增這個函式：

```typescript
export function updateBook(
  bookId: number,
  updates: Partial<Pick<Book, "title" | "author">>
): ApiResponse<Book> {
  const book = books.find((book) => book.id === bookId);

  if (!book) {
    return { success: false, error: `找不到 ID 為 ${bookId} 的書` };
  }

  if (updates.title !== undefined) book.title = updates.title;
  if (updates.author !== undefined) book.author = updates.author;

  return { success: true, data: book };
}
```

思考：
- `Partial<Pick<Book, "title" | "author">>` 是什麼意思？
- 為什麼不讓使用者更新 `id`、`isbn`、`status`？

### 步驟 5：建立主程式（index.ts）

建立 `src/index.ts`，**手動輸入**：

```typescript
import {
  addBook,
  findBookByTitle,
  borrowBook,
  returnBook,
  updateBook,
  getAllBooks
} from "./books";

// 輔助函式：顯示操作結果
function showResult<T>(label: string, response: { success: boolean; data?: T; error?: string }): void {
  if (response.success) {
    console.log(`✓ ${label}：`, JSON.stringify(response.data, null, 2));
  } else {
    console.log(`✗ ${label} 失敗：${response.error}`);
  }
}

console.log("=== 圖書館管理系統 ===\n");

// 新增書籍
showResult("新增書籍", addBook("深入淺出 JavaScript", "David Flanagan", "978-0596517748"));
showResult("新增書籍", addBook("你不知道的 JavaScript", "Kyle Simpson", "978-1491924464"));
showResult("新增書籍", addBook("Clean Code", "Robert C. Martin", "978-0132350884"));
showResult("新增重複書籍（應該失敗）", addBook("Clean Code 副本", "某人", "978-0132350884"));

console.log("\n--- 所有書籍 ---");
getAllBooks().forEach((book) => {
  console.log(`  [${book.id}] ${book.title} — ${book.author} (${book.status})`);
});

// 借書
console.log("\n--- 借書操作 ---");
showResult("小明借書", borrowBook(1, "小明"));
showResult("再次借同一本（應該失敗）", borrowBook(1, "小華"));

// 歸還
console.log("\n--- 歸還操作 ---");
showResult("小明還書", returnBook(1));
showResult("再次歸還（應該失敗）", returnBook(1));

// 查詢
console.log("\n--- 查詢操作 ---");
showResult("搜尋 JavaScript", findBookByTitle("JavaScript"));
showResult("搜尋不存在的書", findBookByTitle("Python 入門"));

// 更新書籍資訊
console.log("\n--- 更新書籍資訊 ---");
showResult("更新書籍標題", updateBook(2, { title: "你不知道的 JS（上）" }));
```

### 步驟 6：執行並確認結果

```bash
npm start
```

確認每個操作的輸出都符合預期：
- 新增重複 ISBN 的書應該失敗
- 借出的書再借一次應該失敗
- 歸還後再歸還應該失敗
- 搜尋不存在的書應該失敗並顯示錯誤訊息

---

## 完成確認

- [ ] TypeScript 專案設定正確，`npm start` 不報型別錯誤
- [ ] `Book` 介面的所有欄位型別正確（特別是 `borrowedBy?: string`）
- [ ] `ApiResponse<T>` 泛型能在 `books.ts` 和 `index.ts` 中正確使用
- [ ] 六個操作（新增、查詢、借書、還書、更新、錯誤處理）都有正確輸出
- [ ] 程式碼分成 `types.ts`、`books.ts`、`index.ts` 三個模組

---

## 延伸挑戰

1. 新增 `getBooksByStatus(status: BookStatus): Book[]` 函式，列出所有「可借閱」或「已借出」的書
2. 新增 `getBorrowHistory` 功能：每次借書時記錄（借書人、借出時間），還書時記錄歸還時間
3. 用 `Readonly<Book>` 建立一個「唯讀書籍視圖」，確保外部呼叫者不能直接修改書籍資料
