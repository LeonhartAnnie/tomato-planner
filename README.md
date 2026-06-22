# Tomato Planner

Tomato Planner 是使用 React、Vite 與 TypeScript 建立的 PWA 番茄鐘排程工具。
Task、Schedule、Settings 與 PomodoroSession 儲存在本機 IndexedDB；Google
Calendar 僅供唯讀匯入，Google Drive 僅提供明確的手動備份與還原。

## 功能總覽

- **Task**：建立、編輯與刪除任務，可選預設或自訂分類並以 badge／顏色辨識。
- **Schedule**：以時間格線為主要操作區，可拖曳 Task 建立排程，也可直接拖曳既有 ScheduledBlock 重新排程。
- **Time grid**：顯示未來 7 天，支援跨日事件切割與時間衝突標記。
- **Pomodoro**：Focus、Pause、Resume、Complete，以及短／長休息建議；從排程開始時會跟隨排程區塊長度。
- **Google Calendar**：唯讀匯入未來 7 天行程；外部行程不可編輯或拖曳。
- **Google Drive**：使用 `appDataFolder` 手動上傳本機備份或還原雲端備份。
- **PWA**：提供 web manifest 與 service worker production build。
- **First-run onboarding**：依資料進度引導建立任務、安排排程與開始番茄鐘。

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

## Deploy to Cloudflare Pages

建議 Pages 設定：Framework preset 使用 `Vite` 或 `None`、build command 使用
`npm run build`、output directory 使用 `dist`，Root directory 指向包含本專案
`package.json` 的根目錄。Production environment 必須設定 `VITE_GOOGLE_CLIENT_ID`。

完整的 Pages、Google OAuth、SPA routing、PWA 與部署後 QA 步驟請見
[DEPLOYMENT.md](./DEPLOYMENT.md)；正式發布前請依
[RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) 檢查。

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

## Google OAuth verification readiness

Google Auth Platform 對公開應用程式通常需要完成 Branding，填入 App home
page、Privacy Policy URL、可選但建議提供的 Terms of Service URL、
Authorized domain 與 developer contact email，再準備 data access justification。

公開頁面可填入：

- Privacy Policy：`https://tomato-planner.xx225p.workers.dev/privacy`
- Terms of Service：`https://tomato-planner.xx225p.workers.dev/terms`
- 自訂網域使用：`https://your-domain.example/privacy` 與 `/terms`

Data access 說明重點：

- `calendar.readonly`：在 App 中顯示使用者的 Google Calendar 行程，不寫入 Calendar。
- `drive.appdata`：儲存與還原 Tomato Planner 專用備份，不讀取一般 Drive 檔案。

Testing 狀態只允許 Test users 使用。切換 Production 但尚未完成驗證時，
仍可能出現 unverified app warning 與 user cap；完成所需 verification 後才適合
正式對大量使用者公開。不要為了驗證而擴大 Drive 或 Calendar scopes，
也不要將 Client Secret 提交至 repository。純前端 Vite App 只需
`VITE_GOOGLE_CLIENT_ID`，不需要 Client Secret。

可複製的中英文 scope justification 與送審 checklist 請見
[OAUTH_VERIFICATION.md](./OAUTH_VERIFICATION.md)。

## Google Calendar 行為

- 只讀取 primary calendar 未來 7 天行程。
- CalendarEvent 在 UI 中維持 readonly，不提供 Edit、Delete 或拖曳修改。
- 「清除外部行程」只刪除本機匯入資料，不會改動 Google Calendar。
- Google Calendar 行程不會寫入 Google Drive 備份。

## Schedule 與 Pomodoro 操作

