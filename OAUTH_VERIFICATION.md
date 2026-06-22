# Google OAuth Verification Notes

This document contains concise text that can be adapted for Google Auth Platform branding and
data access verification. It documents the current implementation; it does not claim that Tomato
Planner has passed Google verification.

## English

### Calendar read-only justification

Tomato Planner uses Google Calendar read-only access to display the user's upcoming calendar
events inside the weekly schedule and time-grid views. The app does not create, modify, or delete
Google Calendar events.

### Drive appDataFolder justification

Tomato Planner uses Google Drive appDataFolder access to store and restore app-specific backup
data created by the user. The app does not access the user's general Google Drive files.

### App data usage summary

Tomato Planner stores task, schedule, pomodoro, and settings data primarily in the user's browser
storage. When the user explicitly chooses to upload a backup, the app stores an app-specific
backup file in Google Drive appDataFolder. The user can restore that backup later. Google access
tokens, imported Google Calendar events, and active timer state are not included in the backup.

### User-facing flow

Google Calendar access begins only when the user chooses to import external calendar events.
Google Drive access begins only when the user chooses to upload a local backup, inspect a cloud
backup, or restore a cloud backup. The app requests only `calendar.readonly` and `drive.appdata`.

## 繁體中文

### Google Calendar 唯讀權限說明

Tomato Planner 使用 Google Calendar 唯讀權限，在每週排程與時間格線畫面中
顯示使用者即將發生的行程。本 App 不會建立、修改或刪除 Google Calendar 行程。

### Google Drive appDataFolder 權限說明

Tomato Planner 使用 Google Drive appDataFolder 權限，儲存與還原使用者建立的
App 專用備份資料。本 App 不會存取使用者的一般 Google Drive 檔案。

### App 資料使用摘要

Tomato Planner 主要將任務、排程、番茄鐘與設定資料儲存在使用者的瀏覽器。
只有當使用者明確選擇上傳備份時，App 才會將專用備份檔儲存至 Google Drive
appDataFolder，並可由使用者稍後還原。Google access token、匯入的 Google Calendar
行程與進行中的 active timer 狀態都不會放入備份。

### 使用者操作流程

只有當使用者選擇匯入外部行程時，App 才會使用 Google Calendar 權限。只有當
使用者選擇上傳本機備份、檢視雲端備份或從雲端還原時，App 才會使用 Google Drive
權限。App 只要求 `calendar.readonly` 與 `drive.appdata`。

## Submission checklist

- Replace every TODO support email in the public pages before submitting branding.
- Confirm the home page, Privacy Policy, and Terms URLs use the final HTTPS production origin.
- Confirm the authorized domain is verified and matches the deployed app.
- Keep the requested scopes limited to `calendar.readonly` and `drive.appdata`.
- Capture a short demo showing where each Google permission is initiated and how its data appears.
