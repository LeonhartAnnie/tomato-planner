# Tomato Planner

Tomato Planner 是使用 React、Vite 與 TypeScript 建立的 PWA 番茄鐘排程工具。
Task、Schedule、Settings 與 PomodoroSession 儲存在本機 IndexedDB；Google
Calendar 僅供唯讀匯入，Google Drive 僅提供明確的手動備份與還原。

## 功能總覽

- **Task**：建立、編輯與刪除任務，記錄預估時間、分類、地點與期限。
- **Schedule**：手動建立排程，或拖曳 Task／ScheduledBlock 到日期或時間格線。
- **Time grid**：顯示未來 7 天，支援跨日事件切割與時間衝突標記。
- **Pomodoro**：Focus、Pause、Resume、Complete，以及短／長休息建議。
- **Google Calendar**：唯讀匯入未來 7 天行程；外部行程不可編輯或拖曳。
- **Google Drive**：使用 `appDataFolder` 手動上傳本機備份或還原雲端備份。
- **PWA**：提供 web manifest 與 service worker production build。

## 快速開始

需求：Node.js 與 npm。本專案不使用 pnpm。

```bash
npm install
cp .env.example .env.local
npm run dev
```

PowerShell 可使用：

```powershell
Copy-Item .env.example .env.local
```

測試與 production build：

```bash
npm run test:run
npm run build
npm run preview
```

`npm run preview` 用於檢查 `dist`，不取代正式部署。

## 環境變數

在 `.env.local` 設定 Google OAuth Web Client ID：

```dotenv
VITE_GOOGLE_CLIENT_ID=你的_Google_OAuth_Client_ID
```

- Calendar 與 Drive 共用同一個 OAuth Client ID。
- `.env.example` 應提交至版本控制，提供必要變數名稱。
- `.env.local` 含本機設定，已由 `.gitignore` 排除，不應 commit。
- Google access token 只保留在記憶體，不寫入 localStorage 或備份。

## Google Cloud Console 設定

1. 啟用 Google Calendar API 與 Google Drive API。
2. 設定 OAuth consent screen；Testing 狀態下加入 Test users。
3. 建立 Web application 類型的 OAuth Client ID。
4. 在 Authorized JavaScript origins 加入前端 origin，例如：

   ```text
   http://localhost:5173
   ```

   協定、網域與連接埠必須和瀏覽器網址完全一致；正式環境需加入實際 HTTPS origin。

目前只使用以下最小 scopes：

- Calendar：`https://www.googleapis.com/auth/calendar.readonly`
- Drive：`https://www.googleapis.com/auth/drive.appdata`

專案不使用 full Drive scope `https://www.googleapis.com/auth/drive`。

## Google Calendar 行為

- 只讀取 primary calendar 未來 7 天行程。
- CalendarEvent 在 UI 中維持 readonly，不提供 Edit、Delete 或拖曳修改。
- 「清除外部行程」只刪除本機匯入資料，不會改動 Google Calendar。
- Google Calendar 行程不會寫入 Google Drive 備份。

## Google Drive 備份與還原

- **上傳本機備份**：以目前本機 app-owned data 完整覆蓋雲端備份。
- **從雲端還原**：以雲端備份完整覆蓋目前裝置的本機資料。
- 操作前會顯示本機與雲端摘要、資料時間及覆蓋警告。
- 沒有雲端備份時可以建立新備份，但不能執行還原。
- 沒有自動 LWW sync、自動合併或背景同步。
- Cloud backup 使用經 runtime validation 的 `CloudBackupData` version 1。

資料路徑：

```text
LocalAppDataDexieRepository
  → uploadLocalBackup / restoreCloudBackup
  → CloudBackupJsonRepository
  → GoogleDriveCloudBackupTextStorage
  → Google Drive appDataFolder
```

Drive adapter 只處理 string I/O；JSON repository 負責 codec 與 validation；application
use cases 負責上傳／還原流程；Dexie adapter 負責本機 transaction。UI 只呼叫 store。

## 不會同步的資料

- Google Calendar 的 CalendarEvent。
- 進行中的 activeTimer、nextStep 與 lastCompletedSession。
- Google access token。
- Dialog、loading、error 等 UI 暫存狀態。

