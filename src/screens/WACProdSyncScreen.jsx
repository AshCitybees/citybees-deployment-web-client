import React, { useState } from 'react';
import {
  RefreshCw, Mail, Upload, GitMerge,
  Users, CheckCircle, XCircle, MinusCircle, BarChart2,
  Clock, Info, Plus, X, ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  SectionCard, SectionHeader, ToggleRow, ResultBanner,
  StyledInput, ActionButton, PillTag, ModuleCard, TinyBadge, Spinner
} from '../components/SharedComponents.jsx';
import { SettingsService } from '../services/settingsService.js';
import { ApiService } from '../services/apiService.js';
import { WAC_MODULES, DEFAULT_RECIPIENTS_WAC } from '../models/constants.js';

const gap = (h) => <div style={{ height: h }} />;

export default function WACProdSyncScreen({ onBack }) {
  const [sendMail, setSendMail] = useState(SettingsService.defaultSendMail);
  const [createPR, setCreatePR] = useState(SettingsService.defaultCreatePR);
  const [pushCode, setPushCode] = useState(SettingsService.defaultPushCode);

  const [selectedModules, setSelectedModules] = useState(new Set(WAC_MODULES.map(m => m.id)));
  const [extraRecipients, setExtraRecipients] = useState([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [showDefaultRecipients, setShowDefaultRecipients] = useState(false);
  const [showSchedule, setShowSchedule] = useState(true);

  const [status, setStatus] = useState('idle');
  const [resultMsg, setResultMsg] = useState('');
  const [syncResults, setSyncResults] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allSelected = selectedModules.size === WAC_MODULES.length;
  const selectedMods = WAC_MODULES.filter(m => selectedModules.has(m.id));

  const toggleModule = (id) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const addRecipient = () => {
    if (recipientInput.trim() && recipientInput.includes('@')) {
      setExtraRecipients(prev => [...prev, recipientInput.trim()]);
      setRecipientInput('');
    }
  };

  const handleTrigger = () => {
    if (!SettingsService.baseUrl) { setStatus('error'); setResultMsg('Azure Function URL not set. Go to Settings first.'); return; }
    if (!pushCode && createPR) { setStatus('error'); setResultMsg("Can't create PRs without pushing code."); return; }
    setConfirmOpen(true);
  };

  const doTrigger = async () => {
    setStatus('loading');
    setSyncResults([]);
    const result = await ApiService.triggerWACProdSync({
      sendMail, createPR, pushCode,
      additionalRecipients: extraRecipients,
      selectedModules: [...selectedModules],
    });

    setSyncResults(result.syncResults ?? []);
    setStatus(result.status);

    if (result.status === 'success') {
      const synced = result.syncResults?.filter(r => r.status === 'synced').length ?? 0;
      const skipped = result.syncResults?.filter(r => r.status === 'skipped').length ?? 0;
      const failed = result.syncResults?.filter(r => r.status === 'failed').length ?? 0;
      setResultMsg(synced === 0 && failed === 0
        ? '✓ All apps already up-to-date — nothing to sync.'
        : `✓ Sync complete — ${synced} synced, ${skipped} skipped${failed > 0 ? `, ${failed} failed` : ''}.`
      );
    } else {
      setResultMsg(`Error ${result.httpStatus ?? ''}: ${result.message ?? 'Unknown error'}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="page-header">
        <RefreshCw size={18} color="var(--success)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          WAC PROD SYNC
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 50ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={24} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>WAC Prod Sync</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                GitLab release/* → GitHub WAC-prod-branch, then PR to master.<br />GitLab wins on conflict.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Schedule */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 80ms both' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setShowSchedule(v => !v)}>
            <SectionHeader
              label="Schedule"
              icon={Clock}
              trailing={showSchedule ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
            />
          </div>
          {showSchedule && (
            <>
              {gap(14)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <ScheduleCell icon="🕖" time="07:00" label="UTC Morning" />
                <ScheduleCell icon="🌙" time="20:00" label="UTC Evening" />
              </div>
              <div style={{
                padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  This button triggers a manual run outside the schedule. The timer runs automatically via Azure.
                </span>
              </div>
            </>
          )}
        </SectionCard>

        {/* Module Selector */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 110ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
              App Modules ({selectedModules.size}/{WAC_MODULES.length} selected)
            </span>
            <button
              onClick={allSelected ? () => setSelectedModules(new Set([WAC_MODULES[0].id])) : () => setSelectedModules(new Set(WAC_MODULES.map(m => m.id)))}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                background: allSelected ? 'var(--success-dim)' : 'var(--surface)',
                border: `1px solid ${allSelected ? 'rgba(61,214,140,0.5)' : 'var(--border)'}`,
                color: allSelected ? 'var(--success)' : 'var(--text-muted)',
              }}
            >
              {allSelected ? 'DESELECT ALL' : 'SELECT ALL'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WAC_MODULES.map(m => (
              <ModuleCard
                key={m.id}
                module={m}
                selected={selectedModules.has(m.id)}
                onToggle={() => toggleModule(m.id)}
                accentColor={m.isBackend ? 'var(--warning)' : 'var(--success)'}
                extraInfo={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, paddingLeft: 38 }}>
                    <TinyBadge label={m.gitlabBranch} color="var(--warning)" />
                    <ArrowRight size={9} color="var(--text-muted)" />
                    <TinyBadge label={m.githubBranch} color={selectedModules.has(m.id) ? (m.isBackend ? 'var(--warning)' : 'var(--success)') : 'var(--text-muted)'} />
                  </div>
                }
              />
            ))}
          </div>
          {selectedModules.size < WAC_MODULES.length && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.25)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={13} color="var(--warning)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--warning)' }}>
                Only {selectedModules.size} app(s) will be synced. Unselected apps will be skipped.
              </span>
            </div>
          )}
        </SectionCard>

        {/* Actions */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 140ms both' }}>
          <SectionHeader label="Actions" icon={RefreshCw} />
          {gap(16)}
          <ToggleRow label="Send Mail" subtitle="Notify team after sync completes" value={sendMail} onChange={setSendMail} icon={Mail} />
          {gap(12)}
          <ToggleRow label="Push Code to GitHub" subtitle="Sync GitLab release/* → GitHub WAC-prod-branch" value={pushCode} onChange={setPushCode} icon={Upload} />
          {gap(12)}
          <ToggleRow label="Create Pull Requests" subtitle="Open GitHub PRs from WAC-prod-branch → master" value={createPR} onChange={v => { if (v) setPushCode(true); setCreatePR(v); }} icon={GitMerge} />
        </SectionCard>

        {/* Extra Recipients */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 170ms both' }}>
          <SectionHeader label={`Extra Recipients${extraRecipients.length ? ` (${extraRecipients.length})` : ''}`} icon={Users} />
          {gap(14)}
          <div style={{ display: 'flex', gap: 10 }}>
            <StyledInput value={recipientInput} onChange={setRecipientInput} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && addRecipient()} style={{ flex: 1 }} />
            <button onClick={addRecipient} style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
              background: 'var(--success-dim)', border: '1px solid rgba(61,214,140,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={20} color="var(--success)" />
            </button>
          </div>
          {extraRecipients.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {extraRecipients.map(r => <PillTag key={r} label={r} color="var(--success)" onRemove={() => setExtraRecipients(p => p.filter(x => x !== r))} />)}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>No extra recipients. Only default list will be used.</p>
          )}
        </SectionCard>

        {/* Default Recipients */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 200ms both' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setShowDefaultRecipients(v => !v)}>
            <SectionHeader
              label={`Default Recipients (${DEFAULT_RECIPIENTS_WAC.length})`}
              icon={Users}
              trailing={showDefaultRecipients ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
            />
          </div>
          {showDefaultRecipients ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {DEFAULT_RECIPIENTS_WAC.map(r => <PillTag key={r} label={r} color="var(--text-secondary)" />)}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{DEFAULT_RECIPIENTS_WAC.join(', ')}</p>
          )}
        </SectionCard>

        {gap(8)}

        {status !== 'idle' && status !== 'loading' && (
          <ResultBanner isSuccess={status === 'success'} message={resultMsg} />
        )}

        {syncResults.length > 0 && (
          <>
            {gap(8)}
            <SyncResultsCard results={syncResults} />
          </>
        )}

        {gap(8)}

        <ActionButton
          label="TRIGGER WAC PROD SYNC"
          onClick={status === 'loading' ? null : handleTrigger}
          isLoading={status === 'loading'}
          icon={RefreshCw}
          color="var(--success)"
        />

        {status === 'success' && (
          <div style={{
            padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
            animation: 'fadeIn 0.3s ease',
          }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Next scheduled auto-run: 07:00 or 20:00 UTC.</span>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {confirmOpen && (
        <WACConfirmDialog
          onClose={() => setConfirmOpen(false)}
          onConfirm={doTrigger}
          selectedMods={selectedMods}
          sendMail={sendMail}
          pushCode={pushCode}
          createPR={createPR}
          extraRecipients={extraRecipients}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScheduleCell({ icon, time, label }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{time}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </div>
  );
}

function SyncResultsCard({ results }) {
  const synced = results.filter(r => r.status === 'synced').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return (
    <SectionCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <BarChart2 size={16} color="var(--text-secondary)" />
        <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>Sync Results</span>
        {synced > 0 && <SummaryChip label={`${synced} synced`} color="var(--success)" />}
        {skipped > 0 && <SummaryChip label={`${skipped} skipped`} color="var(--text-muted)" />}
        {failed > 0 && <SummaryChip label={`${failed} failed`} color="var(--error)" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((r, i) => <SyncResultRow key={i} result={r} delay={i * 60} />)}
      </div>
    </SectionCard>
  );
}

function SummaryChip({ label, color }) {
  return (
    <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: `${color}1f`, color }}>
      {label}
    </span>
  );
}

function SyncResultRow({ result: r, delay }) {
  const config = {
    synced: { color: 'var(--success)', bg: 'rgba(61,214,140,0.08)', Icon: CheckCircle },
    skipped: { color: 'var(--text-muted)', bg: 'var(--surface)', Icon: MinusCircle },
    failed: { color: 'var(--error)', bg: 'rgba(255,92,92,0.08)', Icon: XCircle },
  }[r.status] || { color: 'var(--text-muted)', bg: 'var(--surface)', Icon: MinusCircle };

  return (
    <div style={{
      padding: 12, borderRadius: 10, background: config.bg,
      border: `1px solid ${config.color}33`,
      animation: `slideInRight 0.3s ease ${delay}ms both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: r.gitlabBranch ? 7 : 0 }}>
        <config.Icon size={15} color={config.color} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.appName}</span>
        <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 700, background: `${config.color}1f`, color: config.color }}>
          {r.status?.toUpperCase()}
        </span>
      </div>

      {(r.gitlabBranch || r.githubBranch) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 23 }}>
          {r.gitlabBranch && <TinyBadge label={r.gitlabBranch} color="var(--warning)" />}
          {r.gitlabBranch && r.githubBranch && <ArrowRight size={10} color="var(--text-muted)" />}
          {r.githubBranch && <TinyBadge label={r.githubBranch} color="var(--success)" />}
        </div>
      )}

      {r.status === 'synced' && (r.filesChanged != null || r.additions != null || r.deletions != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '7px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
          {r.filesChanged != null && <StatChip icon="📄" label={`${r.filesChanged} file${r.filesChanged === 1 ? '' : 's'}`} color="var(--text-secondary)" />}
          {r.additions != null && <StatChip icon="+" label={`+${r.additions}`} color="var(--success)" />}
          {r.deletions != null && <StatChip icon="-" label={`-${r.deletions}`} color="var(--error)" />}
        </div>
      )}

      {r.status === 'synced' && r.prNumber && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <GitMerge size={13} color="var(--accent)" />
          <span style={{ fontSize: 11, color: 'var(--accent)' }}>PR #{r.prNumber} created</span>
        </div>
      )}

      {r.status === 'failed' && r.error && (
        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: 'rgba(255,92,92,0.08)', border: '1px solid rgba(255,92,92,0.2)', display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--error)', flexShrink: 0 }}>⚠</span>
          <span style={{ fontSize: 10, color: 'var(--error)' }}>{r.error}</span>
        </div>
      )}

      {r.status === 'skipped' && (
        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, paddingLeft: 23 }}>No changes detected or PR already open.</p>
      )}
    </div>
  );
}

