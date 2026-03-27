const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const parser = require('iptv-playlist-parser'); 

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("Servidor VYPER ONLINE 🚀");
});

app.post('/register-list', (req, res) => {
  const { playlistUrl } = req.body;
  console.log("===============================");
  console.log("NOVA LISTA CADASTRADA:", playlistUrl);
  console.log("===============================");
  res.status(200).json({ success: true, message: "Lista recebida pelo servidor Railway!" });
});

// =========================================================
// ROTA SUPER OTIMIZADA: PROCESSA E SEPARA AS CATEGORIAS
// =========================================================
app.get('/get-canais', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Falta a URL da lista" });

  try {
    console.log(`A transferir lista de: ${url}`);
    
    // 1. Descarrega a lista M3U
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const m3uString = await response.text();
    
    console.log("A processar e organizar categorias...");
    const playlist = parser.parse(m3uString);
    
    // 2. Cria as "gavetas" vazias
    const canais = [];
    const filmes = [];
    const series = [];

    // 3. Lê cada item e guarda na gaveta certa
    playlist.items.forEach(item => {
      // Pega o nome do grupo e converte para minúsculas para facilitar a pesquisa
      const groupTitle = (item.group.title || "").toLowerCase();
      
      // Palavras-chave para SÉRIES
      if (groupTitle.includes('serie') || groupTitle.includes('série') || groupTitle.includes('season')) {
        series.push(item);
      } 
      // Palavras-chave para FILMES
      else if (groupTitle.includes('filme') || groupTitle.includes('vod') || groupTitle.includes('cinema') || groupTitle.includes('lançamento')) {
        filmes.push(item);
      } 
      // Se não for filme nem série, vai para os CANAIS de TV
      else {
        canais.push(item);
      }
    });
    
    console.log(`Organização concluída: ${canais.length} Canais | ${filmes.length} Filmes | ${series.length} Séries`);

    // 4. Envia tudo separadinho para o teu App
    res.status(200).json({
      success: true,
      totais: {
        canais: canais.length,
        filmes: filmes.length,
        series: series.length
      },
      dados: {
        canais: canais,
        filmes: filmes,
        series: series
      }
    });

  } catch (e) {
    console.error("Erro ao processar lista no servidor:", e);
    res.status(500).json({ error: "Erro ao processar a lista." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT}`);
});