import { SettingsService } from './settingsService.js';

const getBase = () => {
  const b = SettingsService.baseUrl || 'http://localhost:3000';
  return b.endsWith('/') ? b.slice(0, -1) : b;
};

const recordHistory = (type, status, message, features = []) => {
  SettingsService.addRunEntry({ type, status, message, features, timestamp: new Date().toISOString() });
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

  // Manual production DB backup → SharePoint.
  // Backend dumps prod PostgreSQL on the VM and chunk-uploads to SharePoint,
  // then emails the result. Runs a few minutes; we wait up to 30.
  async triggerDbBackup() {
    try {
      const res = await fetch(`${getBase()}/api/backup_db_to_sharepoint_manual`, {
        method: 'POST',
        signal: AbortSignal.timeout(1800000),
      });
      let payload = {};
      try { payload = await res.json(); } catch {}
      const ok = res.status === 200 && payload.ok !== false;
      recordHistory('DB Backup', ok ? 'success' : 'error',
        ok ? `${payload.fileName ?? 'backup'} uploaded to SharePoint` : (payload.error || `HTTP ${res.status}`));
      return { status: ok ? 'success' : 'error', httpStatus: res.status, ...payload };
    } catch (e) {
      recordHistory('DB Backup', 'error', e.message);
      return { status: 'error', message: e.message };
    }
  },

  // Manual blob storage → SharePoint sync. Incremental (skips existing files),
  // so reruns are fast. First run can be long; we wait up to 30 min and the
  // backend resumes any partial run on the next trigger.
  async triggerBlobSync() {
    try {
      const res = await fetch(`${getBase()}/api/sync_blobs_to_sharepoint_manual`, {
        method: 'POST',
        signal: AbortSignal.timeout(1800000),
      });
      let payload = {};
      try { payload = await res.json(); } catch {}
      const ok = res.status === 200 && payload.ok !== false;
      const r = payload.result;
      recordHistory('Blob Sync', ok ? 'success' : 'error',
        r ? `${r.uploaded} uploaded, ${r.skipped} skipped${r.incomplete ? ' (partial)' : ''}` : (payload.error || `HTTP ${res.status}`));
      return { status: ok ? 'success' : 'error', httpStatus: res.status, result: r, error: payload.error };
    } catch (e) {
      recordHistory('Blob Sync', 'error', e.message);
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
