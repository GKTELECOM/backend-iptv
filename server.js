const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("Servidor IPTV ONLINE 🚀");
});

app.get('/m3u', async (req, res) => {
  const { url } = req.query;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const text = await response.text();
    res.send(text);

  } catch (e) {
    res.status(500).send("Erro ao buscar lista");
  }
});

app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});