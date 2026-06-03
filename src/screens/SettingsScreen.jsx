import React, { useState } from 'react';
import {
  Cloud, Save, Wifi, ToggleLeft, GitMerge,
  AlertTriangle, Info, Mail, Upload, Check, Settings
} from 'lucide-react';
import {
  SectionCard, SectionHeader, ToggleRow, ResultBanner,
  StyledInput, ActionButton, ConfirmDialog, Spinner
} from '../components/SharedComponents.jsx';
import { SettingsService } from '../services/settingsService.js';
import { ApiService } from '../services/apiService.js';

export default function SettingsScreen({ onBack }) {
  const [url, setUrl] = useState(SettingsService.baseUrl);
  const [urlSaved, setUrlSaved] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [sendMail, setSendMail] = useState(SettingsService.defaultSendMail);
  const [createPR, setCreatePR] = useState(SettingsService.defaultCreatePR);
  const [pushCode, setPushCode] = useState(SettingsService.defaultPushCode);
  const [clearConfirm, setClearConfirm] = useState(false);

  const saveUrl = async () => {
    SettingsService.setBaseUrl(url);
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const ok = await ApiService.testConnection(url.trim());
    setTesting(false);
    setTestResult(ok ? 'Connected successfully!' : 'Could not reach the server. Check the URL.');
  };

  const handleSetMail = (v) => { setSendMail(v); SettingsService.setDefaultSendMail(v); };
  const handleSetPR = (v) => { setCreatePR(v); SettingsService.setDefaultCreatePR(v); };
  const handleSetPush = (v) => { setPushCode(v); SettingsService.setDefaultPushCode(v); };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="page-header">
        <Settings size={18} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          SETTINGS
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Azure URL */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 50ms both' }}>
          <SectionHeader label="Azure Function URL" icon={Cloud} />
          <div style={{ marginTop: 6, marginBottom: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            Base URL for your Azure Functions app (no trailing slash)
          </div>
          <StyledInput
            value={url}
            onChange={setUrl}
            placeholder="https://your-app.azurewebsites.net"
            onKeyDown={e => e.key === 'Enter' && saveUrl()}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button
              onClick={saveUrl}
              style={{
                flex: 1, height: 44, borderRadius: 10,
                background: urlSaved ? 'var(--success)' : 'var(--accent)',
                color: 'var(--bg)', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              {urlSaved ? <Check size={16} /> : <Save size={16} />}
              {urlSaved ? 'Saved!' : 'Save URL'}
            </button>
            <button
              onClick={testConnection}
              disabled={testing}
              style={{
                height: 44, padding: '0 16px', borderRadius: 10,
                background: 'transparent', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 8, cursor: testing ? 'not-allowed' : 'pointer',
              }}
            >
              {testing ? <Spinner size={14} color="var(--text-secondary)" /> : <Wifi size={16} />}
              Test
            </button>
          </div>
          {testResult && (
            <div style={{ marginTop: 12 }}>
              <ResultBanner isSuccess={testResult.includes('success')} message={testResult} />
            </div>
          )}
        </SectionCard>

        {/* Default Toggles */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 100ms both' }}>
          <SectionHeader label="Default Toggles" icon={ToggleLeft} />
          <div style={{ marginTop: 6, marginBottom: 16, fontSize: 11, color: 'var(--text-muted)' }}>
            Pre-set values when opening each function screen
          </div>
          <ToggleRow label="Send Mail by default" subtitle="Pre-enable the mail toggle on all screens" value={sendMail} onChange={handleSetMail} icon={Mail} />
          <div style={{ height: 12 }} />
          <ToggleRow label="Create PRs by default" subtitle="Pre-enable the PR toggle on all screens" value={createPR} onChange={handleSetPR} icon={GitMerge} />
          <div style={{ height: 12 }} />
          <ToggleRow label="Push Code by default" subtitle="Pre-enable the Push Code toggle on all screens" value={pushCode} onChange={handleSetPush} icon={Upload} />
        </SectionCard>

        {/* Repositories */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 150ms both' }}>
          <SectionHeader label="Repositories" icon={Info} />
          <div style={{ height: 14 }} />
          <RepoRow platform="GitLab" host="gitlab.webandcrafts.com" scope="wac0220250052-*" color="var(--warning)" />
          <div style={{ height: 8 }} />
          <RepoRow platform="GitHub" host="github.com/Citybees-P1" scope="Citybees-* repos" color="var(--accent)" />
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 200ms both' }}>
          <SectionHeader
            label="Danger Zone"
            icon={AlertTriangle}
            trailing={
              <span style={{
                padding: '3px 8px', borderRadius: 6, fontSize: 10,
                background: 'var(--error-dim)', color: 'var(--error)',
              }}>irreversible</span>
            }
          />
          <div style={{ height: 14 }} />
          <button
            onClick={() => setClearConfirm(true)}
            style={{
              width: '100%', height: 44, borderRadius: 10,
              background: 'transparent', border: '1px solid var(--error)',
              color: 'var(--error)', fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            🗑 Clear Run History
          </button>
        </SectionCard>

        {/* About */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 230ms both' }}>
          <SectionHeader label="About" icon={Info} />
          <div style={{ height: 14 }} />
          {[
            ['App', 'Citybees Deploy Control Panel'],
            ['Version', '1.0.0'],
            ['Functions', 'send_UAT_approval_mail, sync_WAC_prod'],
            ['Apps', '4 (requestor, provider, admin, backend)'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
              <span style={{ width: 80, fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{k}</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </SectionCard>
      </div>

      <ConfirmDialog
        open={clearConfirm}
        onClose={() => setClearConfirm(false)}
        title="Clear History?"
        message="This will permanently delete all run history logs."
        onConfirm={() => { SettingsService.clearHistory(); }}
        confirmLabel="Clear"
        confirmColor="var(--error)"
      />
    </div>
  );
}

const RepoRow = ({ platform, host, scope, color }) => (
  <div style={{
    padding: 12, borderRadius: 10, background: 'var(--surface)',
    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color }}>{platform}</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{host}</div>
    </div>
    <CopyBadge text={host} scope={scope} color={color} />
  </div>
);

const CopyBadge = ({ text, scope, color }) => {
  const [copied, setCopied] = useState(false);
  return (
    <span
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        padding: '4px 8px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
        background: `${color}1a`, color: copied ? 'var(--success)' : color,
      }}
    >
      {copied ? '✓ Copied' : scope}
    </span>
  );
};
