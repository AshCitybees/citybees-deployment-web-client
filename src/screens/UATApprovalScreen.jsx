import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  CheckCircle, GitMerge, Mail, Upload,
  Star, Calendar, Users, Bookmark, BookmarkPlus, Rocket,
  Plus, Minus, X, ChevronDown, ChevronUp, RefreshCw, Info, AlertTriangle, ArrowRight
} from 'lucide-react';
import {
  SectionCard, SectionHeader, ToggleRow, ResultBanner,
  StyledInput, StyledTextarea, ActionButton, PillTag, ModuleCard, TinyBadge, ConfirmDialog, Spinner
} from '../components/SharedComponents.jsx';
import { SettingsService } from '../services/settingsService.js';
import { ApiService } from '../services/apiService.js';
import { UAT_MODULES, DEFAULT_RECIPIENTS_UAT } from '../models/constants.js';

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const gap = (h) => <div style={{ height: h }} />;

const ArrayField = ({ label, icon: Icon, items, onAdd, onRemove, hint, emptyText, inputVal, onInputChange, accentColor, numbered }) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
      <Icon size={13} color={accentColor} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
        {label}{items.length > 0 ? ` (${items.length})` : ''}
      </span>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <StyledInput value={inputVal} onChange={onInputChange} placeholder={hint} onKeyDown={e => e.key === 'Enter' && onAdd()} style={{ flex: 1 }} />
      <button onClick={onAdd} style={{
        width: 40, height: 44, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
        background: `${accentColor}1a`, border: `1px solid ${accentColor}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={20} color={accentColor} />
      </button>
    </div>
    {items.length === 0
      ? <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{emptyText}</p>
      : (
        <div style={{ marginTop: 10, borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                background: `${accentColor}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>{numbered ? i + 1 : '▸'}</span>
              </div>
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}</span>
              <button onClick={() => onRemove(i)} style={{
                width: 24, height: 24, borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                background: 'var(--error-dim)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={13} color="var(--error)" />
              </button>
            </div>
          ))}
        </div>
      )
    }
  </div>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function UATApprovalScreen({ onBack }) {
  const draft = SettingsService.uatDraft;

  const [sendMail, setSendMail] = useState(draft?.sendMail ?? SettingsService.defaultSendMail);
  const [createProdPR, setCreateProdPR] = useState(draft?.createProdPR ?? SettingsService.defaultCreatePR);
  const [createTestPR, setCreateTestPR] = useState(draft?.createTestPR ?? SettingsService.defaultCreatePR);
  const [pushCodeProd, setPushCodeProd] = useState(draft?.pushCodeProd ?? SettingsService.defaultPushCode);
  const [pushCodeTest, setPushCodeTest] = useState(draft?.pushCodeTest ?? SettingsService.defaultPushCode);

  const [selectedModules, setSelectedModules] = useState(
    new Set(draft?.selectedModules ?? UAT_MODULES.map(m => m.id))
  );

  const [features, setFeatures] = useState(
    draft?.features?.length > 0
      ? draft.features
      : [{ name: '', desc: '' }]
  );

  const [extraRecipients, setExtraRecipients] = useState(draft?.extraRecipients ?? []);
  const [recipientInput, setRecipientInput] = useState('');
  const [showDefaultRecipients, setShowDefaultRecipients] = useState(false);

  const [includePlan, setIncludePlan] = useState(draft?.includePlan ?? false);
  const [planVersion, setPlanVersion] = useState(draft?.planVersion ?? '');
  const [planDate, setPlanDate] = useState((draft?.planDate ?? '').replace(' ', 'T'));
  const [planTimezone, setPlanTimezone] = useState(draft?.planTimezone ?? '');
  const [prereqInput, setPrereqInput] = useState('');
  const [prerequisites, setPrerequisites] = useState(draft?.prerequisites ?? []);
  const [rollbackInput, setRollbackInput] = useState('');
  const [rollbackSteps, setRollbackSteps] = useState(draft?.rollbackSteps ?? []);

  const [templateName, setTemplateName] = useState('');
  const [templateNames, setTemplateNames] = useState(SettingsService.templateNames);
  const [overwriteTarget, setOverwriteTarget] = useState(null);

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [resultMsg, setResultMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const allSelected = selectedModules.size === UAT_MODULES.length;

  const toggleModule = (id) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  };

  const validFeatures = features.filter(f => f.name.trim());
  const selectedMods = UAT_MODULES.filter(m => selectedModules.has(m.id));

  const getReleasePlan = () => {
    if (!includePlan || !planVersion.trim() || !planDate.trim()) return null;
    return {
      version: planVersion.trim(),
      plannedDateTime: planDate.trim(),
      timezone: planTimezone.trim() || null,
      prerequisites: prerequisites.length ? [...prerequisites] : null,
      rollbackPlan: rollbackSteps.length ? [...rollbackSteps] : null,
    };
  };

  const saveFormState = () => {
    SettingsService.saveUatDraft({
      sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest,
      features, extraRecipients, includePlan,
      planVersion, planDate, planTimezone, prerequisites, rollbackSteps,
      selectedModules: [...selectedModules],
    });
  };

  const handleTrigger = async () => {
    if (validFeatures.length === 0) { setStatus('error'); setResultMsg('Add at least one feature with a name.'); return; }
    if (!SettingsService.baseUrl) { setStatus('error'); setResultMsg('Azure Function URL not set. Go to Settings first.'); return; }
    if (!pushCodeProd && createProdPR) { setStatus('error'); setResultMsg('Without pushing code to prod branches, PRs cannot be created.'); return; }
    if (!pushCodeTest && createTestPR) { setStatus('error'); setResultMsg('Without pushing code to test branches, PRs cannot be created.'); return; }
    setConfirmOpen(true);
  };

  const doTrigger = async () => {
    setStatus('loading');
    const result = await ApiService.triggerUATApproval({
      features: validFeatures.map(f => ({ name: f.name, description: f.desc })),
      sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest,
      additionalRecipients: extraRecipients,
      releasePlan: getReleasePlan(),
      selectedModules: [...selectedModules],
    });

    setStatus(result.status);
    setResultMsg(result.status === 'success'
      ? `✓ UAT approval triggered on ${selectedMods.length} app(s) with ${validFeatures.length} feature(s). ${sendMail ? 'Mail dispatched.' : 'No mail.'} ${pushCodeProd ? 'Prod code pushed.' : ''} ${pushCodeTest ? 'Test code pushed.' : ''} ${createProdPR ? 'Prod PR created.' : ''} ${createTestPR ? 'Test PR created.' : ''}`
      : `Error ${result.httpStatus ?? ''}: ${result.message ?? 'Unknown error'}`
    );
    saveFormState();
  };

  const resetForm = () => {
    setFeatures([{ name: '', desc: '' }]);
    setExtraRecipients([]);
    setPrerequisites([]);
    setRollbackSteps([]);
    setPlanVersion(''); setPlanDate(''); setPlanTimezone('');
    setIncludePlan(false);
    setStatus('idle'); setResultMsg('');
    setSelectedModules(new Set(UAT_MODULES.map(m => m.id)));
    SettingsService.clearUatDraft();
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    if (templateNames.includes(templateName.trim()) && !overwriteTarget) {
      setOverwriteTarget(templateName.trim());
      return;
    }
    SettingsService.saveTemplate(templateName.trim(), {
      sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest,
      features, extraRecipients, includePlan,
      planVersion, planDate, planTimezone, prerequisites, rollbackSteps,
      selectedModules: [...selectedModules],
    });
    setTemplateNames(SettingsService.templateNames);
    setOverwriteTarget(null);
  };

  const loadTemplate = (name) => {
    const t = SettingsService.loadTemplate(name);
    if (!t) return;
    setSendMail(t.sendMail ?? true);
    setCreateProdPR(t.createProdPR ?? true);
    setCreateTestPR(t.createTestPR ?? true);
    setPushCodeProd(t.pushCodeProd ?? true);
    setPushCodeTest(t.pushCodeTest ?? true);
    setFeatures(t.features?.length ? t.features : [{ name: '', desc: '' }]);
    setExtraRecipients(t.extraRecipients ?? []);
    setIncludePlan(t.includePlan ?? false);
    setPlanVersion(t.planVersion ?? '');
    setPlanDate((t.planDate ?? '').replace(' ', 'T'));
    setPlanTimezone(t.planTimezone ?? '');
    setPrerequisites(t.prerequisites ?? []);
    setRollbackSteps(t.rollbackSteps ?? []);
    if (t.selectedModules?.length) setSelectedModules(new Set(t.selectedModules));
    setTemplateName(t.name ?? '');
    setStatus('idle');
  };

  const deleteTemplate = (name) => {
    SettingsService.deleteTemplate(name);
    setTemplateNames(SettingsService.templateNames);
    if (templateName === name) setTemplateName('');
  };

  const addRecipient = () => {
    if (recipientInput.trim() && recipientInput.includes('@')) {
      setExtraRecipients(prev => [...prev, recipientInput.trim()]);
      setRecipientInput('');
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Page Header */}
      <div className="page-header">
        <CheckCircle size={18} color="var(--accent)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '2px' }}>
          UAT APPROVAL
        </span>
        {status === 'success' && (
          <button
            onClick={resetForm}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
              color: 'var(--accent)', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', padding: '7px 14px', borderRadius: 8,
            }}
          >
            <RefreshCw size={13} /> Reset Form
          </button>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 48px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 50ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={24} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>UAT Approval Mailer</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                GitHub staging-test → GitLab uat-test/* + release/*<br />Creates PRs and sends mail.
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Module Selector */}
        <ModuleSelector
          modules={UAT_MODULES}
          selected={selectedModules}
          onToggle={toggleModule}
          onSelectAll={() => setSelectedModules(new Set(UAT_MODULES.map(m => m.id)))}
          onSelectNone={() => setSelectedModules(new Set([UAT_MODULES[0].id]))}
          accentColor="var(--accent)"
        />

        {/* Templates */}
        <TemplateSection
          templateName={templateName}
          setTemplateName={setTemplateName}
          templateNames={templateNames}
          onSave={saveTemplate}
          onLoad={loadTemplate}
          onDelete={deleteTemplate}
        />

        {/* Action Toggles */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 100ms both' }}>
          <SectionHeader label="Actions" icon={require_icon('tune')} />
          {gap(16)}
          <ToggleRow label="Send Mail" subtitle="Dispatch UAT notification to all recipients" value={sendMail} onChange={setSendMail} icon={Mail} />
          {gap(12)}
          <ToggleRow label="Push Code to Prod" subtitle="Pushes code to prod branches in GitLab local branch" value={pushCodeProd} onChange={setPushCodeProd} icon={Upload} />
          {gap(12)}
          <ToggleRow label="Push Code to Test" subtitle="Pushes code to test branches in GitLab local branch" value={pushCodeTest} onChange={setPushCodeTest} icon={Upload} />
          {gap(12)}
          <ToggleRow label="Create Prod Pull Requests" subtitle="Open GitLab PRs for prod branches" value={createProdPR} onChange={v => { if (v) setPushCodeProd(true); setCreateProdPR(v); }} icon={GitMerge} />
          {gap(12)}
          <ToggleRow label="Create Test Pull Requests" subtitle="Open GitLab PRs for test branches" value={createTestPR} onChange={v => { if (v) setPushCodeTest(true); setCreateTestPR(v); }} icon={GitMerge} />
        </SectionCard>

        {/* Features */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 150ms both' }}>
          <SectionHeader
            label={`Features (${features.length})`}
            icon={Star}
            trailing={
              <button onClick={() => setFeatures(prev => [...prev, { name: '', desc: '' }])} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
                background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                <Plus size={14} /> ADD
              </button>
            }
          />
          {gap(16)}
          {features.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{i + 1}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Feature {i + 1}</span>
                </div>
                <StyledInput value={f.name} onChange={v => setFeatures(prev => prev.map((x, j) => j === i ? { ...x, name: v } : x))} placeholder="Feature name…" />
                {gap(6)}
                <StyledTextarea value={f.desc} onChange={v => setFeatures(prev => prev.map((x, j) => j === i ? { ...x, desc: v } : x))} placeholder="Description (optional)…" />
              </div>
              {features.length > 1 && (
                <button onClick={() => setFeatures(prev => prev.filter((_, j) => j !== i))} style={{
                  width: 36, height: 36, borderRadius: 8, marginTop: 26, cursor: 'pointer', flexShrink: 0,
                  background: 'var(--error-dim)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Minus size={16} color="var(--error)" />
                </button>
              )}
            </div>
          ))}
        </SectionCard>

        {/* Release Plan */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 170ms both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionHeader label="Release Plan" icon={Calendar} />
            <div onClick={() => setIncludePlan(v => !v)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
              background: includePlan ? 'var(--accent-dim)' : 'var(--border)',
              border: `1.5px solid ${includePlan ? 'var(--accent)' : 'var(--border)'}`,
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', position: 'absolute', top: 2, left: includePlan ? 22 : 2, transition: 'all 0.2s', background: includePlan ? 'var(--accent)' : 'var(--text-muted)' }} />
            </div>
          </div>
          {!includePlan && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Toggle on to attach a release plan to this email.</p>}
          {includePlan && (
            <>
              {gap(16)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <LabeledInput label="Version" value={planVersion} onChange={setPlanVersion} hint="e.g. v2.4.1" />
                <LabeledInput label="Timezone" value={planTimezone} onChange={setPlanTimezone} hint="e.g. GST +4" />
              </div>
              <DateTimePicker label="Planned Release Date" value={planDate} onChange={setPlanDate} />
              {gap(20)}
              <ArrayField
                label="Prerequisites" icon={require_icon('checklist')} items={prerequisites}
                onAdd={() => { if (prereqInput.trim()) { setPrerequisites(p => [...p, prereqInput.trim()]); setPrereqInput(''); } }}
                onRemove={i => setPrerequisites(p => p.filter((_, j) => j !== i))}
                hint="Add a prerequisite…" emptyText="No prerequisites added."
                inputVal={prereqInput} onInputChange={setPrereqInput}
                accentColor="var(--accent)" numbered={false}
              />
              {gap(16)}
              <ArrayField
                label="Rollback Steps" icon={RefreshCw} items={rollbackSteps}
                onAdd={() => { if (rollbackInput.trim()) { setRollbackSteps(p => [...p, rollbackInput.trim()]); setRollbackInput(''); } }}
                onRemove={i => setRollbackSteps(p => p.filter((_, j) => j !== i))}
                hint="Add a rollback step…" emptyText="No rollback steps added."
                inputVal={rollbackInput} onInputChange={setRollbackInput}
                accentColor="var(--error)" numbered
              />
            </>
          )}
        </SectionCard>

        {/* Recipients */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 200ms both' }}>
          <SectionHeader label={`Custom Recipients${extraRecipients.length ? ` (${extraRecipients.length})` : ''}`} icon={Users} />
          {gap(14)}
          <div style={{ display: 'flex', gap: 10 }}>
            <StyledInput value={recipientInput} onChange={setRecipientInput} placeholder="email@example.com" onKeyDown={e => e.key === 'Enter' && addRecipient()} style={{ flex: 1 }} />
            <button onClick={addRecipient} style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
              background: 'var(--accent-dim)', border: '1px solid rgba(245,166,35,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={20} color="var(--accent)" />
            </button>
          </div>
          {extraRecipients.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {extraRecipients.map(r => <PillTag key={r} label={r} onRemove={() => setExtraRecipients(p => p.filter(x => x !== r))} />)}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>No extra recipients. Only default list will be used.</p>
          )}
        </SectionCard>

        {/* Default Recipients (collapsible) */}
        <SectionCard style={{ animation: 'fadeInUp 0.3s ease 230ms both' }}>
          <div style={{ cursor: 'pointer' }} onClick={() => setShowDefaultRecipients(v => !v)}>
            <SectionHeader
              label={`Default Recipients (${DEFAULT_RECIPIENTS_UAT.length})`}
              icon={Users}
              trailing={showDefaultRecipients ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
            />
          </div>
          {showDefaultRecipients ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {DEFAULT_RECIPIENTS_UAT.map(r => <PillTag key={r} label={r} color="var(--text-secondary)" />)}
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {DEFAULT_RECIPIENTS_UAT.slice(0, 3).join(', ')}…
            </p>
          )}
        </SectionCard>

        {gap(8)}

        {status !== 'idle' && status !== 'loading' && (
          <ResultBanner isSuccess={status === 'success'} message={resultMsg} />
        )}

        {gap(8)}

        <ActionButton
          label="TRIGGER UAT APPROVAL"
          onClick={status === 'loading' ? null : handleTrigger}
          isLoading={status === 'loading'}
          icon={Rocket}
        />

        {status === 'success' && (
          <>
            {gap(12)}
            <ActionButton label="RESET FORM" onClick={resetForm} icon={RefreshCw} color="var(--surface-elevated)" />
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      <TriggerConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doTrigger}
        selectedMods={selectedMods}
        features={validFeatures}
        sendMail={sendMail}
        pushCodeProd={pushCodeProd}
        pushCodeTest={pushCodeTest}
        createProdPR={createProdPR}
        createTestPR={createTestPR}
        extraRecipients={extraRecipients}
        releasePlan={getReleasePlan()}
      />

      <ConfirmDialog
        open={!!overwriteTarget}
        onClose={() => setOverwriteTarget(null)}
        title={`Overwrite "${overwriteTarget}"?`}
        message="A template with this name already exists. Replace it?"
        onConfirm={() => {
          SettingsService.saveTemplate(overwriteTarget, {
            sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest,
            features, extraRecipients, includePlan,
            planVersion, planDate, planTimezone, prerequisites, rollbackSteps,
            selectedModules: [...selectedModules],
          });
          setTemplateNames(SettingsService.templateNames);
          setOverwriteTarget(null);
        }}
        confirmLabel="Replace"
        confirmColor="var(--accent)"
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModuleSelector({ modules, selected, onToggle, onSelectAll, onSelectNone, accentColor }) {
  const allSelected = selected.size === modules.length;
  return (
    <SectionCard style={{ animation: 'fadeInUp 0.3s ease 65ms both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
          App Modules ({selected.size}/{modules.length} selected)
        </span>
        <button
          onClick={allSelected ? onSelectNone : onSelectAll}
          style={{
            padding: '5px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
            background: allSelected ? 'var(--accent-dim)' : 'var(--surface)',
            border: `1px solid ${allSelected ? 'rgba(245,166,35,0.5)' : 'var(--border)'}`,
            color: allSelected ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {allSelected ? 'DESELECT ALL' : 'SELECT ALL'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modules.map(m => (
          <ModuleCard
            key={m.id}
            module={m}
            selected={selected.has(m.id)}
            onToggle={() => onToggle(m.id)}
            accentColor={m.isBackend ? 'var(--warning)' : accentColor}
            extraInfo={
              <>
                <TinyBadge label={m.gitlabTestBranch} color="var(--text-muted)" />
                <ArrowRight size={9} color="var(--text-muted)" />
                <TinyBadge label={m.pushBranchTest} color={selected.has(m.id) ? accentColor : 'var(--text-muted)'} />
              </>
            }
          />
        ))}
      </div>
      {selected.size < modules.length && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 8,
          background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.25)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <Info size={13} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>
            Only {selected.size} selected app(s) will be targeted. Unselected apps will be skipped.
          </span>
        </div>
      )}
    </SectionCard>
  );
}

function TemplateSection({ templateName, setTemplateName, templateNames, onSave, onLoad, onDelete }) {
  return (
    <SectionCard style={{ animation: 'fadeInUp 0.3s ease 80ms both' }}>
      <SectionHeader label="Templates" icon={Bookmark} />
      <div style={{ height: 14 }} />
      <div style={{ display: 'flex', gap: 10 }}>
        <StyledInput value={templateName} onChange={setTemplateName} placeholder="Template name (e.g. v2.4.1)" onKeyDown={e => e.key === 'Enter' && onSave()} style={{ flex: 1 }} />
        <button onClick={onSave} style={{
          height: 44, padding: '0 14px', borderRadius: 10, cursor: 'pointer', flexShrink: 0,
          background: 'var(--accent-dim)', border: '1px solid rgba(245,166,35,0.5)',
          display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 700,
        }}>
          <BookmarkPlus size={16} /> SAVE
        </button>
      </div>
      {templateNames.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>No saved templates yet.</p>
      ) : (
        <div style={{ marginTop: 14, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {templateNames.map((name, i) => {
            const isActive = templateName === name;
            return (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                borderBottom: i < templateNames.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <Bookmark size={14} color={isActive ? 'var(--accent)' : 'var(--text-muted)'} />
                <span style={{ flex: 1, fontSize: 13, color: isActive ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isActive ? 700 : 400 }}>{name}</span>
                <button onClick={() => onLoad(name)} style={{
                  padding: '5px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none',
                }}>LOAD</button>
                <button onClick={() => onDelete(name)} style={{
                  width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
                  background: 'var(--error-dim)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={14} color="var(--error)" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ── DateTimePicker ────────────────────────────────────────────────────────────
const DatePickerInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    style={{
      width: '100%', height: 46, borderRadius: 12, boxSizing: 'border-box',
      background: 'var(--surface)', border: '1.5px solid var(--border)',
      color: value ? 'var(--text-primary)' : 'var(--text-muted)',
      fontSize: 13, padding: '0 14px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', cursor: 'pointer',
    }}
  >
    <span>{value || placeholder}</span>
    <Calendar size={15} color="var(--text-muted)" />
  </div>
));

function DateTimePicker({ label, value, onChange }) {
  const dateVal = value ? new Date(value) : null;
  const handleChange = (date) => {
    if (!date) { onChange(''); return; }
    const pad = n => String(n).padStart(2, '0');
    onChange(`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`);
  };
  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      <div style={{ width: '100%' }}>
        <DatePicker
          selected={dateVal}
          onChange={handleChange}
          showTimeSelect
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat="dd/MM/yyyy HH:mm"
          placeholderText="Select date & time…"
          customInput={<DatePickerInput />}
          popperPlacement="bottom-start"
          popperProps={{ strategy: 'fixed' }}
          wrapperClassName="datepicker-full-width"
        />
      </div>
      <style>{`.datepicker-full-width { width: 100% !important; display: block !important; }`}</style>
    </div>
  );
}

function LabeledInput({ label, value, onChange, hint, type = 'text' }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 }}>{label}</div>
      <StyledInput value={value} onChange={onChange} placeholder={hint} type={type} />
    </div>
  );
}

function TriggerConfirmDialog({ open, onClose, onConfirm, selectedMods, features, sendMail, pushCodeProd, pushCodeTest, createProdPR, createTestPR, extraRecipients, releasePlan }) {
  if (!open) return null;

  const confirmRow = (active, text) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <GitMerge size={14} color={active ? 'var(--success)' : 'var(--text-muted)'} />
      <span style={{ fontSize: 12, color: active ? 'var(--text-primary)' : 'var(--text-muted)', textDecoration: active ? 'none' : 'line-through' }}>{text}</span>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 20, animation: 'fadeIn 0.15s',
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface-elevated)', borderRadius: 18, border: '1px solid var(--border)',
        padding: 24, maxWidth: 460, width: '100%', maxHeight: '80vh', overflow: 'auto',
        animation: 'fadeInUp 0.2s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Rocket size={20} color="var(--accent)" />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Confirm Trigger</span>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Targeting {selectedMods.length} of {UAT_MODULES.length} apps:
        </p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
          {selectedMods.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.isBackend ? 'var(--warning)' : 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-primary)' }}>{m.appName}</span>
            </div>
          ))}
        </div>

        {confirmRow(pushCodeProd, 'Push code to prod')}
        {confirmRow(pushCodeTest, 'Push code to test')}
        {confirmRow(createProdPR, 'PRs to prod branches')}
        {confirmRow(createTestPR, 'PRs to test branches')}
        {confirmRow(sendMail, `Email to ${extraRecipients.length > 0 ? extraRecipients.length : DEFAULT_RECIPIENTS_UAT.length} recipient(s)`)}

        <div style={{ background: 'var(--surface)', borderRadius: 8, padding: 10, marginTop: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Features ({features.length}):</p>
          {features.map(f => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Star size={10} color="var(--accent)" />
              <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{f.name}</span>
            </div>
          ))}
        </div>

        {releasePlan && (
          <div style={{
            background: 'var(--surface)', borderRadius: 8, padding: 10, marginTop: 12,
            border: '1px solid rgba(245,166,35,0.3)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <Calendar size={11} color="var(--accent)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>Release Plan: {releasePlan.version}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{releasePlan.plannedDateTime?.replace('T', ' ')}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', border: '1px solid var(--border)' }}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={{ padding: '8px 20px', borderRadius: 8, background: 'var(--accent)', color: 'var(--bg)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rocket size={15} /> Trigger
          </button>
        </div>
      </div>
    </div>
  );
}


// Fallback for icon usage (some icons not in lucide names used in code)
function require_icon(name) {
  const map = { tune: () => <span style={{ fontSize: 14 }}>⚙</span>, checklist: CheckCircle };
  return map[name] || Info;
}
