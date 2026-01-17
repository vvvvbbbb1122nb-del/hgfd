/**
 * sync.js
 * Módulo de sincronização com servidor
 * Sincroniza dados entre localStorage e servidor Node.js
 */

class DataSync {
  constructor() {
    this.SERVER_URL = 'http://localhost:3000';
    this.SYNC_INTERVAL = 15000; // 15 segundos (mais frequente para dados em tempo real)
    this.syncTimer = null;
  }

  /**
   * Inicializar sincronização automática
   */
  init() {
    console.log('[Sync] Inicializando sincronização de dados...');
    
    // Sincronizar ao carregar
    this.syncFromServer();
    
    // Sincronizar periodicamente (DOWNLOAD - receber dados de outros utilizadores)
    this.startAutoSync();
    
    // Sincronizar quando dados mudam (interceptar saves)
    this.setupListeners();
  }

  /**
   * Iniciar sincronização automática periódica (receber dados)
   */
  startAutoSync() {
    this.syncTimer = setInterval(() => {
      this.syncFromServer();
    }, this.SYNC_INTERVAL);
  }

  /**
   * Parar sincronização automática
   */
  stopAutoSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
  }

  /**
   * Carregar dados do servidor (DOWNLOAD - receber dados)
   * Esta é a função mais importante - garante que sempre temos dados atualizados
   */
  async syncFromServer() {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/data`);
      
      if (!response.ok) {
        console.warn('[Sync] Servidor indisponível, usando localStorage');
        return false;
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        const serverData = result.data;

        // Atualizar localStorage com dados do servidor (servidor é autoridade)
        this.saveLocalData(serverData);
        
        // Atualizar appState com dados do servidor
        if (typeof appState !== 'undefined') {
          appState.candidates = serverData.candidates || [];
          appState.logs = serverData.logs || [];
          appState.isPublished = serverData.published || false;
        }
        
        console.log('[Sync] ✅ Dados baixados do servidor');
        return true;
      }
    } catch (error) {
      console.warn('[Sync] Erro ao sincronizar:', error.message);
    }
    
    return false;
  }

  /**
   * Enviar dados locais para servidor (UPLOAD - enviar nossos dados)
   */
  async syncToServer() {
    try {
      const localData = this.getLocalData();
      
      const response = await fetch(`${this.SERVER_URL}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localData)
      });

      if (!response.ok) {
        console.warn('[Sync] Erro ao enviar para servidor');
        return false;
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('[Sync] ✅ Dados enviados para servidor');
        // Adicionar log de sincronização
        if (typeof appState !== 'undefined') {
          appState.addLog(`Dados sincronizados com servidor (${localData.candidates.length} candidatos)`);
        }
        return true;
      }
    } catch (error) {
      console.warn('[Sync] Erro ao enviar dados:', error.message);
    }
    
    return false;
  }

  /**
   * Verificar status do servidor
   */
  async checkServerStatus() {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/status`, {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obter dados do localStorage
   */
  getLocalData() {
    return {
      candidates: JSON.parse(localStorage.getItem('ipial_candidates') || '[]'),
      logs: JSON.parse(localStorage.getItem('ipial_logs') || '[]'),
      config: JSON.parse(localStorage.getItem('ipial_config') || '{}'),
      published: localStorage.getItem('ipial_published') === 'true'
    };
  }

  /**
   * Salvar dados no localStorage
   */
  saveLocalData(data) {
    localStorage.setItem('ipial_candidates', JSON.stringify(data.candidates || []));
    localStorage.setItem('ipial_logs', JSON.stringify(data.logs || []));
    localStorage.setItem('ipial_config', JSON.stringify(data.config || {}));
    if (data.published !== undefined) {
      localStorage.setItem('ipial_published', data.published.toString());
    }
  }

  /**
   * Interceptar alterações de dados
   */
  setupListeners() {
    // Quando storage muda em outra aba
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('ipial_')) {
        console.log('[Sync] Dados alterados em outra aba, sincronizando...');
        this.syncToServer();
      }
    });
  }

  /**
   * Exportar dados (para backup)
   */
  async exportData() {
    try {
      const response = await fetch(`${this.SERVER_URL}/api/data`);
      
      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.warn('[Sync] Erro ao exportar, usando localStorage');
    }
    
    return this.getLocalData();
  }

  /**
   * Importar dados (a partir de backup)
   */
  async importData(data) {
    try {
      // Validar dados
      if (!data.candidates || !Array.isArray(data.candidates)) {
        throw new Error('Formato inválido');
      }

      // Salvar localmente
      this.saveLocalData(data);

      // Enviar para servidor
      return await this.syncToServer();
    } catch (error) {
      console.error('[Sync] Erro ao importar:', error.message);
      return false;
    }
  }
}

// Instância global
const dataSync = new DataSync();