## 目前限制

- Google Calendar 不支援寫入。
- Google Drive 不是自動同步，也不會合併兩端變更。
- activeTimer 重新整理或跨裝置後不會恢復。
- 沒有多人協作或 conflict merge。
- Settings 沒有 `updatedAt`；settings-only change 的內容時間精準度有限。
- 純刪除尚未使用 tombstone 或 app-level revision metadata。

## 版本歷程

- **v1.0.0**：Task、Schedule、Pomodoro、Settings、Calendar read-only、Drive 備份基礎。
- **v2.1**：Task 拖曳到日期建立排程。
- **v2.2**：ScheduledBlock 拖曳重新排程。
- **v2.3**：Schedule 互動提示與空狀態改善。
- **v2.4**：7 天時間格線視圖。
- **v2.4.1**：時間格線捲動與跨日事件切割。
- **v2.5**：拖曳到時間格線並預填時間。
- **v2.6**：建立／重新排程確認 dialog。
- **v2.7**：Drive 上傳／還原摘要與覆蓋安全提示。
- **v2.8**：使用者友善錯誤訊息與 release 文件整理。

## Manual QA Checklist

### Task 與 Schedule

- [ ] Task 新增、修改與刪除後，重新整理資料仍正確。
- [ ] 手動建立及刪除 ScheduledBlock 正常。
- [ ] Task 拖到日期或時間格線後，確認 dialog 的日期與時間正確。
- [ ] ScheduledBlock 重新排程後保留 duration；取消或 Esc 不修改資料。
- [ ] 與本機排程或 CalendarEvent 重疊時顯示友善衝突訊息。
- [ ] 時間格線可顯示 7 天、跨日事件及 Settings 設定的起訖時間。
- [ ] 小螢幕可水平及垂直捲動時間格線。

### Pomodoro 與 Settings

- [ ] 從 ScheduledBlock 開始 Focus，Pause／Resume／Complete 正常。
- [ ] Focus 完成後顯示正確的短／長休息建議，並可完成休息。
- [ ] Settings 可儲存、驗證錯誤與恢復預設值。

### Google Calendar

- [ ] 未設定 Client ID 時顯示設定提示。
- [ ] 授權後可匯入未來 7 天行程。
- [ ] 外部行程 readonly、不可拖曳，並可顯示時間衝突。
- [ ] 清除外部行程不會刪除 Google Calendar 上的事件。

### Google Drive

- [ ] 上傳前顯示本機／雲端摘要與覆蓋雲端警告。
- [ ] 還原前顯示雲端／本機摘要與覆蓋本機警告。
- [ ] 無雲端備份時顯示友善提示且不執行還原。
- [ ] 取消安全 dialog 不執行資料操作。
- [ ] 授權、網路、Drive 讀寫及無效備份錯誤均顯示友善訊息。
- [ ] 上傳／還原成功後狀態與備份資料時間更新。
- [ ] CalendarEvent、activeTimer 與 token 不會進入備份。

### Build

- [ ] `npm run test:run` 全部通過。
- [ ] `npm run build` 成功並產生 PWA assets。
- [ ] `npm run preview` 可開啟 production build。

## Troubleshooting

### Google 授權 popup 被擋

允許目前網站開啟彈出視窗，再直接點擊 Calendar 匯入、備份或還原按鈕。隱私模式
及追蹤防護也可能阻擋登入視窗。

### 網路連線失敗／Failed to fetch

確認網路狀態、Google API 是否啟用，稍後重新操作。應用程式會顯示友善訊息，不會
直接呈現底層 response 或 JSON 內容。

### 沒有雲端備份

先在 Settings 的 Google Drive 區塊執行「上傳本機備份」，成功後才能從雲端還原。

### Google Client ID 未設定

確認 `.env.local` 存在且包含有效的 `VITE_GOOGLE_CLIENT_ID`，修改後重新啟動
`npm run dev`。

### localhost origin 不一致

瀏覽器網址必須和 Authorized JavaScript origins 完全一致。例如設定
`http://localhost:5173` 時，不要使用 `file://`、不同 port 或未登記的 IP origin。
