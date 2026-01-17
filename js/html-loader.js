// html-loader.js - Carrega templates HTML dos arquivos

const HTMLLoader = {
  templates: {},
  
  async loadTemplate(name) {
    if (this.templates[name]) {
      return this.templates[name];
    }
    
    try {
      const response = await fetch(`/html/${name}.html`);
      if (!response.ok) throw new Error(`Não conseguiu carregar ${name}.html`);
      const html = await response.text();
      this.templates[name] = html;
      return html;
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      return '';
    }
  },
  
  async loadAllTemplates() {
    const templates = [
      'login',
      'admin-layout',
      'dashboard',
      'candidates-list',
      'candidate-form',
      'publications',
      'public-results',
      'public-search-result'
    ];
    
    await Promise.all(templates.map(t => this.loadTemplate(t)));
    return this.templates;
  },
  
  getTemplate(name) {
    return this.templates[name] || '';
  }
};
