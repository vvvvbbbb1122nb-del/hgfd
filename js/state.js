// ====================================
// GERENCIAMENTO DE ESTADO
// ====================================

const appState = {
    isAuthenticated: false,
    user: null,
    viewMode: 'admin',
    activeTab: 'dashboard',
    candidates: [],
    logs: [],
    isPublished: false,
    showAddForm: false,
    editingCandidate: null,

    // Inicializar estado
    async init() {
        await this.loadFromStorage();
        // Carregar autenticação guardada (se existir e não expirou)
        const auth = await Storage.loadAuth();
        if (auth) {
            this.isAuthenticated = true;
            this.user = auth.user;
            console.log('✓ Sessão restaurada:', auth.user);
            // Sincronizar com servidor imediatamente após login
            if (typeof dataSync !== 'undefined') {
                await dataSync.syncFromServer();
            }
        }
    },

    // Carregar dados do armazenamento
    async loadFromStorage() {
        this.candidates = await Storage.loadCandidates();
        this.logs = await Storage.loadLogs();
        const config = await Storage.loadConfig();
        this.isPublished = config.isPublished || false;
    },

    // Salvar dados no armazenamento E servidor (servidor é fonte única de verdade)
    async save() {
        // 1. Salvar no localStorage primeiro para resposta rápida
        await Storage.saveCandidates(this.candidates);
        await Storage.saveLogs(this.logs);
        await Storage.saveConfig({ isPublished: this.isPublished });
        
        // 2. Sincronizar com servidor imediatamente após salvar
        if (typeof dataSync !== 'undefined') {
            await dataSync.syncToServer();
            // 3. Recarregar dados do servidor (servidor é autoridade final)
            await dataSync.syncFromServer();
        }
    },

    // Fazer login e guardar sessão
    async login(user) {
        this.isAuthenticated = true;
        this.user = user;
        await Storage.saveAuth(user);
        this.addLog(`Login efetuado no sistema`);
    },

    // Fazer logout e limpar sessão
    async logout() {
        this.isAuthenticated = false;
        this.user = null;
        await Storage.clearAuth();
        this.addLog(`Logout efetuado`);
    },

    // Atualizar tempo de inatividade
    async updateActivity() {
        if (this.isAuthenticated) {
            await Storage.updateLastActivity();
        }
    },

    // Adicionar log de atividade
    addLog(action) {
        this.logs.push({
            action,
            timestamp: new Date().toISOString(),
            user: this.user || 'Sistema'
        });
        this.save();
    },

    // Determinar status automaticamente baseado na nota
    determineStatus(score) {
        if (score >= APP_CONFIG.MIN_SCORE) {
            return STATUS.APPROVED;
        } else {
            return STATUS.REJECTED;
        }
    },

    // Adicionar candidato
    addCandidate(data) {
        if (this.candidates.some(c => c.idNumber === data.idNumber)) {
            return { success: false, error: 'BI/Passaporte já registado!' };
        }
        
        // Definir status automaticamente baseado na nota
        const status = this.determineStatus(data.score);
        
        const candidate = {
            id: 'cand_' + Date.now(),
            ...data,
            status: status,  // Sobrescrever com status automático
            createdAt: new Date().toISOString()
        };
        this.candidates.push(candidate);
        this.addLog(`Novo candidato: ${data.fullName} (${status})`);
        return { success: true, candidate };
    },

    // Atualizar candidato
    updateCandidate(id, data) {
        const index = this.candidates.findIndex(c => c.id === id);
        if (index !== -1) {
            // Definir status automaticamente baseado na nota
            const status = this.determineStatus(data.score);
            
            this.candidates[index] = {
                ...this.candidates[index],
                ...data,
                status: status,  // Sobrescrever com status automático
                updatedAt: new Date().toISOString()
            };
            this.addLog(`Atualizado: ${data.fullName} (${status})`);
            return true;
        }
        return false;
    },

    // Eliminar candidato
    deleteCandidate(id) {
        const candidate = this.candidates.find(c => c.id === id);
        this.candidates = this.candidates.filter(c => c.id !== id);
        if (candidate) {
            this.addLog(`Eliminado: ${candidate.fullName}`);
        }
        this.save();
    },

    // Obter estatísticas
    getStats() {
        const total = this.candidates.length;
        const approved = this.candidates.filter(c => c.status === STATUS.APPROVED).length;
        const rejected = this.candidates.filter(c => c.status === STATUS.REJECTED).length;
        const byCourse = {};
        COURSES.forEach(course => {
            byCourse[course] = this.candidates.filter(c => c.course === course).length;
        });
        return { total, approved, rejected, byCourse };
    },

    // Gerar relatório
    generateReport() {
        const stats = this.getStats();
        const approved = this.candidates.filter(c => c.status === STATUS.APPROVED);
        const rejected = this.candidates.filter(c => c.status === STATUS.REJECTED);
        const byCourse = {};

        COURSES.forEach(course => {
            const candidates = this.candidates.filter(c => c.course === course);
            byCourse[course] = {
                total: candidates.length,
                approved: candidates.filter(c => c.status === STATUS.APPROVED).length,
                rejected: candidates.filter(c => c.status === STATUS.REJECTED).length,
                average: candidates.length > 0 ? candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length : 0
            };
        });

        const dateStr = new Date().toLocaleDateString('pt-PT');
        const timeStr = new Date().toLocaleTimeString('pt-PT');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório Geral - IPIAL 2025</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8fafc; color: #1e293b; }
                    .container { max-width: 1000px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                    h1 { text-align: center; color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
                    h2 { color: #1e293b; margin-top: 30px; border-left: 4px solid #2563eb; padding-left: 10px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .date { color: #64748b; font-size: 12px; }
                    .stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0; }
                    .stat-box { padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: center; }
                    .stat-label { color: #64748b; font-size: 12px; }
                    .stat-number { font-size: 28px; font-weight: bold; color: #2563eb; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background-color: #2563eb; color: white; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .approved { color: #22c55e; font-weight: bold; }
                    .rejected { color: #ef4444; font-weight: bold; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📊 RELATÓRIO GERAL - IPIAL 2025</h1>
                        <p class="date">Gerado em: ${dateStr} às ${timeStr}</p>
                    </div>

                    <h2>📈 Resumo Geral</h2>
                    <div class="stats">
                        <div class="stat-box">
                            <div class="stat-label">Total de Inscritos</div>
                            <div class="stat-number">${stats.total}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Aprovados</div>
                            <div class="stat-number approved">${stats.approved}</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-label">Reprovados</div>
                            <div class="stat-number rejected">${stats.rejected}</div>
                        </div>
                    </div>

                    <h2>📊 Distribuição por Curso</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Curso</th>
                                <th style="text-align: center;">Total</th>
                                <th style="text-align: center;">Aprovados</th>
                                <th style="text-align: center;">Reprovados</th>
                                <th style="text-align: center;">Média</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${COURSES.map(course => {
                                const data = byCourse[course];
                                return `
                                    <tr>
                                        <td><strong>${course}</strong></td>
                                        <td style="text-align: center;">${data.total}</td>
                                        <td style="text-align: center;" class="approved">${data.approved}</td>
                                        <td style="text-align: center;" class="rejected">${data.rejected}</td>
                                        <td style="text-align: center;"><strong>${data.average.toFixed(2)}</strong></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>

                    <h2>👥 Lista Detalhada de Candidatos</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Nome</th>
                                <th>BI/Passaporte</th>
                                <th>Curso</th>
                                <th style="text-align: center;">Nota</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.candidates.map((c, i) => `
                                <tr>
                                    <td>${i + 1}</td>
                                    <td><strong>${c.fullName}</strong></td>
                                    <td>${c.idNumber}</td>
                                    <td>${c.course}</td>
                                    <td style="text-align: center;"><strong>${c.score.toFixed(1)}</strong></td>
                                    <td ${c.status === STATUS.APPROVED ? 'class="approved"' : c.status === STATUS.REJECTED ? 'class="rejected"' : ''}>${c.status}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>IPIAL - Instituto Politécnico Industrial "Alda Lara"</p>
                        <p>Sistema de Gestão de Exames de Acesso 2025</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Relatorio_Geral_IPIAL_' + new Date().toISOString().split('T')[0] + '.html';
        link.click();
        this.addLog('Relatório geral gerado');
    }
};
