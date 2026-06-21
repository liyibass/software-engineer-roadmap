# Exercise-1：用 TypeScript 建立聯絡人管理系統

> **練習目標**：再次練習 TypeScript 的型別、介面、函式、泛型、模組、Utility Types，用不同的情境鞏固這些概念。
>
> **對應章節**：[2-1 JS vs TS] · [2-2 基本型別] · [2-3 複合型別] · [2-4 介面與型別別名] · [2-5 函式] · [2-6 泛型] · [2-7 模組] · [2-8 Utility Types]

---

## 你將完成什麼

建立一個「聯絡人管理系統」，支援：

- 新增、搜尋、更新、刪除聯絡人
- 用 TypeScript 嚴格定義聯絡人資料結構（含選填欄位）
- 用泛型建立統一的操作回應格式
- 用 Utility Types 處理「更新部分資料」的情境

---

## 步驟

### 步驟 1：建立 TypeScript 專案

```bash
mkdir contact-manager
cd contact-manager
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
  "start": "ts-node src/index.ts"
}
```

```bash
mkdir src
```

### 步驟 2：定義資料型別（types.ts）

建立 `src/types.ts`，**手動輸入**：

```typescript
export type ContactGroup = "family" | "friend" | "work" | "other";

export interface PhoneNumber {
  type: "mobile" | "home" | "work";
  number: string;
}

export interface Contact {
  id: number;
  name: string;
  phones: PhoneNumber[];
  email?: string;
  group: ContactGroup;
  notes?: string;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

思考以下問題：
- `email` 和 `notes` 為什麼加 `?`？什麼時候會沒有 email？
- `phones` 是 `PhoneNumber[]` 而不是 `string[]`，這樣做有什麼好處？
- `ContactGroup` 為什麼用 union 型別而不是 `string`？

### 步驟 3：實作聯絡人功能（contacts.ts）

建立 `src/contacts.ts`，**手動輸入**：

```typescript
import { Contact, ContactGroup, OperationResult, PhoneNumber } from "./types";

const contacts: Contact[] = [];
let nextId = 1;

export function addContact(
  name: string,
  phones: PhoneNumber[],
  group: ContactGroup,
  email?: string,
  notes?: string
): OperationResult<Contact> {
  const isDuplicate = contacts.some(
    (contact) => contact.name === name
  );
  if (isDuplicate) {
    return { success: false, error: `已有名叫「${name}」的聯絡人` };
  }

  if (phones.length === 0) {
    return { success: false, error: "至少需要一個電話號碼" };
  }

  const newContact: Contact = {
    id: nextId++,
    name,
    phones,
    group,
    email,
    notes
  };
  contacts.push(newContact);
  return { success: true, data: newContact };
}

export function searchContacts(keyword: string): OperationResult<Contact[]> {
  const results = contacts.filter((contact) => {
    const nameMatch = contact.name.includes(keyword);
    const emailMatch = contact.email?.includes(keyword) ?? false;
    return nameMatch || emailMatch;
  });

  if (results.length === 0) {
    return { success: false, error: `找不到包含「${keyword}」的聯絡人` };
  }
  return { success: true, data: results };
}

export function getContactsByGroup(group: ContactGroup): Contact[] {
  return contacts.filter((contact) => contact.group === group);
}

export function deleteContact(contactId: number): OperationResult<Contact> {
  const index = contacts.findIndex((contact) => contact.id === contactId);

  if (index === -1) {
    return { success: false, error: `找不到 ID 為 ${contactId} 的聯絡人` };
  }

  const deleted = contacts.splice(index, 1)[0];
  return { success: true, data: deleted };
}

export function getAllContacts(): Contact[] {
  return [...contacts];
}
```

### 步驟 4：新增更新功能（使用 Utility Types）

在 `src/contacts.ts` 底部繼續新增：

```typescript
type ContactUpdateFields = Partial<Pick<Contact, "email" | "notes" | "group">>;

export function updateContact(
  contactId: number,
  updates: ContactUpdateFields
): OperationResult<Contact> {
  const contact = contacts.find((c) => c.id === contactId);

  if (!contact) {
    return { success: false, error: `找不到 ID 為 ${contactId} 的聯絡人` };
  }

  if (updates.email !== undefined) contact.email = updates.email;
  if (updates.notes !== undefined) contact.notes = updates.notes;
  if (updates.group !== undefined) contact.group = updates.group;

  return { success: true, data: contact };
}

