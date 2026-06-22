export function TermsPage() {
  return (
    <article className="legal-page">
      <header className="legal-page-heading">
        <p className="legal-page-kicker">Tomato Planner</p>
        <h1>使用條款</h1>
        <p>
          本頁是 Tomato Planner 的使用說明草案，不是由律師擬定的正式法律意見。
        </p>
      </header>

      <section>
        <h2>工具用途</h2>
        <p>
          Tomato Planner 是個人排程與番茄鐘工具。使用者需自行確認
          任務、排程、番茄鐘紀錄與備份內容是否正確。
        </p>
      </section>

      <section>
        <h2>Google Calendar</h2>
        <p>
          Google Calendar 行程只作為唯讀資訊顯示。Tomato Planner
          不會代替使用者建立、修改、刪除或完整管理 Google Calendar。
        </p>
      </section>

      <section>
        <h2>Google Drive 備份與還原</h2>
        <ul>
          <li>上傳本機備份會覆蓋現有的雲端備份。</li>
          <li>從雲端還原會覆蓋當前瀏覽器的本機 App 資料。</li>
          <li>執行前應檢查畫面中的資料摘要與覆蓋方向。</li>
        </ul>
      </section>

      <section>
        <h2>資料與可用性</h2>
        <p>
          本 App 無法保證資料永遠不會遺失、服務不會中斷，或所有
          瀏覽器與 Google 帳號環境都會完全相同。重要資料應由使用者自行確認與保留。
        </p>
      </section>

      <section>
        <h2>開發狀態</h2>
        <p>
          Tomato Planner 仍可能處於開發、測試或展示階段，功能、使用介面與本說明可能調整。
        </p>
      </section>

      <section>
        <h2>聯絡方式</h2>
        <p>
          TODO：在公開發布前，填入與隱私權政策及 Google Auth Platform
          Branding 一致的 user support email。
        </p>
      </section>
    </article>
  )
}
