const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'ipial_data.json');

// Criar pasta de dados se não existir
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Carregar dados do arquivo JSON
 */
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar dados:', error.message);
  }
  return getDefaultData();
}

/**
 * Salvar dados no arquivo JSON
 */
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados:', error.message);
    return false;
  }
}

/**
 * Estrutura padrão dos dados
 */
function getDefaultData() {
  return {
    candidates: [],
    logs: [],
    config: {
      minAge: 15,
      maxFileSize: 2097152,
      courses: [
        'Engenharia Informatica',
        'Administracao',
        'Contabilidade',
        'Gestao de Proyectos',
        'Educacao Pre-Escolar',
        'Educacao Especial'
      ]
    },
    published: false,
    lastSync: new Date().toISOString()
  };
}

// ============================================
// ROTAS API
// ============================================

/**
 * GET /api/data
 * Retornar todos os dados
 */
app.get('/api/data', (req, res) => {
  try {
    const data = loadData();
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/data
 * Salvar todos os dados
 */
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    
    if (!newData.candidates || !Array.isArray(newData.candidates)) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos: campo "candidates" é obrigatório'
      });
    }

    newData.lastSync = new Date().toISOString();
    const saved = saveData(newData);

    if (saved) {
      res.json({
        success: true,
        message: 'Dados sincronizados com sucesso',
        timestamp: newData.lastSync
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao salvar dados'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/candidates
 * Adicionar novo candidato
 */
app.post('/api/candidates', (req, res) => {
  try {
    const data = loadData();
    const candidate = req.body;

    // Validações
    if (!candidate.name || !candidate.bi || candidate.note === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: name, bi, note'
      });
    }

    // Verificar duplicação de BI
    if (data.candidates.some(c => c.bi === candidate.bi)) {
      return res.status(400).json({
        success: false,
        error: 'BI já existe na base de dados'
      });
    }

    candidate.id = Date.now().toString();
    candidate.createdAt = new Date().toISOString();
    data.candidates.push(candidate);
    saveData(data);

    res.json({
      success: true,
      message: 'Candidato adicionado',
      candidate: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/candidates
 * Listar todos os candidatos
 */
app.get('/api/candidates', (req, res) => {
  try {
    const data = loadData();
    res.json({
      success: true,
      candidates: data.candidates,
      count: data.candidates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/candidates/:bi
 * Buscar candidato por BI
 */
app.get('/api/candidates/:bi', (req, res) => {
  try {
    const data = loadData();
    const candidate = data.candidates.find(c => c.bi === req.params.bi);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        error: 'Candidato não encontrado'
      });
    }

    res.json({
      success: true,
      candidate: candidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/candidates/:bi
 * Atualizar candidato
 */
app.put('/api/candidates/:bi', (req, res) => {
  try {
    const data = loadData();
    const index = data.candidates.findIndex(c => c.bi === req.params.bi);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Candidato não encontrado'
      });
    }

    const updatedCandidate = {
      ...data.candidates[index],
      ...req.body,
      bi: req.params.bi, // Não permitir mudar BI
      createdAt: data.candidates[index].createdAt, // Manter data original
      updatedAt: new Date().toISOString()
    };

    data.candidates[index] = updatedCandidate;
    saveData(data);

    res.json({
      success: true,
      message: 'Candidato atualizado',
      candidate: updatedCandidate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/candidates/:bi
 * Deletar candidato
 */
app.delete('/api/candidates/:bi', (req, res) => {
  try {
    const data = loadData();
    const index = data.candidates.findIndex(c => c.bi === req.params.bi);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Candidato não encontrado'
      });
    }

    const deletedCandidate = data.candidates.splice(index, 1);
    saveData(data);

    res.json({
      success: true,
      message: 'Candidato deletado',
      candidate: deletedCandidate[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/logs
 * Adicionar log
 */
app.post('/api/logs', (req, res) => {
  try {
    const data = loadData();
    const log = {
      ...req.body,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    data.logs.push(log);
    saveData(data);

    res.json({
      success: true,
      message: 'Log adicionado',
      log: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/logs
 * Listar todos os logs
 */
app.get('/api/logs', (req, res) => {
  try {
    const data = loadData();
    res.json({
      success: true,
      logs: data.logs,
      count: data.logs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/status
 * Status do servidor
 */
app.get('/api/status', (req, res) => {
  try {
    const data = loadData();
    res.json({
      success: true,
      status: 'online',
      candidates: data.candidates.length,
      logs: data.logs.length,
      lastSync: data.lastSync,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/reset
 * Resetar dados (CUIDADO!)
 */
app.post('/api/reset', (req, res) => {
  try {
    const password = req.body.password;
    
    if (password !== 'admin@reset') {
      return res.status(403).json({
        success: false,
        error: 'Senha incorreta'
      });
    }

    saveData(getDefaultData());
    res.json({
      success: true,
      message: 'Dados resetados com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   IPIAL - Servidor de Sincronização       ║
╚════════════════════════════════════════════╝

✅ Servidor iniciado em http://localhost:${PORT}
📁 Dados salvos em: ${DATA_FILE}

API Endpoints:
  GET    /api/data              - Obter todos dados
  POST   /api/data              - Salvar todos dados
  GET    /api/candidates        - Listar candidatos
  POST   /api/candidates        - Adicionar candidato
  GET    /api/candidates/:bi    - Buscar por BI
  PUT    /api/candidates/:bi    - Atualizar candidato
  DELETE /api/candidates/:bi    - Deletar candidato
  GET    /api/logs              - Listar logs
  POST   /api/logs              - Adicionar log
  GET    /api/status            - Status do servidor
  POST   /api/reset             - Resetar dados (senha: admin@reset)

Acesse a aplicação em:
  http://localhost:${PORT}

Para parar: Pressione Ctrl+C
  `);
});
