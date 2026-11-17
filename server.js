const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const PORT = 3001;
const DB_PATH = path.join(__dirname, 'src', 'bd', 'db.json');
const TABLES = new Set(['usuarios', 'categorias', 'eventos', 'inscricoes', 'notificacoes']);

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8'); }
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': 'http://localhost:3000', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
  res.end(data === undefined ? '' : JSON.stringify(data));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const [, table, rawId] = url.pathname.split('/');
    if (!TABLES.has(table)) return send(res, 404, { erro: 'Recurso não encontrado' });
    const db = readDb();
    const rows = db[table];
    const id = rawId ? decodeURIComponent(rawId) : null;

    if (req.method === 'GET') {
      const found = id
        ? rows.find((row) => String(row.id) === id)
        : rows.filter((row) => [...url.searchParams.entries()].every(([key, value]) => String(row[key]) === value));
      if (id && !found) return send(res, 404, { erro: 'Registro não encontrado' });
      return send(res, 200, found);
    }

    if (req.method === 'POST' && !id) {
      const item = await body(req);
      if (!item.id) item.id = randomBytes(8).toString('base64url');
      if (rows.some((row) => String(row.id) === String(item.id))) return send(res, 409, { erro: 'ID já cadastrado' });
      rows.push(item); writeDb(db); return send(res, 201, item);
    }

    if (['PUT', 'PATCH'].includes(req.method) && id) {
      const index = rows.findIndex((row) => String(row.id) === id);
      if (index < 0) return send(res, 404, { erro: 'Registro não encontrado' });
      const changes = await body(req);
      rows[index] = req.method === 'PATCH' ? { ...rows[index], ...changes } : { ...changes, id: rows[index].id };
      writeDb(db); return send(res, 200, rows[index]);
    }

    if (req.method === 'DELETE' && id) {
      const index = rows.findIndex((row) => String(row.id) === id);
      if (index < 0) return send(res, 404, { erro: 'Registro não encontrado' });
      const [removed] = rows.splice(index, 1); writeDb(db); return send(res, 200, removed);
    }
    return send(res, 405, { erro: 'Método não permitido' });
  } catch (error) {
    return send(res, 400, { erro: error.message || 'Não foi possível processar a solicitação' });
  }
});

server.listen(PORT, () => console.log(`API GoEvent disponível em http://localhost:${PORT}`));
