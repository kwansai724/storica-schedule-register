import { loadConfig } from "./config.js";
import { login } from "./auth.js";
import { registerSchedules } from "./register.js";
import { notifyResults } from "./notify.js";
import { log, safeScreenshot } from "./utils.js";

async function main(): Promise<void> {
  log("ストアカ日程登録を開始します");

  // 1. 設定読み込み
  const config = loadConfig();
  const { schedules, webhook_url } = config.payload;

  if (schedules.length === 0) {
    log("登録対象のスケジュールがありません。終了します。");
    return;
  }

  log(`登録対象: ${schedules.length}件`);

  // 2. ブラウザ起動・セッション検証
  const { browser, page } = await login(config.headless);

  try {
    // 3. 日程登録実行
    const results = await registerSchedules(page, schedules);

    // 4. GAS webhookに結果送信
    await notifyResults(webhook_url, results);

    log("すべての処理が完了しました");
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    log(`致命的エラー: ${errMsg}`);
    await safeScreenshot(page, "fatal-error");

    // エラー時も結果を通知（全件エラー）
    const errorResults = schedules.map((s) => ({
      id: s.id,
      status: "error" as const,
      error: errMsg,
    }));
    await notifyResults(webhook_url, errorResults);

    throw error;
  } finally {
    await browser.close();
    log("ブラウザを閉じました");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
