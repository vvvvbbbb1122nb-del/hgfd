// ====================================
// SISTEMA DE ARMAZENAMENTO - localStorage
// ====================================

const Storage = {
    // Chaves de armazenamento
    CANDIDATES_KEY: 'ipial_candidates',
    LOGS_KEY: 'ipial_logs',
    CONFIG_KEY: 'ipial_config',
    AUTH_KEY: 'ipial_auth',
    SESSION_KEY: 'ipial_session',

    // Inicializar armazenamento
    async init() {
        // Criar estrutura padrão se não existir
        if (!localStorage.getItem(this.CANDIDATES_KEY)) {
            localStorage.setItem(this.CANDIDATES_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.LOGS_KEY)) {
            localStorage.setItem(this.LOGS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.CONFIG_KEY)) {
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify({ isPublished: false }));
        }
        console.log('✓ Armazenamento inicializado');
    },

    // Guardar autenticação (sessão)
    async saveAuth(user) {
        try {
            const auth = {
                user: user,
                loginTime: new Date().getTime(),
                lastActivityTime: new Date().getTime()
            };
            localStorage.setItem(this.AUTH_KEY, JSON.stringify(auth));
            return true;
        } catch (error) {
            console.error('Erro ao guardar autenticação:', error);
            return false;
        }
    },

    // Carregar autenticação (sessão)
    async loadAuth() {
        try {
            const stored = localStorage.getItem(this.AUTH_KEY);
            if (!stored) return null;
            
            const auth = JSON.parse(stored);
            // Verificar se sessão expirou (10 minutos = 600000ms)
            const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos
            const now = new Date().getTime();
            
            if (now - auth.lastActivityTime > SESSION_TIMEOUT) {
                // Sessão expirada
                localStorage.removeItem(this.AUTH_KEY);
                return null;
            }
            
            return auth;
        } catch (error) {
            console.error('Erro ao carregar autenticação:', error);
            return null;
        }
    },

    // Atualizar tempo da última atividade
    async updateLastActivity() {
        try {
            const stored = localStorage.getItem(this.AUTH_KEY);
            if (stored) {
                const auth = JSON.parse(stored);
                auth.lastActivityTime = new Date().getTime();
                localStorage.setItem(this.AUTH_KEY, JSON.stringify(auth));
            }
        } catch (error) {
            console.error('Erro ao atualizar atividade:', error);
        }
    },

    // Limpar autenticação (logout)
    async clearAuth() {
        try {
            localStorage.removeItem(this.AUTH_KEY);
            return true;
        } catch (error) {
            console.error('Erro ao limpar autenticação:', error);
            return false;
        }
    },

    // Carregar dados de candidatos
    async loadCandidates() {
        try {
            const stored = localStorage.getItem(this.CANDIDATES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar candidatos:', error);
            return [];
        }
    },

    // Salvar candidatos
    async saveCandidates(candidates) {
        try {
            localStorage.setItem(this.CANDIDATES_KEY, JSON.stringify(candidates));
            console.log('✓ Candidatos salvos com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao salvar candidatos:', error);
            return false;
        }
    },

    // Carregar logs
    async loadLogs() {
        try {
            const stored = localStorage.getItem(this.LOGS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            return [];
        }
    },

    // Salvar logs
    async saveLogs(logs) {
        try {
            localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs));
            return true;
        } catch (error) {
            console.error('Erro ao salvar logs:', error);
            return false;
        }
    },

    // Carregar configuração
    async loadConfig() {
        try {
            const stored = localStorage.getItem(this.CONFIG_KEY);
            return stored ? JSON.parse(stored) : { isPublished: false };
        } catch (error) {
            console.error('Erro ao carregar config:', error);
            return { isPublished: false };
        }
    },

    // Salvar configuração
    async saveConfig(config) {
        try {
            localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
            return true;
        } catch (error) {
            console.error('Erro ao salvar config:', error);
            return false;
        }
    },

    // Carregar todos os dados (para export)
    async loadAll() {
        try {
            return {
                candidates: await this.loadCandidates(),
                logs: await this.loadLogs(),
                config: await this.loadConfig()
            };
        } catch (error) {
            console.error('Erro ao carregar todos os dados:', error);
            return { candidates: [], logs: [], config: {} };
        }
    },

    // Salvar todos os dados (para import)
    async saveAll(data) {
        try {
            if (data.candidates) await this.saveCandidates(data.candidates);
            if (data.logs) await this.saveLogs(data.logs);
            if (data.config) await this.saveConfig(data.config);
            return true;
        } catch (error) {
            console.error('Erro ao salvar todos os dados:', error);
            return false;
        }
    }
};

