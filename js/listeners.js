// ====================================
// EVENT LISTENERS - GERAL
// ====================================

// Tempo de inatividade (10 minutos em ms)
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;
let inactivityTimer = null;

// Resetar timer de inatividade
function resetInactivityTimer() {
    if (!appState.isAuthenticated) return;
    
    // Limpar timer anterior
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    // Atualizar tempo de atividade
    appState.updateActivity();
    
    // Definir novo timer
    inactivityTimer = setTimeout(() => {
        console.log('⏱️ Sessão expirada por inatividade');
        appState.logout().then(() => {
            render();
        });
    }, INACTIVITY_TIMEOUT);
}

// Renderização principal
function render() {
    const app = document.getElementById('app');

    if (appState.viewMode === 'public') {
        app.innerHTML = renderPublicResults();
        attachPublicListeners();
        resetInactivityTimer();
        return;
    }

    if (!appState.isAuthenticated) {
        app.innerHTML = renderLoginPage();
        attachLoginListeners();
        // Limpar timer quando sai (não autenticado)
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        return;
    }

    app.innerHTML = renderAdminLayout();
    updateContent();
    attachAdminListeners();
    resetInactivityTimer();
}

function updateContent() {
    const content = document.getElementById('content');
    if (!content) return;

    if (appState.activeTab === 'dashboard') {
        content.innerHTML = renderDashboard();
    } else if (appState.activeTab === 'candidates') {
        if (appState.showAddForm) {
            content.innerHTML = renderCandidateForm();
            attachCandidateFormListeners();
        } else {
            content.innerHTML = renderCandidatesList();
            attachCandidateListListeners();
        }
    } else if (appState.activeTab === 'publications') {
        content.innerHTML = renderPublications();
        attachPublicationsListeners();
    }
}

// Login
function attachLoginListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            if (user === 'admin' && pass === 'admin') {
                // Usar função de login que guarda sessão
                await appState.login('Administrador');
                render();
            } else {
                const errorDiv = document.getElementById('loginError');
                errorDiv.style.display = 'flex';
                document.getElementById('errorText').textContent = 'Credenciais inválidas!';
            }
        });
    }

    const publicBtn = document.getElementById('publicBtn');
    if (publicBtn) {
        publicBtn.addEventListener('click', (e) => {
            e.preventDefault();
            appState.viewMode = 'public';
            render();
        });
    }
}

// Admin
function attachAdminListeners() {
    // Resetar timer de inatividade em qualquer clique
    document.addEventListener('click', resetInactivityTimer, { once: false });
    document.addEventListener('keypress', resetInactivityTimer, { once: false });
    document.addEventListener('mousemove', () => {
        // Resetar apenas a cada 30 segundos para não sobrecarregar
        if (!window.lastActivityReset || Date.now() - window.lastActivityReset > 30000) {
            resetInactivityTimer();
            window.lastActivityReset = Date.now();
        }
    }, { once: false });
    
    // Tab navigation
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            appState.activeTab = btn.dataset.tab;
            appState.showAddForm = false;
            appState.editingCandidate = null;
            updateContent();
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await appState.logout();
            render();
        });
    }

    // Export JSON
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            DataExport.exportAsJSON();
        });
    }

    // Import JSON
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const result = await DataExport.importFromJSON(file);
                if (result.success) {
                    alert(`Importação concluída: ${result.count} candidatos adicionados`);
                    updateContent();
                } else {
                    alert(`Erro: ${result.error}`);
                }
                e.target.value = '';
            }
        });
    }

    // Add button
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            appState.showAddForm = true;
            appState.editingCandidate = null;
            updateContent();
        });
    }
}

// Públicos
function attachPublicListeners() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            appState.viewMode = 'none';
            appState.isAuthenticated = false;
            render();
        });
    }

    // Public search by BI
    const searchBiPublic = document.getElementById('searchBiPublic');
    if (searchBiPublic) {
        searchBiPublic.addEventListener('input', (e) => {
            const bi = e.target.value.toUpperCase();
            const resultDiv = document.getElementById('publicSearchResult');

            if (!bi) {
                resultDiv.innerHTML = '';
                return;
            }

            const candidate = appState.candidates.find(c => c.idNumber.toUpperCase() === bi);

            // Carregar template
            let html = HTMLLoader.getTemplate('public-search-result');
            resultDiv.innerHTML = html;

            if (!candidate) {
                // Mostrar "não encontrado"
                resultDiv.querySelector('#publicSearchNotFound').style.display = 'block';
                resultDiv.querySelector('#publicSearchFound').style.display = 'none';
                return;
            }

            // Mostrar resultado encontrado
            resultDiv.querySelector('#publicSearchNotFound').style.display = 'none';
            resultDiv.querySelector('#publicSearchFound').style.display = 'block';

            // Preencher dados
            if (candidate.photo) {
                resultDiv.querySelector('#searchPhoto').src = candidate.photo;
                resultDiv.querySelector('#searchPhoto').style.display = 'block';
                resultDiv.querySelector('#searchPhotoPlaceholder').style.display = 'none';
            } else {
                resultDiv.querySelector('#searchPhoto').style.display = 'none';
                resultDiv.querySelector('#searchPhotoPlaceholder').style.display = 'block';
            }

            resultDiv.querySelector('#searchName').textContent = candidate.fullName;
            resultDiv.querySelector('#searchBi').textContent = `BI: ${candidate.idNumber}`;
            resultDiv.querySelector('#searchCourse').textContent = `Curso: ${candidate.course}`;
            resultDiv.querySelector('#searchScore').textContent = candidate.score.toFixed(1);

            // Aplicar estilos ao status
            const statusEl = resultDiv.querySelector('#searchStatus');
            statusEl.textContent = candidate.status;
            if (candidate.status === STATUS.APPROVED) {
                statusEl.style.backgroundColor = '#dcfce7';
                statusEl.style.color = '#166534';
            } else if (candidate.status === STATUS.REJECTED) {
                statusEl.style.backgroundColor = '#fef2f2';
                statusEl.style.color = '#991b1b';
            } else {
                statusEl.style.backgroundColor = '#f3f4f6';
                statusEl.style.color = '#374151';
            }
        });
    }
}
