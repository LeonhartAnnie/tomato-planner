# Cloudflare Pages Deployment

Tomato Planner 是純前端 Vite PWA，不需要後端或 Cloudflare Functions。本文件只描述
Cloudflare Pages production readiness；實際部署與 Google Cloud 設定仍需由專案擁有者
在對應 dashboard 完成。

## 1. 建立 Cloudflare Pages 專案

1. 登入 Cloudflare Dashboard，進入 **Workers & Pages**。
2. 建立 Pages application，選擇連接 Git repository。
3. 授權並選取 Tomato Planner 的 GitHub repository。
4. 選擇要部署的 production branch。

## 2. Build 設定

| 項目 | 設定值 |
| --- | --- |
| Framework preset | `Vite`；若無此選項可使用 `None` |
| Root directory | 專案根目錄 |
| Build command | `npm run build` |
| Build output directory | `dist` |

目前假設 Tomato 專案根目錄就是 repository 的部署根目錄。若 repository 外層還有其他
專案，Root directory 必須改成實際包含 `package.json` 與 `vite.config.ts` 的目錄。

Cloudflare 應使用 npm 安裝 lockfile 依賴；不要在 build command 改用 pnpm。

## 3. Production environment variable

在 Pages project 的 production environment variables 設定：

```text
VITE_GOOGLE_CLIENT_ID=Google OAuth Web Client ID
```

不要把真實 Client ID 寫入 `.env.example` 或 commit `.env.local`。若要在 preview
deployment 測試 Google OAuth，也需在 Preview environment 設定同一變數。

## 4. Google Cloud Console

1. 建立或使用 Web application 類型的 OAuth Client ID。
2. 啟用 Google Calendar API 與 Google Drive API。
3. OAuth consent screen 若仍在 Testing，將 QA 帳號加入 Test users。
4. 在 Authorized JavaScript origins 加入 production origin，例如：

   ```text
   https://your-project.pages.dev
   ```

5. 若使用自訂網域，也加入該 HTTPS origin：

   ```text
   https://your-domain.example
   ```

只加入 origin，不要附加 `/settings` 等 path，也不要加結尾路由。協定、網域與 port
必須和實際瀏覽器 origin 一致。

目前 scopes：

- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/drive.appdata`

專案不使用 full Drive scope，也不寫入 Google Calendar。

## 5. SPA routing

專案使用 React Router 的 `createBrowserRouter`。目前輸出中沒有頂層 `404.html`，也沒有
自訂 `_redirects`；Cloudflare Pages 會以 SPA fallback 將無對應靜態檔案的路徑交回
根頁面，因此 `/tasks`、`/schedule`、`/pomodoro` 與 `/settings` 重新整理後應能載入。

若日後新增頂層 `404.html`、Pages Functions 或自訂 redirects，必須重新驗證 deep-link
reload，避免覆蓋 SPA fallback。現階段不需要修改 router，也不需要額外 `_redirects`。

## 6. PWA production readiness

- Manifest：`Tomato Planner`／`Tomato`、`zh-TW`，standalone display。
- Icon：`public/tomato.svg`，build 後會複製至 `dist`。
- Service worker：由 `vite-plugin-pwa` 在 production build 產生。
- Cloudflare Pages production URL 預設使用 HTTPS，符合 service worker 要求。
- 更新部署後，既有瀏覽器可能要重新整理，或等待 auto-update service worker 啟用新版。

正式發布前仍應在 Chrome desktop、手機 viewport 與可安裝環境檢查 icon、安裝提示、
離線殼層與新版 service worker 更新流程。

## 7. Preview URL 注意事項

每個 preview deployment 可能使用不同的 `pages.dev` origin。Google OAuth 只接受已登記
的精確 origin，因此 preview URL 適合優先測 UI、routing 與 PWA assets。需要測 OAuth
時，必須將實際 preview origin 加入 Authorized JavaScript origins；不要使用萬用 path。

建議至少使用固定 production URL 與 `http://localhost:5173` 完成 Google OAuth QA。

## 8. 部署後 Manual QA

- [ ] 首頁與所有導覽頁面可開啟。
- [ ] 在 `/tasks`、`/schedule`、`/pomodoro`、`/settings` 直接重新整理仍正常。
- [ ] Web manifest、icon、service worker 與 PWA assets 可載入。
- [ ] Google Calendar 可授權並匯入未來 7 天行程。
- [ ] Google Drive 可上傳本機備份。
- [ ] Google Drive 可從雲端還原，且安全確認摘要正確。
- [ ] 缺少 Client ID、網路錯誤與 popup 阻擋時顯示友善訊息。
- [ ] 手機尺寸可操作 Task、Schedule、TimeGrid、Pomodoro 與 dialogs。

完整 release 檢查請見 [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md)。
