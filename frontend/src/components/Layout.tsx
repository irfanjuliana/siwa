import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { storageUrl } from '../lib/supabase';
import { BUCKET } from '../constants';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/pengisian-rhk', label: 'Pengisian RHK' },
  { to: '/data-rhk', label: 'DATA RHK' },
];

const laporanItems = [
  { to: '/laporan-rhk', label: 'LAPORAN SEMUA RHK' },
  { to: '/laporan-rhk/1', label: 'LAPORAN RHK 1' },
  { to: '/laporan-rhk/2', label: 'LAPORAN RHK 2' },
  { to: '/laporan-rhk/3', label: 'LAPORAN RHK 3' },
  { to: '/laporan-rhk/4', label: 'LAPORAN RHK 4' },
  { to: '/laporan-rhk/5', label: 'LAPORAN RHK 5' },
  { to: '/laporan-rhk/6', label: 'LAPORAN RHK 6' },
];

function SidebarContent() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [laporanOpen, setLaporanOpen] = useState(false);
  const laporanActive = laporanItems.some((item) => location.pathname.startsWith(item.to));
  const isLaporanOpen = laporanOpen || laporanActive;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <img src="/logo.jpeg" alt="SIWA" className="h-12 w-12 rounded-full bg-white object-cover" />
        <div>
          <p className="text-base font-extrabold leading-tight">SIWA</p>
          <p className="text-[11px] leading-tight text-white/70">Sistem Informasi Wali Asrama</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        <div>
          <button
            onClick={() => setLaporanOpen((v) => !v)}
            className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              laporanActive ? 'bg-white/20 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span>LAPORAN RHK</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className={`transition-transform ${isLaporanOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isLaporanOpen && (
            <div className="mt-1 space-y-1 pl-4">
              {laporanItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-2 text-[13px] font-medium transition ${
                      isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <img
            src={user?.foto_url ? storageUrl(BUCKET.FOTO_PROFILE, user.foto_url) : '/logo.jpeg'}
            alt="profile"
            className="h-10 w-10 rounded-full bg-white object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.nama}</p>
            <p className="truncate text-xs capitalize text-white/70">
              {user?.jabatan} · {user?.nip}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-lg bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Keluar
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Desktop sidebar (lg ke atas) */}
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-800 text-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[80vw] bg-brand-800 text-white shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <img src="/logo.jpeg" alt="SIWA" className="h-8 w-8 rounded-full bg-white object-cover" />
          <span className="text-base font-extrabold text-slate-800">SIWA</span>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
