import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, AppWindow, Plus, Pencil, Trash2, X, Check,
  RefreshCw, AlertCircle, Mail, GitBranch,
} from 'lucide-react';
import {
  SectionCard, Spinner, TinyBadge, ConfirmDialog, ResultBanner,
  StyledInput, Toggle,
} from '../components/SharedComponents.jsx';
import { ApiService } from '../services/apiService.js';

const ROLES = ['viewer', 'approver', 'approver-admin', 'admin', 'super-admin'];
const ROLE_COLORS = {
  'super-admin': 'var(--error)',
  'admin': 'var(--accent)',
  'approver-admin': 'var(--warning)',
  'approver': 'var(--info)',
  'viewer': 'var(--text-muted)',
};

const EMPTY_USER = { name: '', email: '', role: 'viewer', status: true };
const EMPTY_APP = { application_name: '', slug: '', repo_name: '' };

const Field = ({ label, children, flex = 1 }) => (
  <div style={{ flex, minWidth: 160 }}>
    <div style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6,
    }}>{label}</div>
    {children}
  </div>
);

const RoleSelect = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      width: '100%', height: 46, borderRadius: 12,
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      color: 'var(--text-primary)', fontSize: 13, padding: '0 12px',
      outline: 'none', cursor: 'pointer',
    }}
  >
    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
  </select>
);

