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

const splitReference = (reference, createdAt) => {
  const raw = String(reference || '').trim();
  const [numberPart = '', yearPart = ''] = raw.split('/').map((part) => part.trim());
  const fallbackYear = (() => {
    const date = createdAt ? new Date(createdAt) : new Date();
    return Number.isNaN(date.getTime()) ? String(new Date().getFullYear()) : String(date.getFullYear());
  })();

  return {
    number: numberPart || raw || '',
    year: yearPart || fallbackYear,
  };
};

const buildPrintableHtml = (decharge = {}) => {
  const maintenanceType = String(decharge.maintenanceType || '').toUpperCase();
  const isHard = maintenanceType === 'HARD';
  const isSoft = maintenanceType === 'SOFT';
  const { number: refNumber, year: refYear } = splitReference(decharge.reference, decharge.createdAt);
  const logoUrl = `${window.location.origin}/naftal-logo.png`;
  const createdDate = toFrDate(decharge.createdAt);

  const rows = (decharge.items || [])
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.designation)}</td>
        <td style="text-align:center;">${String(Number(item.quantity) || '').padStart(2, '0')}</td>
        <td>${escapeHtml(item.marque)}</td>
        <td>${escapeHtml(item.numeroSerie)}</td>
        <td>${escapeHtml(item.numeroInventaire)}</td>
      </tr>
    `)
    .join('');

  const minRows = Math.max(0, 4 - (decharge.items || []).length);
  const emptyRows = Array.from({ length: minRows })
    .map(() => '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>')
    .join('');

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Décharge ${escapeHtml(decharge.reference || '')}</title>
        <style>
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .sheet {
            width: 100%;
            min-height: 100%;
            padding: 5mm 4mm 4mm;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8mm;
          }

          .left-header {
            display: flex;
            flex-direction: column;
            gap: 1px;
            min-width: 52%;
          }

          .logo {
            width: 37mm;
            height: auto;
            object-fit: contain;
            margin-bottom: 2px;
          }

          .org-line {
            font-size: 11pt;
            line-height: 1.2;
            letter-spacing: 0;
          }

          .org-line.strong {
            font-weight: 700;
          }

          .right-header {
            margin-top: 7mm;
            font-size: 11pt;
            font-weight: 700;
            text-align: right;
          }

          .title {
            text-align: center;
            font-size: 34pt;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.4px;
            font-style: italic;
            text-decoration: underline;
            margin: 0;
            margin-top: 1mm;
          }

          .reference {
            text-align: center;
            margin: 3mm 0 5mm;
            font-size: 13pt;
            letter-spacing: 0;
          }

          .reference .n {
            margin-right: 6mm;
          }

          .reference .num {
            min-width: 10mm;
            display: inline-block;
            text-align: center;
          }

          .paragraph {
            margin: 0;
            font-size: 12pt;
            line-height: 1.35;
            font-weight: 600;
          }

          .type-check {
            float: right;
            display: inline-flex;
            gap: 5mm;
            align-items: center;
            font-size: 12pt;
            font-weight: 600;
          }

          .check-item {
            display: inline-flex;
            align-items: center;
            gap: 1.6mm;
          }

          .check {
            width: 3.6mm;
            height: 3.6mm;
            border: 0.3mm solid #4b4b4b;
            display: inline-block;
            position: relative;
            top: 0.3mm;
            background: #fff;
          }

          .check.checked::after {
            content: '✓';
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8pt;
            line-height: 1;
            color: #1f1f1f;
            font-weight: 700;
          }

          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2.2mm;
            border: 0.3mm solid #595959;
            table-layout: fixed;
          }

          .items-table th,
          .items-table td {
            border: 0.25mm solid #767676;
            padding: 1.5mm 2mm;
            font-size: 10.5pt;
            line-height: 1.2;
            height: 8mm;
            vertical-align: middle;
          }

          .items-table th {
            background: #f4f4f4;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0;
            white-space: nowrap;
          }

          .items-table .col-designation { width: 30%; text-align: left; }
          .items-table .col-qt { width: 11%; text-align: center; }
          .items-table .col-marque { width: 22%; text-align: left; }
          .items-table .col-serie { width: 18%; text-align: left; }
          .items-table .col-inv { width: 19%; text-align: left; }

          .meta-line {
            margin-top: 3.2mm;
            font-size: 12pt;
            line-height: 1.28;
          }

          .meta-line strong {
            font-weight: 800;
          }

          .signatures {
            margin-top: 10mm;
            display: flex;
            justify-content: space-between;
            gap: 10%;
          }

          .sign-block {
            width: 44%;
            min-height: 42mm;
          }

          .sign-title {
            font-size: 13pt;
            line-height: 1.1;
            font-weight: 900;
            text-transform: uppercase;
            text-decoration: underline;
            margin-bottom: 3.8mm;
          }

          .sign-subtitle {
            font-size: 12pt;
            font-weight: 800;
            text-transform: uppercase;
            line-height: 1.2;
          }

          .receiver-line {
            font-size: 12pt;
            margin: 2.2mm 0;
            line-height: 1.2;
            font-weight: 700;
          }

          .receiver-line span {
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <header class="header">
            <div class="left-header">
              <img class="logo" src="${escapeHtml(logoUrl)}" alt="NAFTAL" />
              <div class="org-line strong">Branche Commercialisation</div>
              <div class="org-line">District Commercialisation Alger</div>
              <div class="org-line strong">SCE S&amp;R&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DPT INFORMATIQUE</div>
            </div>
            <div class="right-header">El Mohammadia le : ${escapeHtml(createdDate)}</div>
          </header>

          <h1 class="title">DECHARGE</h1>
          <div class="reference">
            <span class="n">N</span>
            <span class="num">${escapeHtml(refNumber)}</span>
            <span>/${escapeHtml(refYear)}</span>
          </div>

          <p class="paragraph">
            Je soussigné: Reconnais avoir reçu à ce jour du DPT Informatique
            <span class="type-check">
              <span class="check-item"><span class="check ${isHard ? 'checked' : ''}"></span>HARD</span>
              <span class="check-item"><span class="check ${isSoft ? 'checked' : ''}"></span>SOFT</span>
            </span>
            <br />
            Alger le matériel ci-dessous:
          </p>

          <table class="items-table">
            <thead>
              <tr>
                <th class="col-designation">Désignation</th>
                <th class="col-qt">QT</th>
                <th class="col-marque">Marque/Type</th>
                <th class="col-serie">N° Serie</th>
                <th class="col-inv">N° INV</th>
              </tr>
            </thead>
            <tbody>
              ${rows}${emptyRows}
            </tbody>
          </table>

          <div class="meta-line"><strong>Observation:</strong> ${escapeHtml(decharge.observation)}</div>
          <div class="meta-line"><strong>Destinataire:</strong> ${escapeHtml(decharge.destinataire)}</div>

          <section class="signatures">
            <div class="sign-block">
              <div class="sign-title">Le Responsable</div>
              <div class="sign-subtitle">Le Chef de Service S&amp;R</div>
            </div>
            <div class="sign-block">
              <div class="sign-title">Le Receptionnaire</div>
              <div class="receiver-line">NOM: <span>${escapeHtml(decharge.receptionnaireNom)}</span></div>
              <div class="receiver-line">PRENOM: <span>${escapeHtml(decharge.receptionnairePrenom)}</span></div>
              <div class="receiver-line">FONCTION: <span>${escapeHtml(decharge.receptionnaireFonction)}</span></div>
            </div>
          </section>
        </div>
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

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1500);
  };

  const startPrint = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    cleanup();
  };

  const waitForAssets = () => {
    const images = Array.from(doc.images || []);
    Promise.all(
      images.map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      }),
    ).then(() => {
      setTimeout(startPrint, 120);
    });
  };

  setTimeout(waitForAssets, 30);
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
