import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket, CheckCircle, AlertCircle, Clock, RefreshCw, Server,
  GitCommit, Activity, ShieldCheck, ChevronDown, ChevronRight,
  Play, XCircle,
} from 'lucide-react';
import { SectionCard, SectionHeader, Spinner, TinyBadge, ConfirmDialog, ResultBanner } from '../components/SharedComponents.jsx';
import { ApiService } from '../services/apiService.js';

/* ── helpers ── */
const STATUS_COLORS = {
  completed: 'var(--success)',
  failed: 'var(--error)',
  in_progress: 'var(--info)',
  pending: 'var(--warning)',
};

const fmtDuration = (s) => {
  if (s == null) return '—';
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const dt = new Date(iso);
  return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/* ── Stat card ── */
const StatCard = ({ value, label, color, icon: Icon }) => (
  <div style={{
    flex: 1, minWidth: 140,
    background: 'var(--surface-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={18} color={color} strokeWidth={2} />
    </div>
    <div>
      <div style={{
        fontSize: 24, fontWeight: 800, color,
        fontFamily: 'var(--font-mono)', letterSpacing: '-1px', lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 10, color: 'var(--text-muted)', marginTop: 4,
        letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</div>
    </div>
  </div>
);

/* ── VMSS pool card ── */
const PoolCard = ({ pool }) => {
  const color = pool.color === 'blue' ? 'var(--info)' : 'var(--success)';
  return (
    <div style={{
      flex: 1, minWidth: 220,
      background: 'var(--surface)', borderRadius: 14,
      border: pool.isActive ? `1px solid ${color}55` : '1px solid var(--border)',
      boxShadow: pool.isActive ? `0 0 20px ${pool.color === 'blue' ? 'rgba(77,166,255,0.12)' : 'rgba(34,211,122,0.12)'}` : 'none',
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Server size={15} color={color} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {pool.color}
        </span>
        {pool.isActive && <TinyBadge label="LIVE TRAFFIC" color={color} />}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {pool.name}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Capacity</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{pool.capacity ?? '—'}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>State</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: pool.provisioningState === 'Succeeded' ? 'var(--success)' : 'var(--warning)', marginTop: 3 }}>
            {pool.provisioningState ?? '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Instances</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{pool.instances?.length ?? 0}</div>
        </div>
      </div>
      {pool.instances?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {pool.instances.map((vm) => (
            <span key={vm.instanceId} style={{
              fontSize: 10, padding: '3px 8px', borderRadius: 6,
              fontFamily: 'var(--font-mono)',
              background: 'var(--surface-elevated)', border: '1px solid var(--border)',
              color: vm.provisioningState === 'Succeeded' ? 'var(--success)' : 'var(--warning)',
            }}>
              #{vm.instanceId} · {vm.provisioningState || '?'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Deployment row ── */
const DeploymentRow = ({ d }) => {
  const [open, setOpen] = useState(false);
  const color = STATUS_COLORS[d.status] || 'var(--text-muted)';
  const apps = [...new Set(d.approvals.map(a => a.application).filter(Boolean))];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
      >
        {open ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.5px', textTransform: 'uppercase',
          background: `${'var(--surface-elevated)'}`, border: `1px solid ${color}40`, color,
        }}>
          {d.status.replace('_', ' ')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
          {apps.length ? apps.join(', ') : 'No approved apps'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {fmtDuration(d.durationSeconds)}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.createdAt)}</span>
      </div>

      {open && (
        <div style={{ padding: '4px 16px 14px 42px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: '10px 0 8px' }}>
            ID: {d.id}
          </div>
          {d.failureReason && (
            <div style={{
              fontSize: 12, color: 'var(--error)', background: 'var(--error-dim)',
              border: '1px solid rgba(255,92,114,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 10,
            }}>
              {d.failureReason}
            </div>
          )}
          {d.approvals.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No approvals attached</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {d.approvals.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                  fontSize: 12, padding: '8px 12px', borderRadius: 8,
                  background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)',
                }}>
                  <GitCommit size={12} color="var(--text-muted)" />
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{a.application || '?'}</span>
                  <TinyBadge
                    label={a.status}
                    color={a.status === 'approved' ? 'var(--success)' : a.status === 'rejected' ? 'var(--error)' : 'var(--warning)'}
                  />
                  {a.commitId && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                      {a.commitId.slice(0, 8)}
                    </span>
                  )}
                  {a.approvers?.length > 0 && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                      ✓ {a.approvers.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Ready-to-deploy card ── */
const ReadyCard = ({ d, activePool, deploying, onAction }) => {
  const approved = d.approvals.filter(a => a.status === 'approved');
  const apps = [...new Set(approved.map(a => a.application).filter(Boolean))];
  const busy = !!deploying;
  const isThisDeploying = deploying?.deploymentId === d.id;

  const DeployBtn = ({ target, color }) => (
    <button
      onClick={() => onAction(d.id, target)}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: `${target === 'reject' ? 'var(--error-dim)' : color === 'var(--info)' ? 'rgba(77,166,255,0.10)' : 'var(--success-dim)'}`,
        border: `1px solid ${color}45`, color,
        fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy && !isThisDeploying ? 0.4 : 1,
        padding: '8px 16px', borderRadius: 8,
      }}
    >
      {isThisDeploying && deploying.target === target
        ? <Spinner size={13} color={color} />
        : target === 'reject' ? <XCircle size={13} /> : <Play size={13} />}
      {target === 'reject' ? 'Reject' : `Deploy → ${target.toUpperCase()}`}
      {target !== 'reject' && activePool === target && (
        <span style={{ fontSize: 9, opacity: 0.8 }}>(live)</span>
      )}
    </button>
  );

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-accent)',
      borderRadius: 14, padding: '16px 18px',
      boxShadow: '0 0 20px rgba(245,166,35,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <TinyBadge label="READY" color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
          {apps.length ? apps.join(', ') : 'No approved builds yet'}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {d.id.slice(0, 8)} · {fmtDate(d.createdAt)}
        </span>
      </div>

      {approved.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
          {approved.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
              padding: '7px 12px', borderRadius: 8,
              background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)',
            }}>
              <GitCommit size={12} color="var(--text-muted)" />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{a.application}</span>
              {a.commitId && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  {a.commitId.slice(0, 8)}
                </span>
              )}
              {a.commitMessage && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {a.commitMessage}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <DeployBtn target="blue" color="var(--info)" />
        <DeployBtn target="green" color="var(--success)" />
        <div style={{ flex: 1 }} />
        <DeployBtn target="reject" color="var(--error)" />
      </div>
      {isThisDeploying && deploying.target !== 'reject' && (
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 10 }}>
          Deployment running — this can take 10–15 minutes. Status updates automatically.
        </div>
      )}
    </div>
  );
};

/* ── Screen ── */
export default function DeploymentsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);
  const [confirm, setConfirm] = useState(null);
  const [deploying, setDeploying] = useState(null);
  const [actionResult, setActionResult] = useState(null);

  const load = useCallback(async (d = days, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    const res = await ApiService.getDeploymentStats({ days: d });
    if (res.status === 'success') setStats(res.data);
    else setError(res.message || 'Failed to load stats');
    if (!silent) setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasActive = deploying || stats?.deployments?.some(d => d.status === 'in_progress');
  useEffect(() => {
    if (!hasActive) return;
    const t = setInterval(() => load(days, true), 20000);
    return () => clearInterval(t);
  }, [hasActive, days, load]);

  const runAction = async (deploymentId, target) => {
    setConfirm(null);
    setActionResult(null);
    setDeploying({ deploymentId, target });
    const res = await ApiService.triggerVmssDeploy({ deploymentId, target });
    setDeploying(null);
    setActionResult({
      isSuccess: res.status === 'success',
      message: res.message || (res.status === 'success' ? 'Done' : 'Failed'),
    });
    load(days, true);
  };

  const s = stats?.summary;
  const readyDeployments = (stats?.deployments || []).filter(d => d.status === 'pending');

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-header">
        <Rocket size={18} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          DEPLOYMENTS
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={days}
            onChange={(e) => { const d = Number(e.target.value); setDays(d); load(d); }}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={() => load()}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', padding: '7px 14px', borderRadius: 8,
            }}
          >
            {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 48px 80px' }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
            fontSize: 13, color: 'var(--error)', background: 'var(--error-dim)',
            border: '1px solid rgba(255,92,114,0.3)', borderRadius: 10, padding: '12px 16px',
          }}>
            <AlertCircle size={15} /> {error} — check the API base URL in Settings.
          </div>
        )}

        {loading && !stats ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spinner size={28} /></div>
        ) : stats && (
          <>
            {actionResult && <div style={{ marginBottom: 18 }}><ResultBanner isSuccess={actionResult.isSuccess} message={actionResult.message} /></div>}

            {/* Ready to deploy */}
            {readyDeployments.length > 0 && (
              <>
                <SectionCard>
                  <SectionHeader label="Ready to deploy" icon={Rocket} trailing={
                    stats.vmss?.activePool && (
                      <TinyBadge label={`LIVE: ${stats.vmss.activePool.toUpperCase()}`} color={stats.vmss.activePool === 'blue' ? 'var(--info)' : 'var(--success)'} />
                    )
                  } />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 6 }}>
                    {readyDeployments.map((d) => (
                      <ReadyCard
                        key={d.id}
                        d={d}
                        activePool={stats.vmss?.activePool}
                        deploying={deploying}
                        onAction={(deploymentId, target) => setConfirm({ deploymentId, target })}
                      />
                    ))}
                  </div>
                </SectionCard>
                <div style={{ height: 22 }} />
              </>
            )}

            {/* Summary cards */}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <StatCard value={s.total} label="Deployments" color="var(--accent)" icon={Rocket} />
              <StatCard value={s.completed} label="Completed" color="var(--success)" icon={CheckCircle} />
              <StatCard value={s.failed} label="Failed" color="var(--error)" icon={AlertCircle} />
              <StatCard value={s.successRate != null ? `${s.successRate}%` : '—'} label="Success rate" color="var(--info)" icon={Activity} />
              <StatCard value={fmtDuration(s.avgDurationSeconds)} label="Avg duration" color="var(--warning)" icon={Clock} />
            </div>

            {/* Approval pipeline */}
            <div style={{ height: 22 }} />
            <SectionCard>
              <SectionHeader label="Approval pipeline" icon={ShieldCheck} />
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                <StatCard value={stats.approvals.approved} label="Approved" color="var(--success)" icon={CheckCircle} />
                <StatCard value={stats.approvals.pending} label="Pending" color="var(--warning)" icon={Clock} />
                <StatCard value={stats.approvals.rejected} label="Rejected" color="var(--error)" icon={AlertCircle} />
              </div>
            </SectionCard>

            {/* Live VMSS */}
            <div style={{ height: 22 }} />
            <SectionCard>
              <SectionHeader
                label="Live VMSS state"
                icon={Server}
                trailing={stats.vmss?.activePool && (
                  <TinyBadge label={`ACTIVE: ${stats.vmss.activePool.toUpperCase()}`} color={stats.vmss.activePool === 'blue' ? 'var(--info)' : 'var(--success)'} />
                )}
              />
              {stats.vmss?.error ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                  Unavailable: {stats.vmss.error}
                </div>
              ) : stats.vmss?.pools ? (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                  {stats.vmss.pools.map((p) => <PoolCard key={p.color} pool={p} />)}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Not requested</div>
              )}
            </SectionCard>

            {/* Recent deployments */}
            <div style={{ height: 22 }} />
            <SectionCard>
              <SectionHeader label={`Recent deployments (${stats.deployments.length})`} icon={Rocket} />
              {stats.deployments.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>No deployments yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                  {stats.deployments.map((d) => <DeploymentRow key={d.id} d={d} />)}
                </div>
              )}
            </SectionCard>

            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 18, textAlign: 'right' }}>
              Updated {fmtDate(stats.generatedAt)} · window {stats.windowDays}d
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.target === 'reject' ? 'Reject deployment?' : `Deploy to ${confirm?.target?.toUpperCase()} VMSS?`}
        message={confirm?.target === 'reject'
          ? 'This marks the deployment as failed (rejected by approver). Approved builds will need to be resubmitted.'
          : `This starts a PRODUCTION deployment to the ${confirm?.target} pool. It runs 10–15 minutes and switches gateway traffic when healthy.`}
        confirmLabel={confirm?.target === 'reject' ? 'Reject deployment' : `Deploy to ${confirm?.target}`}
        confirmColor={confirm?.target === 'reject' ? 'var(--error)' : 'var(--accent)'}
        onConfirm={() => runAction(confirm.deploymentId, confirm.target)}
      />
    </div>
  );
}
