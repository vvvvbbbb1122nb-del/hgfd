// ====================================
// EXPORTAÇÃO E IMPORTAÇÃO DE DADOS
// ====================================

const DataExport = {
    // Exportar para CSV
    exportToCSV(candidates = null, filename = 'IPIAL_CANDIDATOS.csv') {
        const data = candidates || appState.candidates;
        const headers = ['Nº', 'Nome', 'BI', 'Contacto', 'Idade', 'Curso', 'Nota', 'Estado'];
        const rows = data.map((c, i) => [
            i + 1,
            c.fullName,
            c.idNumber,
            c.contact,
            c.age,
            c.course,
            c.score.toFixed(1),
            c.status
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    // Exportar para PDF (versão HTML)
    exportToPDF(candidates = null, title = 'Lista de Candidatos') {
        const data = candidates || appState.candidates;
        const dateStr = new Date().toLocaleDateString('pt-PT');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #1e293b; }
                    .date { text-align: center; color: #64748b; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p class="date">Gerado em: ${dateStr}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>Nome</th>
                            <th>BI</th>
                            <th>Curso</th>
                            <th>Nota</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((c, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${c.fullName}</td>
                                <td>${c.idNumber}</td>
                                <td>${c.course}</td>
                                <td>${c.score.toFixed(1)}</td>
                                <td>${c.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = title.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.html';
        link.click();
    },

    // Exportar como JSON
    exportAsJSON() {
        Storage.exportAsJSON(appState.candidates, `IPIAL_CANDIDATOS_${new Date().toISOString().split('T')[0]}.json`);
        appState.addLog('Dados exportados em JSON');
    },

    // Importar de JSON
    async importFromJSON(file) {
        try {
            const data = await Storage.importFromJSON(file);
            if (Array.isArray(data)) {
                let count = 0;
                data.forEach(item => {
                    if (!appState.candidates.some(c => c.idNumber === item.idNumber)) {
                        appState.candidates.push(item);
                        count++;
                    }
                });
                await appState.save();
                appState.addLog(`Importação: ${count} itens`);
                return { success: true, count };
            }
            return { success: false, error: 'Formato de arquivo inválido' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
