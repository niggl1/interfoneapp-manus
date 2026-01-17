/**
 * Utilitários para exportação de dados em PDF e Excel
 */

/**
 * Exportar dados para CSV (Excel compatível)
 * @param {Array} data - Array de objetos com os dados
 * @param {Array} columns - Array de {key, label} definindo as colunas
 * @param {string} filename - Nome do arquivo sem extensão
 */
export const exportToCSV = (data, columns, filename) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Cabeçalhos
  const headers = columns.map(col => col.label).join(';');
  
  // Linhas de dados
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key];
      
      // Formatar valores especiais
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (typeof value === 'string' && value.includes(';')) {
        value = `"${value}"`;
      }
      
      return value;
    }).join(';');
  }).join('\n');

  // Criar conteúdo CSV com BOM para UTF-8
  const BOM = '\uFEFF';
  const csvContent = BOM + headers + '\n' + rows;
  
  // Criar blob e download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exportar dados para PDF
 * @param {Array} data - Array de objetos com os dados
 * @param {Array} columns - Array de {key, label} definindo as colunas
 * @param {string} title - Título do relatório
 * @param {string} filename - Nome do arquivo sem extensão
 */
export const exportToPDF = (data, columns, title, filename) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Criar conteúdo HTML para impressão
  const tableHeaders = columns.map(col => `<th style="border: 1px solid #ddd; padding: 8px; background-color: #3B5BDB; color: white;">${col.label}</th>`).join('');
  
  const tableRows = data.map(item => {
    const cells = columns.map(col => {
      let value = item[col.key];
      if (value === null || value === undefined) value = '-';
      if (typeof value === 'object') value = JSON.stringify(value);
      return `<td style="border: 1px solid #ddd; padding: 8px;">${value}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #3B5BDB; margin-bottom: 20px; }
        .info { color: #666; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="info">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      <p class="info">Total de registros: ${data.length}</p>
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p class="footer">App Interfone - Sistema de Gestão de Condomínios</p>
    </body>
    </html>
  `;

  // Abrir nova janela para impressão/PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Aguardar carregamento e imprimir
  printWindow.onload = () => {
    printWindow.print();
  };
};

/**
 * Formatar data para exibição
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('pt-BR');
};

/**
 * Formatar status de chamada
 */
export const formatCallStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pendente',
    'ANSWERED': 'Atendida',
    'MISSED': 'Perdida',
    'REJECTED': 'Rejeitada',
    'ENDED': 'Finalizada'
  };
  return statusMap[status] || status;
};

/**
 * Formatar status de convite
 */
export const formatInvitationStatus = (status) => {
  const statusMap = {
    'ACTIVE': 'Ativo',
    'USED': 'Utilizado',
    'EXPIRED': 'Expirado',
    'CANCELLED': 'Cancelado'
  };
  return statusMap[status] || status;
};
