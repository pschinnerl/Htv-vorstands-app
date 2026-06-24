import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  CheckSquare,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  UserCircle,
  FileText,
  Key,
  Building2,
  ExternalLink,
  Globe,
  HardDrive,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useUnreadTotal } from '../../context/UnreadContext'

const navItems = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/todos', label: 'Aufgaben', icon: CheckSquare },
  { to: '/kalender', label: 'Kalender', icon: Calendar },
  { to: '/admin', label: 'Mitglieder', icon: Users, adminOnly: true },
]

const externalApps = [
  { label: 'HTV Homepage', url: 'https://www.helmstedtertv.de', icon: Globe },
  { label: 'Google Drive', url: 'https://drive.google.com', icon: HardDrive },
  { label: 'SchlÃ¼sselliste', url: 'https://pschinnerl.github.io/schlusselapp/', icon: Key },
  { label: 'Anlagen', url: 'https://pschinnerl.github.io/htv-anlagen/', icon: Building2 },
  { label: 'VertrÃ¤ge', url: 'https://pschinnerl.github.io/htv-vertraege/', icon: FileText },
]

export default function AppShell() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const isAdmin = userProfile?.role === 'admin'
  const { totalUnread } = useUnreadTotal()

  const sidebar = (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--htv-blue)' }}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={`${import.meta.env.BASE_URL}Logo2025klein.jpeg`}
              alt="HTV Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Vorstands-App</div>
            <div className="text-white/50 text-xs">HTV Helmstedt</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {to === '/chat' && totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </NavLink>
          ))}

        {/* Externe Apps */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="px-3 py-1 text-white/30 text-xs font-semibold uppercase tracking-wider">
            Tools
          </div>
          {externalApps.map(({ label, url, icon: Icon }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <ExternalLink size={13} className="text-white/30" />
            </a>
          ))}
        </div>
      </nav>

      {/* User / Profil / Logout */}
      <div className="px-2 py-4 border-t border-white/10">
        <NavLink
          to="/profil"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
              isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <UserCircle size={18} />
          <div className="min-w-0">
            <div className="font-medium truncate leading-tight">{userProfile?.displayName}</div>
            <div className="text-white/50 text-xs truncate">{userProfile?.email}</div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors"
        >
          <LogOut size={18} />
          Abmelden
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 z-50">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header
          className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10"
          style={{ backgroundColor: 'var(--htv-blue)' }}
        >
          <button onClick={() => setMobileOpen(true)} className="text-white">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="w-7 h-7 rounded bg-white flex items-center justify-center overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}Logo2025klein.jpeg`} alt="HTV" className="w-6 h-6 object-contain" />
          </div>
          <span className="text-white font-semibold text-sm">Vorstands-App</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden flex border-t border-slate-200 bg-white">
          {navItems
            .filter(item => !item.adminOnly || isAdmin)
            .map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors relative ${
                    isActive ? 'text-[color:var(--htv-blue)]' : 'text-slate-400'
                  }`
                }
              >
                <div className="relative">
                  <Icon size={22} />
                  {to === '/chat' && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                      {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                  )}
                </div>
                {label}
              </NavLink>
            ))}
        </nav>
      </div>
    </div>
  )
}
