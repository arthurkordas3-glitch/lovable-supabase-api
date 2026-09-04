const API_BASE = import.meta.env.VITE_ALCHARMY_API_URL || '';

export const alcharmyApi = {
  health: () => fetch(`${API_BASE}/health`).then(r => r.json()),
  config: () => fetch(`${API_BASE}/config/status`).then(r => r.json()),
  proCheckout: () => { window.location.href = `${API_BASE}/checkout/pro`; },
  ultimateCheckout: () => { window.location.href = `${API_BASE}/checkout/ultimate`; }
};