function StatChip({ icon, label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

function WACConfirmDialog({ onClose, onConfirm, selectedMods, sendMail, pushCode, createPR, extraRecipients }) {
  const confirmRow = (active, icon, text) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <GitMerge size={14} color={active ? 'var(--success)' : 'var(--text-muted)'} />
      <span style={{ fontSize: 12, color: active ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: active ? 'none' : 'line-through' }}>{text}</span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, animation: 'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--surface-elevated)', borderRadius: 18, border: '1px solid var(--border)', padding: 24, maxWidth: 440, width: '100%', maxHeight: '80vh', overflow: 'auto', animation: 'fadeInUp 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <RefreshCw size={20} color="var(--success)" />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Confirm Sync</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Targeting {selectedMods.length} of {WAC_MODULES.length} apps:</p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
          {selectedMods.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.isBackend ? 'var(--warning)' : 'var(--success)', flexShrink: 0 }} />
              <span style={{ fontSize: 11 }}>{m.appName}</span>
            </div>
          ))}
        </div>

        {confirmRow(pushCode, null, 'GitHub Push Code (WAC-prod-branch)')}
        {confirmRow(createPR, null, 'GitHub PRs (WAC-prod-branch → master)')}
        {confirmRow(sendMail, null, `Email to ${extraRecipients.length > 0 ? extraRecipients.length : DEFAULT_RECIPIENTS_WAC.length} recipient(s)`)}

        <div style={{ padding: 10, borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid rgba(245,166,35,0.3)', display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 14 }}>
          <Info size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--accent)' }}>GitLab takes priority — conflicts resolve in GitLab's favour.</span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', border: '1px solid var(--border)' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--success)', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={15} /> Sync Now
          </button>
        </div>
      </div>
    </div>
  );
}

