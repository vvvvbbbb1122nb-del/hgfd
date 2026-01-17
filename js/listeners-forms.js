// ====================================
// EVENT LISTENERS - FORMULÁRIOS
// ====================================

function attachCandidateFormListeners() {
    const form = document.getElementById('candidateForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);

            if (data.fullName.length < APP_CONFIG.MIN_NAME_LENGTH) {
                alert(`Nome deve ter pelo menos ${APP_CONFIG.MIN_NAME_LENGTH} caracteres`);
                return;
            }

            if (parseInt(data.age) < APP_CONFIG.MIN_AGE) {
                alert(`Idade mínima é ${APP_CONFIG.MIN_AGE} anos`);
                return;
            }

            const candidateData = {
                fullName: data.fullName,
                age: parseInt(data.age),
                idNumber: data.idNumber.toUpperCase(),
                contact: data.contact,
                course: data.course,
                score: parseFloat(data.score),
                status: data.status,
                photo: document.getElementById('photoData').value || ''
            };

            const candidateId = document.getElementById('candidateId').value;
            if (candidateId) {
                appState.updateCandidate(candidateId, candidateData);
            } else {
                const result = appState.addCandidate(candidateData);
                if (!result.success) {
                    alert(result.error);
                    return;
                }
            }

            appState.save();
            appState.showAddForm = false;
            appState.editingCandidate = null;
            updateContent();
        });
    }

    // Photo upload handler
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    if (uploadPhotoBtn) {
        uploadPhotoBtn.addEventListener('click', () => {
            document.getElementById('photoInput').click();
        });
    }

    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > APP_CONFIG.MAX_PHOTO_SIZE) {
                    alert('Imagem muito grande! Máximo 2MB');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target.result;
                    document.getElementById('photoData').value = base64;
                    const preview = document.getElementById('photoPreview');
                    preview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Remove photo button
    const removePhotoBtn = document.getElementById('removePhotoBtn');
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            document.getElementById('photoData').value = '';
            document.getElementById('photoPreview').innerHTML = '<span style="text-align: center; color: #94a3b8; font-size: 12px;">Clique para adicionar foto</span>';
            document.getElementById('photoInput').value = '';
        });
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            appState.showAddForm = false;
            appState.editingCandidate = null;
            updateContent();
        });
    }
}

function attachCandidateListListeners() {
    const addCandidateBtn = document.getElementById('addCandidateBtn');
    if (addCandidateBtn) {
        addCandidateBtn.addEventListener('click', () => {
            appState.editingCandidate = null;
            appState.showAddForm = true;
            updateContent();
        });
    }

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            appState.editingCandidate = appState.candidates.find(c => c.id === id);
            appState.showAddForm = true;
            updateContent();
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const candidate = appState.candidates.find(c => c.id === id);
            if (confirm(`Eliminar ${candidate?.fullName}?`)) {
                appState.deleteCandidate(id);
                updateContent();
            }
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            updateContent();
        });
    }

    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        courseFilter.addEventListener('change', () => {
            updateContent();
        });
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            updateContent();
        });
    }

    const reportBtn = document.getElementById('reportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            appState.generateReport();
        });
    }
}

function attachPublicationsListeners() {
    const toggleBtn = document.getElementById('togglePublish');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            appState.isPublished = !appState.isPublished;
            appState.addLog(appState.isPublished ? 'Resultados publicados' : 'Publicação suspensa');
            appState.save();
            updateContent();
        });
    }

    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            appState.viewMode = 'public';
            render();
        });
    }

    // Download buttons
    const downloadListaCsvBtn = document.getElementById('downloadListaCsvBtn');
    if (downloadListaCsvBtn) {
        downloadListaCsvBtn.addEventListener('click', () => {
            DataExport.exportToCSV(appState.candidates, `IPIAL_Lista_Completa_${new Date().toISOString().split('T')[0]}.csv`);
            appState.addLog('Lista geral exportada em CSV');
        });
    }

    const downloadListaPdfBtn = document.getElementById('downloadListaPdfBtn');
    if (downloadListaPdfBtn) {
        downloadListaPdfBtn.addEventListener('click', () => {
            DataExport.exportToPDF(appState.candidates, 'Lista Completa de Candidatos - 2025');
            appState.addLog('Lista geral exportada em PDF');
        });
    }

    const downloadAprovadosCsvBtn = document.getElementById('downloadAprovadosCsvBtn');
    if (downloadAprovadosCsvBtn) {
        downloadAprovadosCsvBtn.addEventListener('click', () => {
            const approved = appState.candidates.filter(c => c.status === STATUS.APPROVED);
            DataExport.exportToCSV(approved, `IPIAL_Aprovados_${new Date().toISOString().split('T')[0]}.csv`);
            appState.addLog('Lista de aprovados exportada em CSV');
        });
    }

    const downloadAprovadosPdfBtn = document.getElementById('downloadAprovadosPdfBtn');
    if (downloadAprovadosPdfBtn) {
        downloadAprovadosPdfBtn.addEventListener('click', () => {
            const approved = appState.candidates.filter(c => c.status === STATUS.APPROVED);
            DataExport.exportToPDF(approved, 'Lista de Aprovados - 2025');
            appState.addLog('Lista de aprovados exportada em PDF');
        });
    }
}
