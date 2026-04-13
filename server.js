const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const readline = require('readline'); // Ferramenta nativa do Node para ler linha por linha sem gastar memória

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
// DEFINA O SEU IP AQUI PARA O FILTRO MÁGICO
const MEU_IP = '192.168.1.3';

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

    const rl = readline.createInterface({
      input: response.body,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith('#EXTINF:')) {
        const groupMatch = trimmedLine.match(/group-title="([^"]+)"/i) || trimmedLine.match(/group-title='([^']+)'/i);
        const category = groupMatch ? groupMatch[1] : 'Sem Categoria';

        const logoMatch = trimmedLine.match(/tvg-logo="([^"]+)"/i) || trimmedLine.match(/tvg-logo='([^']+)'/i);
        const poster = logoMatch ? logoMatch[1] : null;

        const nameSplit = trimmedLine.split(',');
        const name = nameSplit.length > 1 ? nameSplit[nameSplit.length - 1].trim() : 'Desconhecido';

        currentItem = { 
          name, 
          tvg: { logo: poster }, 
          group: { title: category } 
        };
      } 
      else if (trimmedLine.startsWith('http') && currentItem.name) {
        
        // ✅ AQUI ESTÁ A CORREÇÃO DO LOCALHOST!
        // Se a lista vier com "localhost", trocamos imediatamente pelo IP do seu PC
        let urlCorrigida = trimmedLine;
        if (urlCorrigida.includes('localhost') || urlCorrigida.includes('127.0.0.1')) {
            urlCorrigida = urlCorrigida.replace(/localhost|127\.0\.0\.1/g, MEU_IP);
        }
        
        currentItem.url = urlCorrigida;
        
        const groupTitle = (currentItem.group.title || "").toLowerCase();
        
        if (groupTitle.includes('serie') || groupTitle.includes('série') || groupTitle.includes('season')) {
          series.push(currentItem);
        } else if (groupTitle.includes('filme') || groupTitle.includes('vod') || groupTitle.includes('cinema') || groupTitle.includes('lançamento')) {
          filmes.push(currentItem);
        } else {
          // canais.push(currentItem);
        }
        
        currentItem = {};
      }
    }

    console.log(`Processamento concluído! Canais ignorados: ${canais.length} | Filmes: ${filmes.length} | Séries: ${series.length}`);

    res.status(200).json({
      success: true,
      dados: { filmes, series }
    });

  } catch (e) {
    console.error("Erro ao processar lista gigante:", e);
    res.status(500).json({ error: "Erro ao processar lista. Servidor sobrecarregado." });
  }
});

// =========================================================
// PROXY DE VÍDEO PROFISSIONAL 💥
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

// ✅ AQUI ESTÁ A SEGUNDA CORREÇÃO: O '0.0.0.0' liberta o servidor para a rede!
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acessível na rede local em: http://${MEU_IP}:${PORT}`);
});