const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();

// --- CONFIGURAÇÕES ---
app.use(cors());
app.use(express.json()); // <--- IMPORTANTE: Permite que o servidor entenda o JSON do App

const PORT = process.env.PORT || 3000;

// Rota de teste
app.get('/', (req, res) => {
  res.send("Servidor VYPER ONLINE 🚀");
});

// A ROTA QUE O SEU LOGIN ESTÁ CHAMANDO
app.post('/register-list', (req, res) => {
  const { playlistUrl } = req.body;
  
  console.log("===============================");
  console.log("NOVA LISTA CADASTRADA:");
  console.log("URL:", playlistUrl);
  console.log("===============================");

  res.status(200).json({ 
    success: true, 
    message: "Lista recebida pelo servidor Railway!" 
  });
});

// Rota Proxy para a lista (se precisar)
app.get('/m3u', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Falta a URL");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const text = await response.text();
    res.send(text);
  } catch (e) {
    res.status(500).send("Erro ao buscar lista externa");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});