- Schedule 頁桌面版採左右布局：左側是可垂直捲動的可排程任務區，右側是主要 TimeGrid；手機與窄螢幕改為上下排列，任務列可水平滑動。
- 可排程任務可不離開排程頁快速新增，並以明確的「拖曳」把手拖入 TimeGrid。
- TimeGrid 可切換「今天」、「3 天」與「7 天」；範圍限制在今天起未來 7 天。7 天模式固定顯示完整範圍，不提供下一週導覽。
- TimeGrid 上的本機 ScheduledBlock 可直接 Start Focus、取消排程，或拖到同日其他時間與不同日期；拖曳後確認 dialog 才會更新。
- 跨天行程會依日期分段顯示；不足 60 分鐘的短片段使用 compact display，避免操作按鈕被格線裁切。本機排程可從「操作」開啟 Start Focus／取消排程，外部行程仍維持唯讀。
- Google Calendar 外部行程維持唯讀，不能 Start Focus、取消、拖曳、編輯或寫回 Calendar。
- Google Calendar 目前只匯入未來 7 天，TimeGrid 會依目前選擇的日期範圍過濾顯示，不需重新匯入。
- 只有 `block.start <= now < block.end` 的進行中排程可以 Start Focus；尚未開始、已結束或時間無效的排程會顯示原因並停用按鈕。
- 從 ScheduledBlock 開始專注時，番茄鐘長度跟隨該排程的 duration；直接從 Pomodoro 頁開始則使用 Settings 的 focus duration。
- Task 分類提供工作、學習、生活、健康、其他與自訂；舊資料沒有分類時顯示為「其他」。
- Task 截止時間只用於顯示未到期、今天截止、即將截止與已逾期狀態；到期後不會自動刪除任務。
- Task model 保留 `splittable` 供未來使用；目前尚未實作自動拆分，因此表單暫不顯示此選項。
- Settings 的「新增任務預設分鐘」只決定新 Task 表單帶入的預估時間，不是 Pomodoro duration。直接從 Pomodoro 頁開始使用專注分鐘；從排程開始則使用 ScheduledBlock duration。

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
- **v2.9**：Cloudflare Pages 部署準備與 production release checklist。
- **v3.0**：首次使用指引、Dashboard 摘要與可收合 onboarding。
- **v3.0.1**：Public bugfixes, two-column Schedule layout, day/3-day/7-day TimeGrid ranges, direct focus/cancel/drag operations, task category colors, OAuth verification readiness, compact cross-day items, mobile drag handles, quick task creation, and stable Task card actions.
- **v3.0.2**：UX polish，補充 empty states、deadline 狀態、inline guidance、Start Focus disabled reason、Calendar／Drive 資料使用說明，以及置中的 Pomodoro desktop layout。

## Manual QA Checklist

### Task 與 Schedule

- [ ] Tasks 為空時顯示建立第一個任務引導，按鈕會聚焦既有新增任務表單。
- [ ] Schedule 沒有任務時顯示 quick-create 引導；TimeGrid 無資料時顯示不阻擋拖放的提示。
- [ ] Task 新增、修改與刪除後，重新整理資料仍正確。
- [ ] Task deadline 正確顯示未到期、今天截止、24 小時內即將截止及已逾期；逾期任務不會自動刪除。
- [ ] Schedule 可排程任務卡顯示相同 deadline 狀態。
- [ ] 預設與自訂 Task 分類可儲存；空白自訂分類顯示為「其他」。
- [ ] Task、週清單與 TimeGrid 顯示一致的分類 label／顏色；外部行程不套用分類色。
- [ ] 從任務列拖到 TimeGrid 建立 ScheduledBlock，並可在 TimeGrid 直接取消排程。
- [ ] Schedule 頁空任務時顯示「＋ 新增任務」；快速建立後任務立即出現並可拖曳。
- [ ] 手機上可排程任務列可由卡片內容區水平滑動；只有拖曳把手會啟動拖放。
- [ ] 桌面版左側任務區可垂直捲動，右側 TimeGrid 不會被任務數量推到頁面下方。
- [ ] TimeGrid 的今天、3 天、7 天模式顯示正確；重新開啟 Schedule 頁會保留上次模式。
- [ ] 今天／3 天模式不能移出今天起未來 7 天；7 天模式沒有上一週或下一週操作。
- [ ] Tasks 頁與快速新增 dialog 的 TaskForm 在中小寬度下不會造成 label 擁擠換行。
- [ ] Task 拖到日期或時間格線後，確認 dialog 的日期與時間正確。
- [ ] ScheduledBlock 重新排程後保留 duration；取消或 Esc 不修改資料。
- [ ] 可直接拖曳 TimeGrid 上的 ScheduledBlock 到同日其他時間或不同日期。
- [ ] Google Calendar 外部行程不顯示 Start Focus／取消，也不可拖曳。
- [ ] CalendarEvent 卡片與 Calendar panel 清楚顯示 readonly，並說明只讀取未來 7 天。
- [ ] 與本機排程或 CalendarEvent 重疊時顯示友善衝突訊息。
- [ ] 時間格線可顯示 7 天、跨日事件及 Settings 設定的起訖時間；跨日短片段使用 compact display，內容不溢出相鄰格線。
- [ ] 短 ScheduledBlock 以「操作」開啟 Start Focus／取消排程；短 CalendarEvent 僅顯示唯讀資訊。
- [ ] 小螢幕可水平及垂直捲動時間格線。
- [ ] Task 卡片在長標題、分類、地點與截止時間存在時，Edit／Delete 仍排列整齊；手機版按鈕正常堆疊。

