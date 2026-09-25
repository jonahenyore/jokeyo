import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const baseContext = 'JOKEYO is een productconcept voor vijf echte, afzonderlijk uitklapbare sleutels in één compacte mechanische behuizing. Het concept is nog niet verkrijgbaar; doe geen definitieve claims over maten, materialen of productie.';

function fallback(messages = []) {
  const last = String(messages.at(-1)?.content || '').toLowerCase();
  if (last.includes('wat is') || last.includes('jokeyo')) return 'JOKEYO is een compacte sleutelhouder waarin vijf echte sleutels geïntegreerd kunnen worden. Je klapt alleen de sleutel uit die je nodig hebt.';
  if (last.includes('hoeveel') || last.includes('sleutel')) return 'Het huidige concept is ontworpen rond vijf afzonderlijke sleutels in één behuizing.';
  if (last.includes('groot') || last.includes('maat') || last.includes('afmet')) return 'De voorlopige conceptafmetingen zijn ongeveer 95 × 25 × 18 mm. Dit zijn geen definitieve productiespecificaties.';
  if (last.includes('vervang')) return 'Het ontwerp wordt ontwikkeld met het idee dat afzonderlijke sleutels conceptueel vervangbaar kunnen zijn, zonder de hele behuizing te vervangen.';
  if (last.includes('beschikbaar') || last.includes('koop') || last.includes('verkrijg')) return 'JOKEYO is momenteel een productconcept/prototype en nog niet verkrijgbaar.';
  return 'Interessante vraag. JOKEYO draait om vijf echte sleutels, een compact mechanisch systeem en een georganiseerde manier van dragen. Vraag gerust door over werking, design of het concept.';
}

async function chat(body) {
  const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : [];
  if (!process.env.AI_API_URL || !process.env.AI_API_KEY) {
    return { reply: fallback(messages), fallback: true };
  }

  const response = await fetch(process.env.AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${baseContext} Beantwoord in dezelfde taal als de gebruiker. Wees helder, premium en eerlijk over wat conceptueel is.` },
        ...messages
      ]
    })
  });

  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  const data = await response.json();
  return { reply: data.choices?.[0]?.message?.content || fallback(messages), fallback: false };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/chat') {
      let raw = '';
      for await (const chunk of req) raw += chunk;
      const payload = JSON.parse(raw || '{}');
      const result = await chat(payload);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method !== 'GET') {
      res.writeHead(405);
      res.end('Method not allowed');
      return;
    }

    const requestPath = req.url === '/' ? 'index.html' : req.url.split('?')[0];
    const safePath = normalize(requestPath).replace(/^([.][.][/\\])+/, '');
    const file = join(root, safePath);
    const content = await readFile(file);

    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream'
    });
    res.end(content);
  } catch (error) {
    if (req.url?.startsWith('/api/')) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Chat service temporarily unavailable.' }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`JOKEYO running on 0.0.0.0:${port}`);
});
