# [E-7-7] SOLID 在 TypeScript 中的實踐：用型別系統強化設計原則

> **目標**：理解怎麼用 TypeScript 的型別系統（尤其 interface）來具體實踐 SOLID 原則，讓設計原則不只是理論。

## 把 SOLID 落地到 TypeScript

你學過 SOLID 五原則（E-7-1~6）。它們是「思維原則」，但 TypeScript 的**型別系統**（尤其 `interface`）能幫你把它們**具體地落實在程式碼裡**。這篇看幾個關鍵的對應。

## ① 用 interface 實踐「依賴反轉（DIP）」

DIP（E-7-6）說「依賴抽象，不依賴實作」。在 TypeScript，「抽象」就是 **interface**：

```typescript
// 抽象（介面）——高層依賴這個，不依賴具體實作
interface PaymentGateway {
  charge(amount: number): Promise<boolean>;
}

// 具體實作——可以有很多種，都實作同一個介面
class StripeGateway implements PaymentGateway { ... }
class PayPalGateway implements PaymentGateway { ... }

// 業務邏輯「依賴介面」，不依賴具體（DIP！）
class OrderService {
  constructor(private gateway: PaymentGateway) {}   // 注入抽象
  // OrderService 不知道、也不在乎是 Stripe 還是 PayPal
}
```

`OrderService` 依賴 `PaymentGateway`（抽象介面），不依賴 `StripeGateway`（具體）。要換金流？傳不同實作進去就好，`OrderService` 一行不用改。**TypeScript 的 interface 讓 DIP 變得具體可執行。**

## ② 用 interface 實踐「介面隔離（ISP）」

ISP（E-7-5）說「介面要小而專，不要大而全」。TypeScript 讓你能定義**小而專的介面**，並組合：

```typescript
// ❌ 大而全的介面——逼實作者實作用不到的方法
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
}
// 機器人 implements Worker → 但機器人不用 eat/sleep，被逼實作空方法

// ✅ 小而專的介面——各取所需
interface Workable { work(): void; }
interface Eatable { eat(): void; }

class Human implements Workable, Eatable { ... }   // 組合需要的
class Robot implements Workable { ... }            // 只要 work
```

把大介面拆成小介面，實作者只實作「真正需要的」。TypeScript 支援「實作多個介面」，讓 ISP 很自然。

## ③ 型別讓「開放封閉（OCP）」更安全

OCP（E-7-3）說「對擴充開放、對修改封閉」。配合介面，新增功能 = 新增一個實作，不改既有：

```typescript
interface Shape { area(): number; }
class Circle implements Shape { ... }
class Square implements Shape { ... }
// 新增「三角形」？→ 新增 class Triangle implements Shape
// 既有的 Circle/Square 和用到 Shape 的程式，一行不用改（OCP）
```

而且 TypeScript 的型別檢查會**保證**「新的實作符合介面」——編譯時就抓出「忘了實作某方法」，讓擴充更安全。

## ④ strict 模式強化整體品質

TypeScript 的 `strict` 模式（E-6-4、basic Part 2）本身就是在強化好設計：

- **禁止隱式 any**：逼你想清楚型別（介面），不偷懶。
- **null 檢查**：逼你處理「可能沒有值」的情況，避免一堆 null 錯誤。

這讓你的程式碼更嚴謹，間接支持了 SOLID（清楚的型別 = 清楚的契約 = 更好的抽象）。

## 核心觀念：型別 = 契約

把這些串起來，一個核心洞察：

> **TypeScript 的型別（尤其 interface）就是「契約」——它明確定義了「誰該提供什麼、誰依賴什麼」。** 而 SOLID 的核心，正是「設計好這些契約與依賴關係」。所以 TypeScript 的型別系統，是實踐 SOLID 的絕佳工具。

相比 JavaScript（沒有型別、契約靠約定），TypeScript 讓「依賴抽象、介面隔離」這些 SOLID 原則，從「靠自律」變成「**型別系統幫你檢查、強制**」。這是強型別語言（也包括 csharp，csharp Part 2-5）實踐 SOLID 的優勢。

## 小結

- TypeScript 的型別系統（尤其 `interface`）讓 SOLID 從理論變成可執行的程式碼。
- **DIP**：用 interface 當抽象，業務依賴介面不依賴實作（可注入）。
- **ISP**：定義小而專的介面、組合使用。
- **OCP**：新增實作不改既有，型別檢查保證符合介面。
- **strict 模式**強化整體嚴謹度。
- 核心：**型別 = 契約**，而 SOLID 就是設計好契約與依賴。

> SOLID 各原則 → [E-7-1 總覽](./E-7-1-solid-overview.md)、[E-7-5 ISP](./E-7-5-isp.md)、[E-7-6 DIP](./E-7-6-dip.md)；TypeScript 最佳實踐 → [E-6-4](../E-6-best-practices/E-6-4-typescript-best-practices.md)
