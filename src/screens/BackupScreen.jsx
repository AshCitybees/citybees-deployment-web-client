import React, { useState } from 'react';
import {
  Database, HardDrive, Clock, Info, ShieldCheck,
  FileArchive, CloudUpload, ExternalLink,
} from 'lucide-react';
import {
  SectionCard, SectionHeader, ResultBanner, ActionButton, ConfirmDialog,
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

export default function BackupScreen() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-header">
        <Database size={18} color="var(--info)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          BACKUPS
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Intro */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 50ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(91,160,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={24} color="var(--info)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Backups → SharePoint</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                Manually trigger a run outside the schedule. Both jobs upload to SharePoint and email the result.
              </div>
            </div>
          </div>
        </SectionCard>

        <DbBackupCard />
        <BlobSyncCard />
      </div>
    </div>
  );
}

/* ── DB Backup ─────────────────────────────────────────────────────────────── */
function DbBackupCard() {
  const [status, setStatus] = useState('idle');
  const [resultMsg, setResultMsg] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTrigger = () => {
    if (!SettingsService.baseUrl) { setStatus('error'); setResultMsg('Azure Function URL not set. Go to Settings first.'); return; }
    setConfirmOpen(true);
  };

  const doTrigger = async () => {
    setStatus('loading'); setDetail(null);
    const r = await ApiService.triggerDbBackup();
    setStatus(r.status);
    if (r.status === 'success') {
      setDetail({ fileName: r.fileName, sizeBytes: r.sizeBytes, webUrl: r.webUrl });
      setResultMsg(`✓ Backup complete — ${r.fileName ?? 'dump'} (${fmtBytes(r.sizeBytes)}) uploaded to SharePoint.`);
    } else {
      setResultMsg(`Error ${r.httpStatus ?? ''}: ${r.error || r.message || 'Unknown error'}`);
    }
  };

  return (
    <SectionCard style={{ animation: 'fadeInUp 0.3s ease 90ms both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileArchive size={22} color="var(--accent)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Production DB Backup</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
            pg_dump of the prod PostgreSQL DB → compressed .dump → SharePoint.
          </div>
        </div>
        <ScheduleTag text="Daily · 00:00 GST" />
      </div>

      <InfoNote text="Runs on the prod VM (inside the DB's VNet) via Azure RunCommand. Usually completes in a few minutes." />

      {status !== 'idle' && status !== 'loading' && (
        <>{gap(14)}<ResultBanner isSuccess={status === 'success'} message={resultMsg} /></>
      )}

      {detail?.webUrl && (
        <>
          {gap(10)}
          <a href={detail.webUrl} target="_blank" rel="noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: 'var(--accent)', textDecoration: 'none', fontWeight: 600,
          }}>
            <ExternalLink size={13} /> Open in SharePoint
          </a>
        </>
      )}

      {gap(16)}
      <ActionButton
        label="RUN DB BACKUP NOW"
        onClick={status === 'loading' ? null : handleTrigger}
        isLoading={status === 'loading'}
        icon={Database}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doTrigger}
        title="Run DB Backup?"
        message="This dumps the production database and uploads it to SharePoint immediately, outside the daily schedule. A notification email is sent when it finishes."
        confirmLabel="Run Backup"
        confirmColor="var(--accent)"
        icon={<Database size={18} color="var(--accent)" />}
      />
    </SectionCard>
  );
}

/* ── Blob Sync ─────────────────────────────────────────────────────────────── */
function BlobSyncCard() {
  const [status, setStatus] = useState('idle');
  const [resultMsg, setResultMsg] = useState('');
  const [result, setResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleTrigger = () => {
    if (!SettingsService.baseUrl) { setStatus('error'); setResultMsg('Azure Function URL not set. Go to Settings first.'); return; }
    setConfirmOpen(true);
  };

  const doTrigger = async () => {
    setStatus('loading'); setResult(null);
    const r = await ApiService.triggerBlobSync();
    setStatus(r.status);
    if (r.status === 'success') {
      setResult(r.result ?? null);
      const res = r.result;
      setResultMsg(res
        ? `✓ Sync ${res.incomplete ? 'ran (partial)' : 'complete'} — ${res.uploaded} uploaded, ${res.skipped} skipped${res.failed ? `, ${res.failed} failed` : ''}.`
        : '✓ Blob sync complete.');
    } else {
      setResultMsg(`Error ${r.httpStatus ?? ''}: ${r.error || r.message || 'Unknown error'}`);
    }
  };

  return (
    <SectionCard style={{ animation: 'fadeInUp 0.3s ease 130ms both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--success-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CloudUpload size={22} color="var(--success)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Blob Storage Sync</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
            Mirror every Azure Blob container into SharePoint, recreating folders.
          </div>
        </div>
        <ScheduleTag text="Weekly · Fri 01:00 GST" />
      </div>

      <InfoNote text="Incremental — already-uploaded files are skipped, so reruns are fast. The first run can take a while; partial runs resume on the next trigger." />

      {status !== 'idle' && status !== 'loading' && (
        <>{gap(14)}<ResultBanner isSuccess={status === 'success'} message={resultMsg} /></>
      )}

      {result && (
        <>
          {gap(12)}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <StatCell label="Containers" value={result.containers} color="var(--text-secondary)" />
            <StatCell label="Scanned" value={result.scanned} color="var(--text-secondary)" />
            <StatCell label="Uploaded" value={result.uploaded} color="var(--success)" />
            <StatCell label="Skipped" value={result.skipped} color="var(--text-muted)" />
            <StatCell label="Failed" value={result.failed} color={result.failed ? 'var(--error)' : 'var(--text-muted)'} />
            <StatCell label="Complete" value={result.incomplete ? 'No' : 'Yes'} color={result.incomplete ? 'var(--warning)' : 'var(--success)'} />
          </div>
          {result.incomplete && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.25)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Info size={13} color="var(--warning)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--warning)' }}>
                Partial run — stopped on the time budget. Trigger again to resume; already-uploaded files are skipped.
              </span>
            </div>
          )}
          {result.errors?.length > 0 && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: 'rgba(255,92,92,0.06)', border: '1px solid rgba(255,92,92,0.2)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', marginBottom: 6 }}>Errors ({result.errors.length})</div>
              {result.errors.slice(0, 10).map((e, i) => (
                <div key={i} style={{ fontSize: 10, color: 'var(--error)', marginBottom: 3, lineHeight: 1.4 }}>{e}</div>
              ))}
            </div>
          )}
        </>
      )}

      {gap(16)}
      <ActionButton
        label="RUN BLOB SYNC NOW"
        onClick={status === 'loading' ? null : handleTrigger}
        isLoading={status === 'loading'}
        icon={HardDrive}
        color="var(--success)"
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doTrigger}
        title="Run Blob Sync?"
        message="This mirrors all Azure Blob Storage files into SharePoint immediately, outside the schedule. Already-uploaded files are skipped. A notification email is sent when it finishes."
        confirmLabel="Run Sync"
        confirmColor="var(--success)"
        icon={<CloudUpload size={18} color="var(--success)" />}
      />
    </SectionCard>
  );
}

/* ── Bits ──────────────────────────────────────────────────────────────────── */
function ScheduleTag({ text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600,
      background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)',
    }}>
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
