const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Um "banco de dados" temporário na memória para guardar onde o usuário parou no filme.
// Numa versão profissional, você usaria MongoDB ou Firebase aqui.
const progressoUsuarios = {}; 

app.get('/', (req, res) => res.send("Backend VYPER Universal ONLINE 🚀"));

// =========================================================
// ROTAS DO APLICATIVO (SALVAR PROGRESSO DE VÍDEOS)
// =========================================================

// Rota para o celular avisar em que minuto o filme está
app.post('/salvar-progresso', (req, res) => {
  // O app vai enviar: quem é o usuário, qual o ID do filme e o tempo atual
  const { usuarioId, filmeId, tempoAtual } = req.body;
  
  if (!usuarioId || !filmeId) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  // Cria o espaço do usuário se não existir
  if (!progressoUsuarios[usuarioId]) {
    progressoUsuarios[usuarioId] = {};
  }

  // Salva o tempo do filme específico
  progressoUsuarios[usuarioId][filmeId] = tempoAtual;
  
  console.log(`Progresso salvo: Usuário ${usuarioId} | Filme ${filmeId} | Minuto: ${tempoAtual}`);
  res.status(200).json({ success: true });
});

// Rota para o celular perguntar de onde deve continuar o filme
app.get('/buscar-progresso', (req, res) => {
  const { usuarioId, filmeId } = req.query;

  if (progressoUsuarios[usuarioId] && progressoUsuarios[usuarioId][filmeId]) {
    const tempoSalvo = progressoUsuarios[usuarioId][filmeId];
    res.status(200).json({ tempoSalvo });
  } else {
    // Se não tem progresso salvo, começa do zero
    res.status(200).json({ tempoSalvo: 0 });
  }
});


// =========================================================
// PROXY DE VÍDEO PROFISSIONAL 💥 (MANTIDO)
// =========================================================
app.get('/stream', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL do vídeo ausente");

  const fetchHeaders = {
    "User-Agent": "VLC/3.0.16 LibVLC/3.0.16",
    "Accept": "*/*"
  };

  if (req.headers.range) {
    fetchHeaders['Range'] = req.headers.range;
  }

  try {
    const response = await fetch(url, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      return res.status(response.status).send("Erro no provedor original");
    }

    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });
    
    res.status(response.status);
    response.body.pipe(res);

  } catch (error) {
    console.error("Erro no proxy de vídeo:", error.message);
    res.status(500).send("Erro ao processar o stream");
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));