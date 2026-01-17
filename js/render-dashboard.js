// ====================================
// RENDERIZAÇÃO - DASHBOARD E CANDIDATOS
// ====================================

function renderDashboard() {
    const stats = appState.getStats();
    let html = HTMLLoader.getTemplate('dashboard');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Preencher estatísticas
    const statTotal = temp.querySelector('#statTotal');
    const statApproved = temp.querySelector('#statApproved');
    const statRejected = temp.querySelector('#statRejected');
    
    if (statTotal) statTotal.textContent = stats.total;
    if (statApproved) statApproved.textContent = stats.approved;
    if (statRejected) statRejected.textContent = stats.rejected;
    
    // Distribuição por curso
    const courseDistribution = temp.querySelector('#courseDistribution');
    if (courseDistribution) {
        courseDistribution.innerHTML = COURSES.map(course => {
            const count = stats.byCourse[course] || 0;
            const pct = stats.total ? (count / stats.total) * 100 : 0;
            return `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 12px; font-weight: 700; color: #64748b;">${course}</span>
                        <span style="font-weight: 700;">${count}</span>
                    </div>
                    <div style="width: 100%; background-color: #f1f5f9; border-radius: 99px; height: 8px;">
                        <div style="background-color: #2563eb; height: 100%; border-radius: 99px; width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Atividade recente
    const activityList = temp.querySelector('#activityList');
    if (activityList) {
        if (appState.logs.length === 0) {
            activityList.innerHTML = '<p style="color: #94a3b8; font-style: italic;">Sem atividade</p>';
        } else {
            activityList.innerHTML = appState.logs.slice(0, 10).map(log => `
                <div class="activity-item">
                    <p class="activity-action">${log.action}</p>
                    <div class="activity-meta">
                        <p class="activity-time">${new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                </div>
            `).join('');
        }
    }
    
    return temp.innerHTML;
}

function renderCandidatesList() {
    const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const courseFilter = document.getElementById('courseFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    let filtered = appState.candidates;

    if (searchTerm) {
        filtered = filtered.filter(c =>
            c.fullName.toLowerCase().includes(searchTerm) ||
            c.idNumber.toLowerCase().includes(searchTerm) ||
            c.contact.toLowerCase().includes(searchTerm)
        );
    }

    if (courseFilter) {
        filtered = filtered.filter(c => c.course === courseFilter);
    }

    if (statusFilter) {
        filtered = filtered.filter(c => c.status === statusFilter);
    }

    let html = HTMLLoader.getTemplate('candidates-list');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Preenc cursos no filtro
    const courseFilterSelect = temp.querySelector('#courseFilter');
    if (courseFilterSelect) {
        const options = COURSES.map(course => `<option value="${course}">${course}</option>`).join('');
        courseFilterSelect.innerHTML = '<option value="">Todos os Cursos</option>' + options;
        courseFilterSelect.value = courseFilter;
    }
    
    // Preencher status no filtro
    const statusFilterSelect = temp.querySelector('#statusFilter');
    if (statusFilterSelect) {
        statusFilterSelect.value = statusFilter;
    }
    
    // Atualizar contadores
    const filtered_span = temp.querySelector('#filtered');
    const total_span = temp.querySelector('#total');
    if (filtered_span) filtered_span.textContent = filtered.length;
    if (total_span) total_span.textContent = appState.candidates.length;
    
    // Preencher tabela
    const tableBody = temp.querySelector('#candidatesTableBody');
    if (tableBody) {
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 32px;">Nenhum candidato encontrado.</td></tr>';
        } else {
            tableBody.innerHTML = filtered.map(c => `
                <tr>
                    <td style="text-align: center;">
                        ${c.photo ?
                            `<img src="${c.photo}" style="width: 40px; height: 50px; object-fit: cover; border-radius: 4px;">` :
                            '<div style="width: 40px; height: 50px; background-color: #e2e8f0; border-radius: 4px;"></div>'
                        }
                    </td>
                    <td style="font-weight: 600;">${c.fullName}</td>
                    <td style="font-size: 12px;">${c.course}</td>
                    <td style="font-family: monospace; font-size: 12px;">${c.idNumber}</td>
                    <td style="text-align: center; font-weight: 700;">${c.score.toFixed(1)}</td>
                    <td style="text-align: center;">
                        <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;
                            ${c.status === STATUS.APPROVED ? 'background-color: #dcfce7; color: #166534;' :
                              c.status === STATUS.REJECTED ? 'background-color: #fef2f2; color: #991b1b;' :
                              'background-color: #f3f4f6; color: #374151;'}">
                            ${c.status}
                        </span>
                    </td>
                    <td style="text-align: right; display: flex; gap: 6px; justify-content: flex-end;">
                        <button class="btn-secondary btn-sm edit-btn" data-id="${c.id}">✎</button>
                        <button class="btn-danger btn-sm delete-btn" data-id="${c.id}">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    return temp.innerHTML;
}

function renderCandidateForm() {
    const c = appState.editingCandidate;
    let html = HTMLLoader.getTemplate('candidate-form');
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Atualizar título do formulário
    const formTitle = temp.querySelector('#formTitle');
    if (formTitle) {
        formTitle.textContent = c ? '✎ Editar Candidato' : '➕ Novo Candidato';
    }
    
    // Preencher cursos
    const courseSelect = temp.querySelector('select[name="course"]');
    if (courseSelect) {
        const options = COURSES.map(course => `<option value="${course}" ${c?.course === course ? 'selected' : ''}>${course}</option>`).join('');
        courseSelect.innerHTML = '<option value="">Selecione um Curso</option>' + options;
    }
    
    // Preencher campos se é edição
    if (c) {
        const form = temp.querySelector('#candidateForm');
        form.querySelector('[name="fullName"]').value = c.fullName;
        form.querySelector('[name="idNumber"]').value = c.idNumber;
        form.querySelector('[name="contact"]').value = c.contact;
        form.querySelector('[name="age"]').value = c.age;
        form.querySelector('[name="score"]').value = c.score;
        // Status é automático, não precisa preencher
        form.querySelector('#candidateId').value = c.id;
        form.querySelector('#photoData').value = c.photo || '';
        
        // Mostrar foto se existir
        const photoPreview = temp.querySelector('#photoPreview');
        if (c.photo && photoPreview) {
            photoPreview.innerHTML = `<img src="${c.photo}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        
        // Mostrar botão de remover foto
        const removePhotoBtn = temp.querySelector('#removePhotoBtn');
        if (c.photo && removePhotoBtn) {
            removePhotoBtn.style.display = 'inline-block';
        }
    }
    
    return temp.innerHTML;
}
