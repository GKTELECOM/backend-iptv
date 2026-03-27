const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const readline = require('readline'); // Ferramenta nativa do Node para ler linha por linha sem gastar memória

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => res.send("Servidor VYPER ONLINE 🚀"));

app.post('/register-list', (req, res) => {
  const { playlistUrl } = req.body;
  console.log("NOVA LISTA REGISTRADA:", playlistUrl);
  res.status(200).json({ success: true, message: "Lista registrada!" });
});

// =========================================================
// ROTA ULTRA LEVE: LÊ LISTAS GIGANTES SEM ESTOURAR A MEMÓRIA
// =========================================================
app.get('/get-canais', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Falta a URL da lista" });

  try {
    console.log(`Baixando lista gigante via STREAM: ${url}`);
    
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error("Erro ao baixar a lista do provedor");

    const canais = [];
    const filmes = [];
    const series = [];
    
    let currentItem = {};

    // Aqui está a mágica: Ele lê a lista enquanto ela ainda está sendo baixada!
    const rl = readline.createInterface({
      input: response.body, // Puxa o fluxo direto da internet
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('#EXTINF:')) {
        // Pega o Grupo
        const groupMatch = trimmedLine.match(/group-title="([^"]+)"/i) || trimmedLine.match(/group-title='([^']+)'/i);
        const category = groupMatch ? groupMatch[1] : 'Sem Categoria';

        // Pega a Logo
        const logoMatch = trimmedLine.match(/tvg-logo="([^"]+)"/i) || trimmedLine.match(/tvg-logo='([^']+)'/i);
        const poster = logoMatch ? logoMatch[1] : null;

        // Pega o Nome
        const nameSplit = trimmedLine.split(',');
        const name = nameSplit.length > 1 ? nameSplit[nameSplit.length - 1].trim() : 'Desconhecido';

        currentItem = { 
          name, 
          tvg: { logo: poster }, 
          group: { title: category } 
        };
      } 
      else if (trimmedLine.startsWith('http') && currentItem.name) {
        currentItem.url = trimmedLine;
        
        // Separação em tempo real
        const groupTitle = (currentItem.group.title || "").toLowerCase();
        
        if (groupTitle.includes('serie') || groupTitle.includes('série') || groupTitle.includes('season')) {
          series.push(currentItem);
        } else if (groupTitle.includes('filme') || groupTitle.includes('vod') || groupTitle.includes('cinema') || groupTitle.includes('lançamento')) {
          filmes.push(currentItem);
        } else {
          canais.push(currentItem);
        }
        
        currentItem = {}; // Limpa a variável para o próximo link
      }
    }

    console.log(`Processamento concluído! Canais: ${canais.length} | Filmes: ${filmes.length} | Séries: ${series.length}`);

    res.status(200).json({
      success: true,
      dados: { canais, filmes, series }
    });

  } catch (e) {
    console.error("Erro ao processar lista gigante:", e);
    res.status(500).json({ error: "Erro ao processar lista. Servidor sobrecarregado." });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));