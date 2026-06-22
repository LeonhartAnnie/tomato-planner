# Production Release Checklist

## Automated verification

- [ ] 執行 `npm install`，確認 npm lockfile 可正常安裝。
- [ ] 執行 `npm run test:run`，全部測試通過。
- [ ] 執行 `npm run build`，TypeScript、Vite 與 PWA build 成功。
- [ ] 執行 `npm run preview`，確認 `dist` production build 可開啟。

## Manual QA

- [ ] Task CRUD 與重新整理後資料保存正常。
- [ ] Task drag create 正常。
- [ ] ScheduledBlock drag reschedule 正常。
- [ ] TimeGrid drop、時間預填與確認 dialog 正常。
- [ ] Pomodoro focus、pause、resume、complete 與 break 循環正常。
- [ ] Google Calendar read-only import 與 readonly 顯示正常。
- [ ] Google Drive upload backup 與覆蓋警告正常。
- [ ] Google Drive restore backup 與覆蓋警告正常。
- [ ] 網路、授權、popup、衝突與備份錯誤顯示友善訊息。

## Environment and OAuth

- [ ] `.env.local` 未被 commit，repository 中沒有真實 Client ID 或 access token。
- [ ] Cloudflare Pages Production 已設定 `VITE_GOOGLE_CLIENT_ID`。
- [ ] 如需 preview OAuth QA，Preview environment 亦已設定變數。
- [ ] Google Calendar API 與 Google Drive API 已啟用。
- [ ] Production 與自訂網域 origins 已加入 OAuth Authorized JavaScript origins。
- [ ] OAuth scopes 僅包含 `calendar.readonly` 與 `drive.appdata`。

## Browser and PWA QA

- [ ] Chrome desktop navigation、deep-link reload 與 IndexedDB 正常。
- [ ] 手機 viewport 的 TimeGrid、dialogs 與橫向／垂直捲動可用。
- [ ] Web manifest、icon 與 service worker 請求成功。
- [ ] 若瀏覽器支援，安裝 PWA 後可啟動並顯示正確名稱與 icon。
- [ ] 新版部署後重新整理可取得更新的 service worker/assets。

## Release metadata

- [ ] README、DEPLOYMENT.md、版本號與 release notes 已確認。
- [ ] Production deployment URL 完成 smoke test。
- [ ] 建立 tag：`git tag vX.Y.Z`。
- [ ] 推送 tag：`git push origin vX.Y.Z`。
