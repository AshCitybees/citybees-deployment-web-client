import { SettingsService } from './settingsService.js';

const getBase = () => {
  const b = SettingsService.baseUrl || 'http://localhost:3000';
  return b.endsWith('/') ? b.slice(0, -1) : b;
};

const recordHistory = (type, status, message, features = []) => {
  SettingsService.addRunEntry({ type, status, message, features, timestamp: new Date().toISOString() });
};

// Fire a long-running backup job. We keep the request open with a long timeout
// (it helps keep the Function instance warm), but the UI does NOT depend on this
// response — progress and the final result are read via the status endpoint, so
// closing or refreshing the tab never loses the run.
const startJob = async (url, label) => {
  try {
    const res = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(7200000) });
    let payload = {};
    try { payload = await res.json(); } catch {}
    if (res.status === 409) return { status: 'running', message: payload.error || 'Already running.' };
    const ok = res.status === 200 && payload.ok !== false;
    recordHistory(label, ok ? 'success' : 'error', ok ? 'Completed' : (payload.error || `HTTP ${res.status}`));
    return { status: ok ? 'success' : 'error', httpStatus: res.status, ...payload };
  } catch (e) {
    // AbortError/timeout/refresh: the server keeps running; polling resolves it.
    return { status: 'detached', message: e.message };
  }
};

const fetchStatus = async (url) => {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.status !== 200) return { state: 'error', message: `HTTP ${res.status}` };
    return await res.json();
  } catch (e) {
    return { state: 'unreachable', message: e.message };
  }
};

const crudRequest = async (url, method, body) => {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    let payload = {};
    try { payload = await res.json(); } catch {}
    if (res.status >= 200 && res.status < 300) {
      return { status: 'success', data: payload.data };
    }
    return { status: 'error', message: payload.error || `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
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

  async getDeploymentStats({ days = 30, includeAzure = true } = {}) {
    try {
      const res = await fetch(`${getBase()}/api/get_deployment_stats?days=${days}&includeAzure=${includeAzure}`, {
        signal: AbortSignal.timeout(60000),
      });
      if (res.status !== 200) {
        return { status: 'error', message: `HTTP ${res.status}` };
      }
      return { status: 'success', data: await res.json() };
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  // target: 'blue' | 'green' | 'reject'. Deploys run 10-15 min, so the
  // request waits up to 30 min; the screen also polls stats meanwhile.
  async triggerVmssDeploy({ deploymentId, target }) {
    try {
      const res = await fetch(`${getBase()}/api/deploy_to_vmss_function/${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentId }),
        signal: AbortSignal.timeout(1800000),
      });
      const ok = res.status === 200;
      let message = '';
      try { message = (await res.json()).message; } catch { message = `HTTP ${res.status}`; }
      recordHistory(
        target === 'reject' ? 'Deployment Reject' : `VMSS Deploy (${target})`,
        ok ? 'success' : 'error',
        `${message} — deployment ${deploymentId.slice(0, 8)}`
      );
      return { status: ok ? 'success' : 'error', httpStatus: res.status, message };
    } catch (e) {
      recordHistory(target === 'reject' ? 'Deployment Reject' : `VMSS Deploy (${target})`, 'error', e.message);
      return { status: 'error', message: e.message };
    }
  },

  // entity: 'users' | 'applications'
  async listRecords(entity) {
    return crudRequest(`${getBase()}/api/manage_records/${entity}`, 'GET');
  },
  async createRecord(entity, values) {
    return crudRequest(`${getBase()}/api/manage_records/${entity}`, 'POST', values);
  },
  async updateRecord(entity, id, values) {
    return crudRequest(`${getBase()}/api/manage_records/${entity}/${id}`, 'PUT', values);
  },
  async deleteRecord(entity, id) {
    return crudRequest(`${getBase()}/api/manage_records/${entity}/${id}`, 'DELETE');
  },

  // Kick off a manual production DB backup. The job runs server-side and
  // publishes progress to a status blob, so the UI tracks it by polling
  // getDbBackupStatus() rather than waiting on this response — which means it
  // survives a page refresh. Returns quickly on 409 if one is already running.
  async startDbBackup() {
    return startJob(`${getBase()}/api/backup_db_to_sharepoint_manual`, 'DB Backup');
  },
  async getDbBackupStatus() {
    return fetchStatus(`${getBase()}/api/backup_db_to_sharepoint_status`);
  },

  // Kick off a manual blob → SharePoint sync (incremental; skips existing files).
  async startBlobSync() {
    return startJob(`${getBase()}/api/sync_blobs_to_sharepoint_manual`, 'Blob Sync');
  },
  async getBlobSyncStatus() {
    return fetchStatus(`${getBase()}/api/sync_blobs_to_sharepoint_status`);
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
