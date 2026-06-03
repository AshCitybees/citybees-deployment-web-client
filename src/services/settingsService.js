const KEYS = {
  BASE_URL: 'base_url',
  DEFAULT_SEND_MAIL: 'default_send_mail',
  DEFAULT_CREATE_PR: 'default_create_pr',
  DEFAULT_PUSH_CODE: 'default_create_push_code',
  RUN_HISTORY: 'run_history',
  UAT_DRAFT: 'uat_draft',
  UAT_TEMPLATE_INDEX: 'uat_template_index',
  TEMPLATE_PREFIX: 'uat_template:',
};

const get = (key, fallback = null) => {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const set = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const remove = (key) => localStorage.removeItem(key);

export const SettingsService = {
  get baseUrl() { return get(KEYS.BASE_URL, ''); },
  setBaseUrl(url) { set(KEYS.BASE_URL, url.trim()); },

  get defaultSendMail() { return get(KEYS.DEFAULT_SEND_MAIL, true); },
  setDefaultSendMail(v) { set(KEYS.DEFAULT_SEND_MAIL, v); },

  get defaultCreatePR() { return get(KEYS.DEFAULT_CREATE_PR, true); },
  setDefaultCreatePR(v) { set(KEYS.DEFAULT_CREATE_PR, v); },

  get defaultPushCode() { return get(KEYS.DEFAULT_PUSH_CODE, true); },
  setDefaultPushCode(v) { set(KEYS.DEFAULT_PUSH_CODE, v); },

  get runHistory() { return get(KEYS.RUN_HISTORY, []); },
  addRunEntry(entry) {
    const history = this.runHistory;
    history.unshift(entry);
    if (history.length > 50) history.splice(50);
    set(KEYS.RUN_HISTORY, history);
  },
  clearHistory() { remove(KEYS.RUN_HISTORY); },

  // UAT Draft
  saveUatDraft(data) { set(KEYS.UAT_DRAFT, data); },
  get uatDraft() { return get(KEYS.UAT_DRAFT, null); },
  clearUatDraft() { remove(KEYS.UAT_DRAFT); },

  // Templates
  get templateNames() { return get(KEYS.UAT_TEMPLATE_INDEX, []); },
  saveTemplate(name, data) {
    set(KEYS.TEMPLATE_PREFIX + name, { ...data, name, savedAt: new Date().toISOString() });
    const index = this.templateNames.filter(n => n !== name);
    index.unshift(name);
    set(KEYS.UAT_TEMPLATE_INDEX, index);
  },
  loadTemplate(name) { return get(KEYS.TEMPLATE_PREFIX + name, null); },
  deleteTemplate(name) {
    remove(KEYS.TEMPLATE_PREFIX + name);
    const index = this.templateNames.filter(n => n !== name);
    set(KEYS.UAT_TEMPLATE_INDEX, index);
  },
};
