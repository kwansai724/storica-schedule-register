import { log } from "./utils.js";

export interface ScheduleResult {
  id: string;
  status: "done" | "error";
  error?: string;
}

/**
 * GAS webhookに結果をPOSTする
 */
export async function notifyResults(
  webhookUrl: string,
  results: ScheduleResult[]
): Promise<void> {
  if (!webhookUrl) {
    log("webhook_url が未設定のため、結果通知をスキップします");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });

    if (response.ok) {
      const doneCount = results.filter((r) => r.status === "done").length;
      const errorCount = results.filter((r) => r.status === "error").length;
      log(`GAS webhook 送信成功（done: ${doneCount}, error: ${errorCount}）`);
    } else {
      log(`GAS webhook 送信失敗: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    log(`GAS webhook 送信エラー: ${e}`);
  }
}