const IconBtn = ({ icon: Icon, color, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
      background: 'var(--surface-elevated)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    <Icon size={14} color={color} />
  </button>
);

export default function UsersAppsScreen() {
  const [tab, setTab] = useState('users');
  const [rows, setRows] = useState({ users: [], applications: [] });
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [form, setForm] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isUsers = tab === 'users';
  const entity = isUsers ? 'users' : 'applications';

  const load = useCallback(async () => {
    setLoading(true);
    const [u, a] = await Promise.all([
      ApiService.listRecords('users'),
      ApiService.listRecords('applications'),
    ]);
    if (u.status === 'success' && a.status === 'success') {
      setRows({ users: u.data || [], applications: a.data || [] });
    } else {
      setBanner({ isSuccess: false, message: u.message || a.message || 'Failed to load records' });
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startAdd = () => {
    setEditingId(null);
    setForm(isUsers ? { ...EMPTY_USER } : { ...EMPTY_APP });
    setBanner(null);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm(isUsers
      ? { name: row.name || '', email: row.email || '', role: row.role || 'viewer', status: row.status }
      : { application_name: row.application_name || '', slug: row.slug || '', repo_name: row.repo_name || '' });
    setBanner(null);
  };

  const cancelForm = () => { setForm(null); setEditingId(null); };

  const save = async () => {
    setSaving(true);
    setBanner(null);
    const res = editingId
      ? await ApiService.updateRecord(entity, editingId, form)
      : await ApiService.createRecord(entity, form);
    setSaving(false);
    if (res.status === 'success') {
      setBanner({ isSuccess: true, message: editingId ? 'Saved' : 'Created' });
      cancelForm();
      load();
    } else {
      setBanner({ isSuccess: false, message: res.message });
    }
  };

  const doDelete = async () => {
    const { id } = deleteTarget;
    setDeleteTarget(null);
    const res = await ApiService.deleteRecord(entity, id);
    setBanner(res.status === 'success'
      ? { isSuccess: true, message: 'Deleted' }
      : { isSuccess: false, message: res.message });
    if (res.status === 'success') load();
  };

  const toggleUserStatus = async (row) => {
    const res = await ApiService.updateRecord('users', row.id, { status: !row.status });
    if (res.status === 'success') load();
    else setBanner({ isSuccess: false, message: res.message });
  };

  const list = rows[entity];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="page-header">
        <Users size={18} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          USERS &amp; APPS
        </span>
        <button
          onClick={load}
          disabled={loading}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7,
            background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
            color: 'var(--accent)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', padding: '7px 14px', borderRadius: 8,
          }}
        >
          {loading ? <Spinner size={13} /> : <RefreshCw size={13} />}
          Refresh
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 48px 80px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
          {[['users', 'Users', Users], ['applications', 'Applications', AppWindow]].map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => { setTab(id); cancelForm(); setBanner(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: tab === id ? 'var(--accent-dim)' : 'var(--surface)',
                border: tab === id ? '1px solid var(--border-accent)' : '1px solid var(--border)',
                color: tab === id ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Icon size={14} />
              {label}
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                {rows[id].length}
              </span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {!form && (
            <button
              onClick={startAdd}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'var(--accent)', border: 'none', color: '#0A0B0E',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                padding: '9px 18px', borderRadius: 10,
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Add {isUsers ? 'user' : 'application'}
            </button>
          )}
        </div>

        {banner && <div style={{ marginBottom: 18 }}><ResultBanner isSuccess={banner.isSuccess} message={banner.message} /></div>}

        {/* Add / Edit form */}
        {form && (
          <div style={{ marginBottom: 22 }}>
            <SectionCard>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '1px' }}>
                  {editingId ? `EDIT ${isUsers ? 'USER' : 'APPLICATION'}` : `NEW ${isUsers ? 'USER' : 'APPLICATION'}`}
                </span>
                <button onClick={cancelForm} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={16} color="var(--text-muted)" />
                </button>
              </div>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {isUsers ? (
                  <>
                    <Field label="Name">
                      <StyledInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
                    </Field>
                    <Field label="Email">
                      <StyledInput value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@citybees.ae" type="email" />
                    </Field>
                    <Field label="Role" flex="0 0 180px">
                      <RoleSelect value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
                    </Field>
                    <Field label="Active" flex="0 0 80px">
                      <div style={{ height: 46, display: 'flex', alignItems: 'center' }}>
                        <Toggle value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
                      </div>
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Application name">
                      <StyledInput value={form.application_name} onChange={(v) => setForm({ ...form, application_name: v })} placeholder="citybees-api" />
                    </Field>
                    <Field label="Slug">
                      <StyledInput value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="citybees-api" />
                    </Field>
                    <Field label="Repo name">
                      <StyledInput value={form.repo_name} onChange={(v) => setForm({ ...form, repo_name: v })} placeholder="github repo name" />
                    </Field>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
                <button
                  onClick={cancelForm}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: '9px 18px', borderRadius: 10,
                  }}
                >Cancel</button>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'var(--accent)', border: 'none', color: '#0A0B0E',
                    fontSize: 12, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                    padding: '9px 20px', borderRadius: 10,
                  }}
                >
                  {saving ? <Spinner size={13} color="#0A0B0E" /> : <Check size={14} strokeWidth={2.5} />}
                  {editingId ? 'Save changes' : 'Create'}
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Table */}
        {loading && !list.length ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={26} /></div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-muted)', fontSize: 13 }}>
            No {entity} yet — add the first one.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map((row) => (
              <div key={row.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 16px',
                opacity: isUsers && !row.status ? 0.55 : 1,
              }}>
                {isUsers ? (
                  <>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: 'var(--accent)',
                    }}>
                      {(row.name || row.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {row.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Mail size={10} /> {row.email}
                      </div>
                    </div>
                    <TinyBadge label={row.role} color={ROLE_COLORS[row.role] || 'var(--text-muted)'} />
                    <div title={row.status ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                      <Toggle value={row.status} onChange={() => toggleUserStatus(row)} />
                    </div>
                  </>
                ) : (
                  <>
                    <AppWindow size={16} color="var(--info)" style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {row.application_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <GitBranch size={10} /> {row.repo_name}
                        {row.slug && <span style={{ fontFamily: 'var(--font-mono)' }}>· {row.slug}</span>}
                      </div>
                    </div>
                  </>
                )}
                <IconBtn icon={Pencil} color="var(--text-secondary)" title="Edit" onClick={() => startEdit(row)} />
                <IconBtn icon={Trash2} color="var(--error)" title="Delete" onClick={() => setDeleteTarget(row)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${isUsers ? 'user' : 'application'}?`}
        message={isUsers
          ? `${deleteTarget?.name || deleteTarget?.email} will be removed. Users with approval votes can't be deleted — deactivate them instead.`
          : `${deleteTarget?.application_name} will be removed. Applications with linked approvals can't be deleted.`}
        confirmLabel="Delete"
        confirmColor="var(--error)"
        icon={AlertCircle}
        onConfirm={doDelete}
      />
    </div>
  );
}
