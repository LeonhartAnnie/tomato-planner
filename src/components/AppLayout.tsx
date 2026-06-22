import { Link, NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: '首頁' },
  { to: '/tasks', label: '任務' },
  { to: '/schedule', label: '排程' },
  { to: '/pomodoro', label: '番茄鐘' },
  { to: '/settings', label: '設定' },
]

export function AppLayout() {
  return (
    <div className="app-shell">
      <header>
        <span className="brand">🍅 Tomato Planner</span>
        <nav aria-label="主要導覽">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="app-footer">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </footer>
    </div>
  )
}
