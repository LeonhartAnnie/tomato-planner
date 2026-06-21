# Tomato Planner

React、Vite 與 TypeScript 建立的 PWA 番茄鐘排程工具。資料預設儲存在本機
IndexedDB；Google Calendar 僅供唯讀匯入，Google Drive 提供手動備份與還原。

## 本機啟動

需求：Node.js 與 npm。

1. 安裝依賴：

   ```bash
   npm install
   ```

2. 複製環境變數範本：

   ```bash
   cp .env.example .env.local
   ```

   PowerShell 也可使用：

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. 在 `.env.local` 填入 Google OAuth Web Client ID：

   ```bash
   VITE_GOOGLE_CLIENT_ID=你的_Google_OAuth_Client_ID
   ```

   Calendar 與 Drive 共用同一個 Web Client ID。`.env.local` 包含本機設定，已由
   `.gitignore` 排除，不應 commit。

4. 啟動開發環境：

   ```bash
   npm run dev
   ```

5. 執行測試與正式建置：

   ```bash
   npm run test:run
   npm run build
   npm run preview
   ```

`npm run preview` 用於檢查 `dist` 的 production build，不取代正式部署。

## Google Cloud Console 設定

1. 啟用 Google Calendar API。
2. 啟用 Google Drive API。
3. 設定 OAuth consent screen；Testing 狀態下將實機測試帳號加入 Test users。
4. 建立 OAuth Client ID，Application type 選擇 Web application。
5. 在 Authorized JavaScript origins 加入實際前端 origin。本機 Vite 預設為：

   ```text
   http://localhost:5173
   ```

   正式環境需加入實際 HTTPS origin。協定、網域與連接埠必須和瀏覽器開啟的網址
   完全一致。

### OAuth scopes

目前只使用以下最小 scopes：

- Google Calendar：`https://www.googleapis.com/auth/calendar.readonly`
  - 讀取 primary calendar 未來 7 天事件。
- Google Drive：`https://www.googleapis.com/auth/drive.appdata`
  - 在應用程式專屬 `appDataFolder` 讀寫備份檔。

專案不使用 `https://www.googleapis.com/auth/drive` full Drive scope，也不會新增、
修改或刪除 Google Calendar 行程。

## MVP 功能範圍

目前包含：

- 本機 Task CRUD。
- 手動 Schedule 與未來 7 天排程視圖。
- Google Calendar read-only 匯入與 CalendarEvent readonly 顯示。
- 本機排程與外部事件的時間衝突標記。
- Pomodoro focus、short break、long break 基本循環。
- 番茄鐘與排程顯示 Settings。
- Google Drive appDataFolder 覆蓋式手動備份與還原。

目前不包含：

- Google Calendar 寫入。
- 自動排程。
- 拖曳排程。
- 自動或背景同步。
- 自動合併或自動 LWW 同步 UI。
- CalendarEvent 同步到 Google Drive。
- activeTimer 跨裝置同步。

## Google Calendar 本機資料

Schedule 頁面的「清除外部行程」只清除本機 IndexedDB 中匯入的
`CalendarEvent`，不會刪除或修改 Google Calendar 上的事件。CalendarEvent 在 UI
維持 readonly。

## Google Drive 備份架構

Cloud backup JSON 目前使用 `CloudBackupData` version 1。Drive 讀取的文字必須依序
通過 JSON parsing、version migration 與 runtime validation，格式錯誤、含禁止同步
欄位或不支援版本的備份不會匯入本機。

Production 組合路徑：

```text
LocalAppDataDexieRepository
  → uploadLocalBackup / restoreCloudBackup
  → CloudBackupJsonRepository
  → GoogleDriveCloudBackupTextStorage
  → Google Drive appDataFolder
```

`GoogleDriveCloudBackupTextStorage` 只處理 appDataFolder 的 string I/O；
`CloudBackupJsonRepository` 負責 JSON codec 與 validation；application use cases
負責明確的上傳或還原；Dexie adapter 負責本機 transaction。

`CloudBackupData.updatedAt` 代表 app-owned data 的最後修改時間，不代表同步按鈕的
點擊時間。它取 Task／ScheduledBlock 的最新 `updatedAt`，以及 PomodoroSession 的
`endedAt`（沒有時使用 `startedAt`）；沒有可用內容時間時使用 Unix epoch。
`uploadedAt`／`restoredAt` 代表本次操作時間。既有 `syncWithCloudBackup` 與 LWW
邏輯保留在 application 層供後續演進，但不再作為 MVP UI 的主要操作。

目前 Settings model 沒有 `updatedAt`，因此只有 Settings 發生變更時，無法精準推進
backup 的內容修改時間。相同限制也適用於沒有保留 tombstone／獨立修改 metadata 的
純刪除操作；後續應以 app-level data revision metadata 補齊，而不是把同步時間重新
當成內容修改時間。

