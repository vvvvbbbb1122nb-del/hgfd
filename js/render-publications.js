// ====================================
// RENDERIZAÇÃO - PUBLICAÇÕES
// ====================================

function renderPublications() {
    let html = HTMLLoader.getTemplate('publications');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Atualizar status badge
    const statusBadge = temp.querySelector('#publishStatusBadge');
    if (statusBadge) {
        if (appState.isPublished) {
            statusBadge.className = 'status-badge published';
            statusBadge.textContent = '✓ Publicado';
        } else {
            statusBadge.className = 'status-badge draft';
            statusBadge.textContent = '○ Privado';
        }
    }
    
    // Atualizar botão de toggle
    const toggleBtn = temp.querySelector('#togglePublish');
    if (toggleBtn) {
        if (appState.isPublished) {
            toggleBtn.className = 'publish-button inactive';
            toggleBtn.textContent = '🔒 Suspender Publicação';
        } else {
            toggleBtn.className = 'publish-button active';
            toggleBtn.textContent = '🔓 Publicar Resultados Agora';
        }
    }
    
    // Mostrar/esconder seção de downloads
    const downloadSection = temp.querySelector('#downloadSection');
    if (downloadSection) {
        downloadSection.style.display = appState.isPublished ? 'block' : 'none';
    }
    
    return temp.innerHTML;
}
