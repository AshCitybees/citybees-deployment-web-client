import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Database, HardDrive, Clock, Info, ShieldCheck,
  FileArchive, CloudUpload, ExternalLink, Loader,
} from 'lucide-react';
import {
  SectionCard, ActionButton, ConfirmDialog,
} from '../components/SharedComponents.jsx';
import { SettingsService } from '../services/settingsService.js';
import { ApiService } from '../services/apiService.js';

const gap = (h) => <div style={{ height: h }} />;
const fmtBytes = (n) => {
  if (n == null) return 'unknown';
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};
const fmtElapsed = (ms) => {
  if (ms == null || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

/**
 * Tracks one backup job entirely from the server's status endpoint, so the bar
 * resumes after a refresh / reopen. Polls fast while running, slowly when idle.
 */
function useBackupJob(getStatus, startFn, enabled) {
  const [status, setStatus] = useState(null);
  const [starting, setStarting] = useState(false);
  const timerRef = useRef(null);
  const aliveRef = useRef(true);

  const tick = useCallback(async () => {
    if (!aliveRef.current) return;
    const s = await getStatus();
    if (!aliveRef.current) return;
    setStatus(s);
    const running = s?.state === 'running';
    timerRef.current = setTimeout(tick, running ? 2500 : 20000);
  }, [getStatus]);

  useEffect(() => {
    aliveRef.current = true;
    if (enabled) tick();
    return () => { aliveRef.current = false; clearTimeout(timerRef.current); };
  }, [enabled, tick]);

  const start = useCallback(() => {
    setStarting(true);
    // Optimistic running state so the bar appears instantly.
    setStatus((prev) => ({
      ...(prev || {}), state: 'running', phase: 'queued',
      message: 'Starting…', progress: 0, startedAt: new Date().toISOString(),
      finishedAt: null, detail: {},
    }));
    // Fire and forget — the status endpoint is the source of truth.
    startFn().catch(() => {});
    clearTimeout(timerRef.current);
    setTimeout(async () => {
      const s = await getStatus();
      if (aliveRef.current) { setStatus(s); setStarting(false); tick(); }
    }, 1500);
  }, [startFn, getStatus, tick]);

  return { status, starting, start };
}

export default function BackupScreen() {
  const hasUrl = SettingsService.baseUrl.length > 0;

  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        @keyframes cbslide { 0% { transform: translateX(-120%); } 100% { transform: translateX(420%); } }
      `}</style>

      <div className="page-header">
        <Database size={18} color="var(--info)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          BACKUPS
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 50ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(91,160,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={24} color="var(--info)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Backups → SharePoint</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                Trigger a run outside the schedule. Progress is tracked server-side, so it keeps going — and the bar resumes — even if you refresh or close this tab.
              </div>
            </div>
          </div>
        </SectionCard>

        {!hasUrl && (
          <div style={{ padding: '14px 20px', borderRadius: 14, background: 'rgba(255,92,114,0.08)', border: '1px solid rgba(255,92,114,0.25)', borderLeft: '3px solid var(--error)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Info size={16} color="var(--error)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--error)' }}>Azure Function URL not set. Configure it in Settings to enable backups.</span>
          </div>
        )}

        <JobCard
          enabled={hasUrl}
          accent="var(--accent)"
          accentDim="var(--accent-dim)"
          icon={FileArchive}
          runIcon={Database}
          title="Production DB Backup"
          subtitle="pg_dump of the prod PostgreSQL DB → compressed .dump → SharePoint."
          schedule="Daily · 00:00 GST"
          note="Runs on the prod VM (inside the DB's VNet) via Azure RunCommand. Usually completes in a few minutes."
          buttonLabel="RUN DB BACKUP NOW"
          confirmTitle="Run DB Backup?"
          confirmMsg="This dumps the production database and uploads it to SharePoint immediately, outside the daily schedule. A notification email is sent when it finishes."
          confirmLabel="Run Backup"
          getStatus={ApiService.getDbBackupStatus}
          startFn={ApiService.startDbBackup}
          renderDetail={renderDbDetail}
          animDelay={90}
        />

        <JobCard
          enabled={hasUrl}
          accent="var(--success)"
          accentDim="var(--success-dim)"
          icon={CloudUpload}
          runIcon={HardDrive}
          title="Blob Storage Sync"
          subtitle="Mirror every Azure Blob container into SharePoint, recreating folders."
          schedule="Weekly · Fri 01:00 GST"
          note="Incremental — already-uploaded files are skipped, so reruns are fast. The first run can take a while; partial runs resume on the next trigger."
          buttonLabel="RUN BLOB SYNC NOW"
          confirmTitle="Run Blob Sync?"
          confirmMsg="This mirrors all Azure Blob Storage files into SharePoint immediately, outside the schedule. Already-uploaded files are skipped. A notification email is sent when it finishes."
          confirmLabel="Run Sync"
          getStatus={ApiService.getBlobSyncStatus}
          startFn={ApiService.startBlobSync}
          renderDetail={renderBlobDetail}
          animDelay={130}
        />
      </div>
    </div>
  );
}

/* ── Generic job card ──────────────────────────────────────────────────────── */
function JobCard({
  enabled, accent, accentDim, icon: Icon, runIcon, title, subtitle, schedule, note,
  buttonLabel, confirmTitle, confirmMsg, confirmLabel, getStatus, startFn, renderDetail, animDelay,
}) {
  const job = useBackupJob(getStatus, startFn, enabled);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const s = job.status;
  const state = s?.state ?? 'idle';
  const running = state === 'running';

  // Tick a clock while running for the elapsed readout.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsedMs = running && s?.startedAt ? now - new Date(s.startedAt).getTime() : null;

  return (
    <SectionCard style={{ animation: `fadeInUp 0.3s ease ${animDelay}ms both` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={22} color={accent} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>{subtitle}</div>
        </div>
        <ScheduleTag text={schedule} />
      </div>

      <InfoNote text={note} />

      {/* Live progress while running */}
      {running && (
        <>
          {gap(16)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Loader size={14} color={accent} style={{ animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s?.message || 'Working…'}
            </span>
            {s?.progress != null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: 'var(--font-mono)' }}>{s.progress}%</span>
            )}
          </div>
          <ProgressBar progress={s?.progress} color={accent} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s?.phase ? s.phase.replace(/-/g, ' ') : ''}</span>
            {elapsedMs != null && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtElapsed(elapsedMs)} elapsed</span>}
          </div>
          {renderDetail && renderDetail(s, accent)}
        </>
      )}

      {/* Final result */}
      {(state === 'success' || state === 'error') && (
        <>
          {gap(14)}
          <ResultStrip
            ok={state === 'success'}
            message={s?.message || (state === 'success' ? 'Completed.' : 'Failed.')}
            finishedAt={s?.finishedAt}
          />
          {renderDetail && renderDetail(s, accent)}
        </>
      )}

      {gap(16)}
      <ActionButton
        label={running ? 'RUNNING…' : buttonLabel}
        onClick={running || job.starting ? null : () => setConfirmOpen(true)}
        isLoading={running || job.starting}
        icon={runIcon}
        color={accent}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={job.start}
        title={confirmTitle}
        message={confirmMsg}
        confirmLabel={confirmLabel}
        confirmColor={accent}
        icon={<Icon size={18} color={accent} />}
      />
    </SectionCard>
  );
}

/* ── Detail renderers ──────────────────────────────────────────────────────── */
function renderDbDetail(s, accent) {
  const d = s?.detail || {};
  if (!d.fileName && !d.webUrl) return null;
  return (
    <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {d.fileName && <Row label="File" value={d.fileName} mono />}
      {d.sizeBytes != null && <Row label="Size" value={fmtBytes(d.sizeBytes)} />}
      {d.webUrl && (
        <a href={d.webUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: accent, textDecoration: 'none', fontWeight: 600, marginTop: 6 }}>
          <ExternalLink size={13} /> Open in SharePoint
        </a>
      )}
    </div>
  );
}

function renderBlobDetail(s) {
  const d = s?.detail || {};
  if (d.scanned == null && d.uploaded == null && d.containers == null) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        <StatCell label="Containers" value={d.containers} color="var(--text-secondary)" />
        <StatCell label="Scanned" value={d.scanned} color="var(--text-secondary)" />
        <StatCell label="Uploaded" value={d.uploaded} color="var(--success)" />
        <StatCell label="Skipped" value={d.skipped} color="var(--text-muted)" />
        <StatCell label="Failed" value={d.failed} color={d.failed ? 'var(--error)' : 'var(--text-muted)'} />
        {d.incomplete != null && <StatCell label="Complete" value={d.incomplete ? 'No' : 'Yes'} color={d.incomplete ? 'var(--warning)' : 'var(--success)'} />}
      </div>
      {d.lastFile && s?.state === 'running' && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ↳ {d.lastFile}
        </div>
      )}
      {d.incomplete && s?.state !== 'running' && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.25)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Info size={13} color="var(--warning)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>Partial run — trigger again to resume; already-uploaded files are skipped.</span>
        </div>
      )}
      {Array.isArray(d.errors) && d.errors.length > 0 && (
        <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(255,92,92,0.06)', border: '1px solid rgba(255,92,92,0.2)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>Errors ({d.errors.length})</div>
          {d.errors.slice(0, 10).map((e, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--error)', marginBottom: 3, lineHeight: 1.4 }}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Bits ──────────────────────────────────────────────────────────────────── */
function ProgressBar({ progress, color }) {
  const indeterminate = progress == null;
  return (
    <div style={{ height: 10, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
      {indeterminate ? (
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: '30%', borderRadius: 6, background: color, animation: 'cbslide 1.3s ease-in-out infinite' }} />
      ) : (
        <div style={{ height: '100%', width: `${Math.max(2, Math.min(100, progress))}%`, borderRadius: 6, background: `linear-gradient(90deg, ${color}, ${color}bb)`, transition: 'width 0.4s ease' }} />
      )}
    </div>
  );
}

function ResultStrip({ ok, message, finishedAt }) {
  const color = ok ? 'var(--success)' : 'var(--error)';
  const dim = ok ? 'var(--success-dim)' : 'var(--error-dim)';
  return (
    <div style={{ padding: '14px 16px', borderRadius: 12, border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`, background: dim, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ fontSize: 15, lineHeight: 1.3, color }}>{ok ? '✓' : '⚠'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color, lineHeight: 1.5 }}>{message}</div>
        {finishedAt && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(finishedAt).toLocaleString()}</div>}
      </div>
    </div>
  );
}

function ScheduleTag({ text }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      <Clock size={11} /> {text}
    </span>
  );
}

function InfoNote({ text }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function StatCell({ label, value, color }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{value ?? '–'}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 11, marginBottom: 4 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 44 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}