export function addPhoneToContact(
  contactId: number,
  phone: PhoneNumber
): OperationResult<Contact> {
  const contact = contacts.find((c) => c.id === contactId);

  if (!contact) {
    return { success: false, error: `找不到 ID 為 ${contactId} 的聯絡人` };
  }

  contact.phones.push(phone);
  return { success: true, data: contact };
}
```

思考：`Partial<Pick<Contact, "email" | "notes" | "group">>` 做了什麼事？
- `Pick<Contact, "email" | "notes" | "group">` → 只保留這三個欄位
- `Partial<...>` → 讓這三個欄位都變成選填

為什麼更新時不允許改 `id`、`name`、`phones`？

### 步驟 5：建立主程式（index.ts）

建立 `src/index.ts`，**手動輸入**：

```typescript
import {
  addContact,
  searchContacts,
  getContactsByGroup,
  updateContact,
  addPhoneToContact,
  deleteContact,
  getAllContacts
} from "./contacts";

function show<T>(
  label: string,
  result: { success: boolean; data?: T; error?: string }
): void {
  if (result.success) {
    console.log(`✓ ${label}：`, JSON.stringify(result.data, null, 2));
  } else {
    console.log(`✗ ${label} 失敗：${result.error}`);
  }
}

console.log("=== 聯絡人管理系統 ===\n");

// 新增聯絡人
show("新增家人",
  addContact(
    "媽媽",
    [{ type: "mobile", number: "0912-345-678" }],
    "family",
    "mom@example.com"
  )
);

show("新增朋友",
  addContact(
    "小明",
    [
      { type: "mobile", number: "0987-654-321" },
      { type: "home", number: "02-1234-5678" }
    ],
    "friend"
  )
);

show("新增同事",
  addContact(
    "王主任",
    [{ type: "work", number: "02-9876-5432" }],
    "work",
    "wang@company.com",
    "每週一開會"
  )
);

show("新增重複名稱（應該失敗）",
  addContact("媽媽", [{ type: "mobile", number: "0000-000-000" }], "family")
);

// 列出所有聯絡人
console.log("\n--- 所有聯絡人 ---");
getAllContacts().forEach((c) => {
  const phone = c.phones[0].number;
  console.log(`  [${c.id}] ${c.name} (${c.group}) — ${phone}`);
});

// 搜尋
console.log("\n--- 搜尋操作 ---");
show("搜尋「王」", searchContacts("王"));
show("搜尋不存在的關鍵字", searchContacts("張三李四"));

// 依群組列出
console.log("\n--- 依群組篩選（朋友） ---");
const friends = getContactsByGroup("friend");
console.log(`  找到 ${friends.length} 個朋友：`, friends.map((c) => c.name));

// 更新聯絡人
console.log("\n--- 更新操作 ---");
show("更新小明的備註", updateContact(2, { notes: "喜歡打籃球" }));
show("把小明移到 work 群組", updateContact(2, { group: "work" }));

// 新增電話
console.log("\n--- 新增電話 ---");
show("給媽媽新增公司電話",
  addPhoneToContact(1, { type: "work", number: "02-1111-2222" })
);

// 刪除聯絡人
console.log("\n--- 刪除操作 ---");
show("刪除小明", deleteContact(2));
show("再次刪除（應該失敗）", deleteContact(2));
```

### 步驟 6：執行並確認

```bash
npm start
```

逐一確認每個操作的輸出是否符合預期，特別注意：
- 新增重複名稱的聯絡人有顯示錯誤嗎？
- 更新操作只改了指定的欄位，其他欄位沒有被清空嗎？
- 刪除後再刪除同一個 ID 有顯示錯誤嗎？

---

## 完成確認

- [ ] TypeScript 專案設定正確，`npm start` 不報型別錯誤
- [ ] `Contact` 介面的選填欄位（`email?`、`notes?`）正確定義
- [ ] `OperationResult<T>` 泛型在各函式中正確使用
- [ ] 能說出 `Partial<Pick<Contact, "email" | "notes" | "group">>` 的意思
- [ ] 程式碼分成 `types.ts`、`contacts.ts`、`index.ts` 三個模組
- [ ] 所有錯誤情況（重複名稱、找不到 ID）都有正確回應

---

## 延伸挑戰

1. 新增 `sortContacts(field: "name" | "group"): Contact[]` 函式，依指定欄位排序所有聯絡人
2. 用 `Record<ContactGroup, Contact[]>` 建立一個 `groupAllContacts()` 函式，把聯絡人依群組分類成一個物件
3. 新增 `importContacts(data: unknown): OperationResult<Contact[]>` 函式，接受任意輸入並驗證格式（需要處理 `unknown` 型別的資料驗證）
