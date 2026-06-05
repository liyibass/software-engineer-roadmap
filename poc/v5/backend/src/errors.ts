// 自訂錯誤類別 —— 讓 Service 層能用「語意」表達錯誤，
// Controller 再把這些語意翻譯成對應的 HTTP 狀態碼。
//
// 這樣 Service 不需要知道任何 HTTP 細節（保持分層乾淨），
// 但又能精準表達「找不到」「沒權限」「輸入不對」的差別。

export class NotFoundError extends Error {}
export class ForbiddenError extends Error {}
export class ValidationError extends Error {}
