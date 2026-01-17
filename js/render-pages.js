// ====================================
// RENDERIZAÇÃO - PÁGINAS
// ====================================

function renderLoginPage() {
    let html = HTMLLoader.getTemplate('login');
    
    // Atualizar estado de publicação dinamicamente
    const statusText = appState.isPublished ? '🟢 Resultados Publicados' : '⚪ Aguardando Publicação';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const statusSpan = temp.querySelector('.status-text span');
    if (statusSpan) {
        statusSpan.textContent = statusText;
    }
    
    return temp.innerHTML;
}

function renderAdminLayout() {
    let html = HTMLLoader.getTemplate('admin-layout');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Ativar tab correto
    const navButtons = temp.querySelectorAll('[data-tab]');
    navButtons.forEach(btn => {
        if (btn.dataset.tab === appState.activeTab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Atualizar título da página
    const pageTitle = temp.querySelector('#pageTitle');
    if (pageTitle) {
        if (appState.activeTab === 'dashboard') {
            pageTitle.textContent = '📊 Dashboard';
        } else if (appState.activeTab === 'candidates') {
            pageTitle.textContent = '👥 Candidatos';
        } else {
            pageTitle.textContent = '📄 Publicações';
        }
    }
    
    // Mostrar/esconder botão de adicionar candidato
    const addBtn = temp.querySelector('#addBtn');
    if (addBtn) {
        if (appState.activeTab === 'candidates' && !appState.showAddForm) {
            addBtn.style.display = 'block';
        } else {
            addBtn.style.display = 'none';
        }
    }
    
    return temp.innerHTML;
}

function renderPublicResults() {
    let html = HTMLLoader.getTemplate('public-results');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Sincronizar com servidor quando exibe resultados públicos
    if (typeof dataSync !== 'undefined') {
        dataSync.syncFromServer();
    }
    
    // Mostrar/esconder conteúdo baseado no estado de publicação
    const publicUnavailable = temp.querySelector('#publicUnavailable');
    const publicContent = temp.querySelector('#publicContent');
    
    if (!appState.isPublished) {
        if (publicUnavailable) publicUnavailable.style.display = 'block';
        if (publicContent) publicContent.style.display = 'none';
    } else {
        if (publicUnavailable) publicUnavailable.style.display = 'none';
        if (publicContent) publicContent.style.display = 'block';
        
        // Preencher dados dinamicamente
        const approved = appState.candidates.filter(c => c.status === STATUS.APPROVED).length;
        const rejected = appState.candidates.filter(c => c.status === STATUS.REJECTED).length;
        const ranking = appState.candidates.slice().sort((a, b) => b.score - a.score).slice(0, 10);
        
        // Totais
        const pubTotal = temp.querySelector('#pubTotal');
        const pubApproved = temp.querySelector('#pubApproved');
        const pubRejected = temp.querySelector('#pubRejected');
        if (pubTotal) pubTotal.textContent = appState.candidates.length;
        if (pubApproved) pubApproved.textContent = approved;
        if (pubRejected) pubRejected.textContent = rejected;
        
        // Ranking
        const topRanking = temp.querySelector('#topRanking');
        if (topRanking) {
            if (ranking.length === 0) {
                topRanking.innerHTML = '<p style="color: #94a3b8;">Sem candidatos</p>';
            } else {
                topRanking.innerHTML = ranking.map((c, i) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background-color: #f8fafc; border-radius: 6px; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            ${c.photo ?
                                `<img src="${c.photo}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px; flex-shrink: 0;">` :
                                '<div style="width: 40px; height: 50px; background-color: #e2e8f0; border-radius: 4px; flex-shrink: 0;"></div>'
                            }
                            <div style="flex: 1;">
                                <span style="font-weight: 700; font-size: 14px;">${i + 1}º</span>
                                <span style="margin-left: 8px; font-weight: 600;">${c.fullName}</span>
                            </div>
                        </div>
                        <span style="font-weight: 900; color: #2563eb; white-space: nowrap;">${c.score.toFixed(1)}</span>
                    </div>
                `).join('');
            }
        }
        
        // Tabela
        const publicTableBody = temp.querySelector('#publicTableBody');
        if (publicTableBody) {
            publicTableBody.innerHTML = appState.candidates.map((c, i) => `
                <tr>
                    <td style="text-align: center;">
                        ${c.photo ?
                            `<img src="${c.photo}" style="width: 35px; height: 50px; object-fit: cover; border-radius: 3px;">` :
                            '<div style="width: 35px; height: 50px; background-color: #e2e8f0; border-radius: 3px;"></div>'
                        }
                    </td>
                    <td>${i + 1}</td>
                    <td style="font-weight: 600;">${c.fullName}</td>
                    <td>${c.idNumber}</td>
                    <td>${c.course}</td>
                    <td style="text-align: center; font-weight: 700;">${c.score.toFixed(1)}</td>
                    <td style="text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 700;
                            ${c.status === STATUS.APPROVED ? 'background-color: #dcfce7; color: #166534;' : 
                              c.status === STATUS.REJECTED ? 'background-color: #fef2f2; color: #991b1b;' : 
                              'background-color: #f3f4f6; color: #374151;'}">
                            ${c.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        }
        
        // Data de publicação
        const publishDate = temp.querySelector('#publishDate');
        if (publishDate) {
            publishDate.textContent = `Publicado em: ${new Date().toLocaleString('pt-PT')}`;
        }
    }
    
    return temp.innerHTML;
}
