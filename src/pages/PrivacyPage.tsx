export function PrivacyPage() {
  return (
    <article className="legal-page">
      <header className="legal-page-heading">
        <p className="legal-page-kicker">Tomato Planner</p>
        <h1>隱私權政策與資料使用說明</h1>
        <p>
          本頁為 Tomato Planner 的資料使用說明與隱私權政策草案，
          用來說明這個番茄鐘與排程輔助工具如何處理資料。
        </p>
      </header>

      <section>
        <h2>本機資料</h2>
        <p>
          Tomato Planner 的主要資料儲存在使用者瀏覽器的 IndexedDB。
          任務、排程區塊、番茄鐘紀錄與設定會保存在當前瀏覽器。
        </p>
      </section>

      <section>
        <h2>Google Calendar 權限</h2>
        <ul>
          <li>僅使用 <code>calendar.readonly</code> scope。</li>
          <li>讀取使用者未來行程，顯示在 Tomato Planner 的排程畫面。</li>
          <li>不會新增、修改或刪除 Google Calendar 行程。</li>
        </ul>
      </section>

      <section>
        <h2>Google Drive 權限</h2>
        <ul>
          <li>僅使用 <code>drive.appdata</code> scope。</li>
          <li>只在 Google Drive <code>appDataFolder</code> 儲存 Tomato Planner 專用備份。</li>
          <li>不會讀取或管理使用者的一般 Google Drive 檔案。</li>
        </ul>
      </section>

      <section>
        <h2>不會放入 Drive 備份的資料</h2>
        <ul>
          <li>Google access token。</li>
          <li>從 Google Calendar 匯入的 CalendarEvent。</li>
          <li>進行中的 activeTimer 與其他暫存 UI 狀態。</li>
        </ul>
      </section>

      <section>
        <h2>使用者的選擇</h2>
        <ul>
          <li>可清除瀏覽器網站資料，刪除當前裝置的本機資料。</li>
          <li>可透過 App 內的上傳與還原功能管理 Google Drive 備份。</li>
          <li>可在 Google 帳號的安全性設定中撤銷 Tomato Planner 授權。</li>
        </ul>
      </section>

      <section>
        <h2>聯絡方式</h2>
        <p>
          TODO：在公開發布前，填入與 Google Auth Platform Branding
          一致的 user support email。
        </p>
      </section>
    </article>
  )
}
