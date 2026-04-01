import { NavLink } from 'react-router-dom'
import { useUi } from '../ui/useUi'

export default function TopNav() {
  const { mode, setMode } = useUi()
  return (
    <header className="ui-topnav">
      <div className="ui-topnav__inner">
        <div className="ui-brand">
          <span className="ui-brand__mark">DC</span>
          <div>
            <p className="ui-brand__name">Decision Copilot</p>
            <p className="ui-brand__tag">AI multi-agent decision studio</p>
          </div>
        </div>
        <nav className="ui-navlinks">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>Chat</NavLink>
          <NavLink to="/compare" className={({ isActive }) => (isActive ? 'active' : undefined)}>Compare</NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : undefined)}>History</NavLink>
        </nav>
        <div className="ui-topnav__actions">
          <button type="button" className="ui-btn ui-btn--ghost ui-btn--toggle" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? 'Dark' : 'Light'} mode
          </button>
        </div>
      </div>
    </header>
  )
}

