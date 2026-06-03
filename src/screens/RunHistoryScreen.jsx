import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { SectionCard, PillTag, ConfirmDialog } from '../components/SharedComponents.jsx';
import { SettingsService } from '../services/settingsService.js';

function formatDate(ts) {
  const dt = new Date(ts);
  const diff = (Date.now() - dt) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RunHistoryScreen({ onBack }) {
  const [entries, setEntries] = useState([]);
  const [clearConfirm, setClearConfirm] = useState(false);

  const load = () => {
    const raw = SettingsService.runHistory;
    setEntries(raw.map((item, i) => {
      if (typeof item === 'string') {
        try { return JSON.parse(item); } catch { return { type: 'Unknown', status: 'unknown', message: item, timestamp: new Date().toISOString(), features: [] }; }
      }
      return item;
    }));
  };

  useEffect(() => { load(); }, []);

  const isUAT = (e) => e.type?.includes('UAT');

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="page-header">
        <CheckCircle size={18} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          RUN HISTORY
        </span>
        {entries.length > 0 && (
          <button
            onClick={() => setClearConfirm(true)}
            style={{
              marginLeft: 'auto',
              background: 'var(--error-dim)', border: '1px solid rgba(255,92,114,0.3)',
              color: 'var(--error)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', padding: '7px 14px', borderRadius: 8,
            }}
          >
            Clear All
          </button>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px' }}>
        {entries.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 80 }}>
            <RefreshCw size={52} color="var(--text-muted)" />
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)' }}>No runs yet</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Trigger a function to see history here</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {entries.map((entry, i) => {
              const isSuccess = entry.status === 'success';
              const isError = entry.status === 'error';
              const color = isSuccess ? 'var(--success)' : isError ? 'var(--error)' : 'var(--warning)';
              const dimColor = isSuccess ? 'var(--success-dim)' : isError ? 'var(--error-dim)' : 'var(--accent-dim)';
              const uat = isUAT(entry);

              return (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-elevated)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: 16,
                    animation: `fadeInUp 0.3s ease ${i * 40}ms both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: entry.message ? 10 : 0 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: uat ? 'var(--accent-dim)' : 'var(--success-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {uat
                        ? <CheckCircle size={16} color="var(--accent)" />
                        : <RefreshCw size={16} color="var(--success)" />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{entry.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(entry.timestamp)}</div>
                    </div>
                    <div style={{
                      padding: '4px 10px', borderRadius: 20, background: dimColor,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {isSuccess ? <CheckCircle size={12} color={color} /> : <AlertCircle size={12} color={color} />}
                      <span style={{ fontSize: 10, fontWeight: 700, color }}>{entry.status?.toUpperCase()}</span>
                    </div>
                  </div>

                  {entry.message && (
                    <div style={{
                      padding: 10, borderRadius: 8, background: 'var(--surface)',
                      fontSize: 11, color: 'var(--text-secondary)', marginBottom: entry.features?.length ? 10 : 0,
                    }}>
                      {entry.message}
                    </div>
                  )}

                  {entry.features?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {entry.features.map(f => <PillTag key={f} label={f} color="var(--accent)" />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title="Clear History?"
        message="All run logs will be permanently deleted."
        onConfirm={() => { SettingsService.clearHistory(); load(); }}
        confirmLabel="Clear"
        confirmColor="var(--error)"
      />
    </div>
  );
}

