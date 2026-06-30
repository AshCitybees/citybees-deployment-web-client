import React from 'react';
import {
  Home, CheckCircle, RefreshCw, History,
  Settings, Zap, GitBranch, Rocket, Users, Database,
} from 'lucide-react';

const NAV = [
  { id: 'home',     label: 'Dashboard',   icon: Home },
  { id: 'uat',      label: 'UAT Approval', icon: CheckCircle },
  { id: 'wac',      label: 'WAC Prod Sync', icon: RefreshCw },
  { id: 'deployments', label: 'Deployments', icon: Rocket },
  { id: 'usersapps', label: 'Users & Apps', icon: Users },
  { id: 'backups',  label: 'Backups', icon: Database },
];

const SECONDARY_NAV = [
  { id: 'history',  label: 'Run History',  icon: History },
  { id: 'settings', label: 'Settings',     icon: Settings },
];

export default function Sidebar({ current, onNavigate }) {
  return (
    <aside className="sidebar">
      {/* ── Logo ── */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sidebar-logo-mark">
            <Zap size={18} color="#0A0B0E" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: 13, fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '0.5px', lineHeight: 1.2,
            }}>
              CITYBEES
            </div>
            <div style={{
              fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Deploy
            </div>
          </div>
        </div>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Functions</div>

        {NAV.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <div
              key={id}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon
                size={16}
                color={active ? 'var(--accent)' : 'currentColor'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="nav-label">{label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }} />
              )}
            </div>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: 8 }}>System</div>

        {SECONDARY_NAV.map(({ id, label, icon: Icon }) => {
          const active = current === id;
          return (
            <div
              key={id}
              className={`nav-item${active ? ' active' : ''}`}
              onClick={() => onNavigate(id)}
            >
              <Icon
                size={16}
                color={active ? 'var(--accent)' : 'currentColor'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="nav-label">{label}</span>
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent)',
                  boxShadow: '0 0 6px var(--accent)',
                }} />
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="sidebar-footer">
        {/* Pipeline Status Pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--surface-hover)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--success)',
            boxShadow: '0 0 6px var(--success)',
            animation: 'pulse-glow 2.5s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pipeline Active
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
              4 apps · 8 branches
            </div>
          </div>
          <GitBranch size={13} color="var(--text-muted)" />
        </div>

        {/* Version */}
        <div style={{
          marginTop: 12, fontSize: 10, color: 'var(--text-muted)',
          textAlign: 'center', letterSpacing: '0.5px',
        }}>
          v1.0.0 · Citybees © 2025
        </div>
      </div>
    </aside>
  );
}
