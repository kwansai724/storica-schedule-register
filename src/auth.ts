import { Browser, Page, chromium } from "playwright";
import { existsSync } from "fs";
import { log } from "./utils.js";

const SESSION_PATH = "session.json";
const BASE_URL = "https://www.street-academy.com";

export interface AuthResult {
  browser: Browser;
  page: Page;
}

export async function login(headless: boolean): Promise<AuthResult> {
  log("ブラウザを起動中...");
  const browser = await chromium.launch({ headless });

  const hasSession = existsSync(SESSION_PATH);
  if (!hasSession) {
    await browser.close();
    throw new Error(
      "session.json が見つかりません。ストアカにログインしてセッションを保存してください"
    );
  }

  log("保存済みセッションを使用...");
  const context = await browser.newContext({
    locale: "ja-JP",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    storageState: SESSION_PATH,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);

  try {
    log("セッションの有効性を確認中...");
    await page.goto(`${BASE_URL}/dashboard/organizers/schedule_list`, {
      waitUntil: "domcontentloaded",
    });

    // ログインページにリダイレクトされていないか確認
    const currentUrl = page.url();
    if (currentUrl.includes("/login") || currentUrl.includes("/users/sign_in")) {
      await browser.close();
      throw new Error(
        "セッションが期限切れです。session.json を更新してください"
      );
    }

    log("ログイン成功（セッション再利用）");
    return { browser, page };
  } catch (error) {
    await browser.close();
    throw error;
  }
}
