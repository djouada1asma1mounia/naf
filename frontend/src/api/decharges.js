import axiosInstance from './axios';

const getErrorMessage = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage[0] || fallback;
  return apiMessage || error?.message || fallback;
};

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const toFrDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR');
};

const buildPrintableHtml = (decharge = {}) => {
  const rows = (decharge.items || [])
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.designation)}</td>
        <td style="text-align:center;">${Number(item.quantity) || ''}</td>
        <td>${escapeHtml(item.marque)}</td>
        <td>${escapeHtml(item.numeroSerie)}</td>
        <td>${escapeHtml(item.numeroInventaire)}</td>
      </tr>
    `)
    .join('');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Décharge ${escapeHtml(decharge.reference)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 16px; color: #111; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          .meta { margin-bottom: 12px; font-size: 14px; }
          .row { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #444; padding: 8px; font-size: 12px; }
          th { background: #f2f2f2; text-align: left; }
          .obs { margin-top: 12px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>DECHARGE</h1>
        <div class="meta">
          <div class="row"><strong>Référence:</strong> ${escapeHtml(decharge.reference)}</div>
          <div class="row"><strong>Date:</strong> ${escapeHtml(toFrDate(decharge.createdAt))}</div>
          <div class="row"><strong>Type:</strong> ${escapeHtml(decharge.maintenanceType)}</div>
          <div class="row"><strong>Destinataire:</strong> ${escapeHtml(decharge.destinataire)}</div>
          <div class="row"><strong>Réceptionnaire:</strong> ${escapeHtml(`${decharge.receptionnaireNom || ''} ${decharge.receptionnairePrenom || ''}`.trim())}</div>
          <div class="row"><strong>Fonction:</strong> ${escapeHtml(decharge.receptionnaireFonction)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th>QT</th>
              <th>Marque/Type</th>
              <th>N SERIE</th>
              <th>N INV</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="obs"><strong>Observation:</strong> ${escapeHtml(decharge.observation)}</div>
      </body>
    </html>
  `;
};

const printHtml = (html) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) throw new Error('Impossible d’ouvrir le document à imprimer.');

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1500);
  }, 150);
};

const normalizeDecharge = (item = {}) => {
  const items = Array.isArray(item.items) ? item.items : [];
  return {
    id: item?.id,
    reference: item?.reference || '',
    maintenanceType: item?.maintenanceType || '',
    observation: item?.observation || '',
    destinataire: item?.destinataire || '',
    receptionnaireNom: item?.receptionnaireNom || '',
    receptionnairePrenom: item?.receptionnairePrenom || '',
    receptionnaireFonction: item?.receptionnaireFonction || '',
    createdAt: item?.createdAt || null,
    createdBy: item?.createdBy || null,
    items,
  };
};

const applyFilters = (decharges = [], filters = {}) => {
  let result = [...decharges];

  if (filters.maintenanceType) {
    result = result.filter((d) => d.maintenanceType === filters.maintenanceType);
  }

  if (filters.search) {
    const query = String(filters.search).trim().toLowerCase();
    result = result.filter((d) => {
      const receptionnaire = `${d.receptionnaireNom || ''} ${d.receptionnairePrenom || ''}`.trim();
      const haystack = [d.reference, d.destinataire, receptionnaire, d.receptionnaireFonction]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');
      return haystack.includes(query);
    });
  }

  return result;
};

export const dechargesAPI = {
  getAll: async (filters = {}) => {
    try {
      const response = await axiosInstance.get('/decharges');
      const data = response?.data?.data || [];
      const normalized = data.map(normalizeDecharge);
      return applyFilters(normalized, filters);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors du chargement des décharges.'));
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/decharges/${id}`);
      const data = response?.data?.data || response?.data;
      return normalizeDecharge(data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Décharge introuvable.'));
    }
  },

  create: async (payload) => {
    try {
      const response = await axiosInstance.post('/decharges', payload);
      const data = response?.data?.data || response?.data;
      return normalizeDecharge(data);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Erreur lors de la création de la décharge.'));
    }
  },

  downloadPdf: async (id, reference) => {
    try {
      const response = await axiosInstance.get(`/decharges/${id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `decharge-${String(reference || id).replace('/', '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Impossible de télécharger la décharge.'));
    }
  },

  printPdf: async (id) => {
    try {
      const decharge = await dechargesAPI.getById(id);
      const html = buildPrintableHtml(decharge);
      printHtml(html);
      return { mode: 'html' };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Impossible d\'imprimer la décharge.'));
    }
  },
};