### Onboarding 與 Dashboard

- [ ] 全新資料時，「建立任務」顯示為下一步，其餘主流程尚未解鎖。
- [ ] 建立 Task 後，下一步變成「安排排程」。
- [ ] 建立 ScheduledBlock 後，下一步變成「開始番茄鐘」。
- [ ] 完成 PomodoroSession 後，主流程顯示完成。
- [ ] Google Calendar 與 Google Drive 維持選用，不阻擋主流程。
- [ ] 有 Task 後可收合指引，重新顯示後恢復完整步驟。
- [ ] Task 為空時，即使曾收合仍顯示完整 onboarding。
- [ ] 任務、今日排程、番茄鐘紀錄與外部行程摘要數量正確。
- [ ] Dashboard 快速操作連結不可被瀏覽器拖動，點擊導航仍正常。

### Pomodoro 與 Settings

- [ ] Pomodoro 桌面版主卡片與最近完成區置中且等寬；手機版接近滿寬且沒有水平捲動。
- [ ] 沒有 active timer 時顯示排程 Start Focus 與手動開始的 idle guidance。
- [ ] 從 ScheduledBlock 開始 Focus，Pause／Resume／Complete 正常。
- [ ] 從 25 分鐘 ScheduledBlock 開始時顯示 25 分鐘；直接開始則使用 Settings focus duration。
- [ ] 進行中 ScheduledBlock 可 Start Focus；未來、已結束與無效時間均停用並顯示原因。
- [ ] Focus 完成後顯示正確的短／長休息建議，並可完成休息。
- [ ] Settings 可儲存、驗證錯誤與恢復預設值。
- [ ] 「新增任務預設分鐘」會帶入新 Task 的預估分鐘，且不改變 Pomodoro 專注分鐘。

### Google Calendar

- [ ] 未設定 Client ID 時顯示設定提示。
- [ ] 授權後可匯入未來 7 天行程。
- [ ] 外部行程 readonly、不可拖曳，並可顯示時間衝突。
- [ ] 清除外部行程不會刪除 Google Calendar 上的事件。

### Google Drive

- [ ] Settings 清楚說明備份位於 appDataFolder，且還原會覆蓋本機 IndexedDB 的 Tomato Planner 資料。
- [ ] 上傳與還原 dialog 仍顯示覆蓋警告，成功／失敗狀態可理解。

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

### OAuth Testing 狀態出現 403 access_denied

這通常不是程式碼錯誤。Google OAuth app 若仍在 **Testing** 狀態，未列入測試名單的
Google 使用者會看到「此應用程式目前處於測試階段」與 `403 access_denied`。

短期可在 Google Cloud Console 的 Google Auth Platform／OAuth consent screen 中，
前往 **Audience → Test users → Add users** 加入測試帳號。長期公開使用時需將 app
發佈為 Production，補齊應用程式資訊、support email、privacy policy、domain
verification，並依使用的 scopes 完成 Google verification。若 OAuth client 由
Workspace 或學校帳號建立，也要確認 User type 與組織管理政策未限制外部使用者。