Settings 頁面的 SyncPanel 只讀取 `syncStore`，提供兩個方向：

- 「上傳本機備份」：用目前本機 Task、Schedule、Settings 與 PomodoroSession
  完整覆蓋 Google Drive 備份。刪除本機資料後使用此操作，可將刪除結果保存到雲端。
- 「從雲端還原」：用 Google Drive 備份完整覆蓋目前裝置的本機 app-owned data。

兩個操作都不會自動合併，執行前必須確認。UI 不直接操作 token、Drive API、JSON
codec、repositories、Dexie 或 application use case。備份不包含 CalendarEvent、
activeTimer、nextStep 或 lastCompletedSession。未來若要恢復可靠的智慧同步，必須先
加入 app-level revision metadata 與 deletion tombstone。

## Manual QA Checklist

### Task

- [ ] 新增任務並確認重新整理後仍存在。
- [ ] 修改任務並確認資料更新。
- [ ] 刪除任務並確認清單移除。

### Schedule

- [ ] 選擇任務並建立手動排程。
- [ ] 將未排程 Task 拖到日期並輸入開始時間，確認可建立排程。
- [ ] 將既有 ScheduledBlock 拖到另一日，輸入新時間後確認更新成功。
- [ ] 取消 pending reschedule 後，原排程日期與時間不變。
- [ ] 重新排程若與其他 ScheduledBlock 衝突，會被阻擋並顯示錯誤。
- [ ] 重新排程若與 CalendarEvent 衝突，會依既有規則被阻擋。
- [ ] CalendarEvent 維持 readonly 且不可拖曳。
- [ ] 重新排程後仍可從 ScheduledBlock 執行 Start Focus。
- [ ] 衝突排程會被阻擋，或在既有顯示項目上標記時間衝突。
- [ ] 刪除排程。
- [ ] 未來 7 天視圖日期、排序及空日期正常顯示。

### Pomodoro

- [ ] 從 ScheduledBlock 開始 Focus。
- [ ] Pause 與 Resume 正常。
- [ ] Complete Focus 後建立 completed session。
- [ ] 正確顯示 Short Break 或 Long Break 建議。
- [ ] 手動 Start Break。
- [ ] Complete Break 後顯示下一輪 Focus 提示。

### Google Calendar

- [ ] 未設定 Client ID 時顯示環境設定提示。
- [ ] 設定 Client ID 後可完成 Google 授權。
- [ ] 匯入未來 7 天事件。
- [ ] 外部事件維持 readonly，沒有 Edit 或 Delete 操作。
- [ ] 外部事件與本機排程重疊時顯示時間衝突。

### Google Drive Backup / Restore

- [ ] 未設定 Client ID 時顯示提示，且備份／還原按鈕不可用。
- [ ] 取消上傳確認時不執行操作。
- [ ] 「上傳本機備份」會覆蓋 Google Drive appDataFolder 備份。
- [ ] A 刪除資料後上傳，B 從雲端還原後該資料仍維持刪除。
- [ ] 取消還原確認時不執行操作。
- [ ] 「從雲端還原」會覆蓋目前本機資料。
- [ ] 雲端沒有備份時顯示可讀錯誤。
- [ ] CalendarEvent 不會寫入備份。
- [ ] activeTimer 不會寫入備份。
- [ ] 上傳並還原備份後，重新排程的 ScheduledBlock 日期與時間仍存在。

### Build

- [ ] `npm run test:run` 全部通過。
- [ ] `npm run build` 成功。
- [ ] `dist` 包含 production assets、web manifest 與 service worker。
- [ ] `npm run preview` 可開啟 production build。

## Troubleshooting

### Google Drive 備份或還原顯示 `Failed to open popup window`

可能原因：

- 瀏覽器封鎖 Google 授權 popup。
- 授權要求未能在使用者點擊操作按鈕後立即觸發。
- 隱私模式、追蹤防護或瀏覽器設定阻擋第三方登入視窗。

處理方式：

1. 允許 `http://localhost:5173` 開啟彈出視窗。
2. 重新點擊「上傳本機備份」或「從雲端還原」，讓授權在使用者操作中重新觸發。
3. 確認使用 `http://localhost:5173`，不要使用 `file://` 開啟應用程式。
4. 確認 `.env.local` 已設定有效的 `VITE_GOOGLE_CLIENT_ID`。
5. 確認該 origin 已加入 OAuth Client 的 Authorized JavaScript origins。

Drive 授權 token 只保存在目前頁面的記憶體，未寫入 localStorage；頁面重新載入或
token 過期後，需要由使用者再次點擊備份或還原按鈕授權。
