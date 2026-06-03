import { SettingsService } from './settingsService.js';

const getBase = () => {
  const b = SettingsService.baseUrl || 'http://localhost:3000';
  return b.endsWith('/') ? b.slice(0, -1) : b;
};

const recordHistory = (type, status, message, features = []) => {
  SettingsService.addRunEntry({ type, status, message, features, timestamp: new Date().toISOString() });
};

export const ApiService = {
  
  async testConnection(url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      return res.status < 500;
    } catch(error) {
      return false;
    }
  },

  async triggerUATApproval({ features, sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest, additionalRecipients = [], releasePlan, selectedModules }) {
    try {
      const body = {
        sendMail, createProdPR, createTestPR, pushCodeProd, pushCodeTest,
        extraRecipients: additionalRecipients,
        features: features.map(f => ({ name: f.name, description: f.description })),
        releasePlan: releasePlan ? {
          plannedDateTime: releasePlan.plannedDateTime,
          prerequisites: releasePlan.prerequisites,
          rollbackPlan: releasePlan.rollbackPlan,
          timezone: releasePlan.timezone,
          version: releasePlan.version,
        } : null,
        selectedModules,
      };

      const res = await fetch(`${getBase()}/api/send_UAT_approval_mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(180000),
      });

      const ok = res.status === 200;
      recordHistory('UAT Approval', ok ? 'success' : 'error',
        ok ? `Triggered with ${features.length} feature(s). Mail: ${sendMail}` : `HTTP ${res.status}`,
        features.map(f => f.name));

      return { status: ok ? 'success' : 'error', httpStatus: res.status, message: await res.text() };
    } catch (e) {
      recordHistory('UAT Approval', 'error', e.message, features.map(f => f.name));
      return { status: 'error', message: e.message };
    }
  },

  async triggerWACProdSync({ sendMail, createPR, pushCode, additionalRecipients = [], selectedModules }) {
    try {
      const res = await fetch(`${getBase()}/api/sync_WAC_prod_manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendMail, createPR, pushCode, extraRecipients: additionalRecipients, selectedModules }),
        signal: AbortSignal.timeout(180000),
      });

      const text = await res.text();
      const ok = res.status === 200;
      recordHistory('WAC Prod Sync', ok ? 'success' : 'error',
        ok ? `Mail: ${sendMail}, PushCode: ${pushCode}, PR: ${createPR}` : `HTTP ${res.status}`);

      let parsedResults = [];
      try {
        const decoded = JSON.parse(text);
        if (Array.isArray(decoded)) parsedResults = decoded;
        else if (decoded?.data && Array.isArray(decoded.data)) parsedResults = decoded.data;
      } catch {}

      return { status: ok ? 'success' : 'error', httpStatus: res.status, message: text, syncResults: parsedResults };
    } catch (e) {
      recordHistory('WAC Prod Sync', 'error', e.message);
      return { status: 'error', message: e.message, syncResults: [] };
    }
  },
};
