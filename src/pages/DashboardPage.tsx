import { Link } from 'react-router-dom'

export function DashboardPage() {
  return (
    <section>
      <h1>今日總覽</h1>
      <p>番茄鐘排程工具的基礎架構已就緒。</p>
      <div className="cards">
        <Link to="/tasks">管理任務</Link>
        <Link to="/schedule">查看排程</Link>
        <Link to="/pomodoro">開始專注</Link>
        <Link to="/settings">調整設定</Link>
      </div>
    </section>
  )
}
