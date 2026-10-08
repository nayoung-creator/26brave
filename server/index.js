import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import express from 'express';
import { createStore, StoreError } from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function sendError(res, error) {
  if (error instanceof StoreError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ message: '책장에 문제가 생겼어요.' });
}

const wrap = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (error) {
    sendError(res, error);
  }
};

function tokenFrom(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export function createApp(store) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  const attempts = new Map();

  function assertUnlocked(key) {
    const row = attempts.get(key);
    if (row && row.lockedUntil > Date.now()) {
      throw new StoreError(429, '잠깐 쉬었다가 다시 눌러 주세요.');
    }
  }

  function markFailure(key) {
    const row = attempts.get(key) || { fails: 0, lockedUntil: 0 };
    row.fails += 1;
    if (row.fails >= 8) {
      row.lockedUntil = Date.now() + 30_000;
      row.fails = 0;
    }
    attempts.set(key, row);
  }

  function markSuccess(key) {
    attempts.delete(key);
  }

  function requireRole(role) {
    return (req, res, next) => {
      const session = store.getSession(tokenFrom(req));
      if (!session || session.role !== role) {
        res.status(401).json({ message: '다시 들어와 주세요.' });
        return;
      }
      req.session = session;
      next();
    };
  }

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/students', wrap((req, res) => {
    res.json({ students: store.publicStudents() });
  }));

  app.post('/api/auth/setup', wrap((req, res) => {
    const studentId = req.body?.studentId;
    assertUnlocked(`student:${studentId}`);
    try {
      const result = store.setupPassword(studentId, req.body?.password);
      markSuccess(`student:${studentId}`);
      res.json(result);
    } catch (error) {
      if (error instanceof StoreError && error.status === 401) markFailure(`student:${studentId}`);
      throw error;
    }
  }));

  app.post('/api/auth/login', wrap((req, res) => {
    const studentId = req.body?.studentId;
    assertUnlocked(`student:${studentId}`);
    try {
      const result = store.loginStudent(studentId, req.body?.password);
      markSuccess(`student:${studentId}`);
      res.json(result);
    } catch (error) {
      if (error instanceof StoreError && error.status === 401) markFailure(`student:${studentId}`);
      throw error;
    }
  }));

  app.post('/api/admin/login', wrap((req, res) => {
    assertUnlocked('admin');
    try {
      const result = store.loginAdmin(req.body?.password);
      markSuccess('admin');
      res.json(result);
    } catch (error) {
      if (error instanceof StoreError && error.status === 401) markFailure('admin');
      throw error;
    }
  }));

  app.get('/api/me', (req, res) => {
    const session = store.getSession(tokenFrom(req));
    if (!session) {
      res.status(401).json({ message: '다시 들어와 주세요.' });
      return;
    }
    res.json(session);
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = tokenFrom(req);
    if (token) store.logout(token);
    res.json({ ok: true });
  });

  app.get('/api/books', requireRole('student'), (req, res) => {
    res.json({ books: req.session.books });
  });

  app.post('/api/books', requireRole('student'), wrap((req, res) => {
    res.status(201).json(store.addBook(req.session.student.id, req.body || {}));
  }));

  app.put('/api/books/:id', requireRole('student'), wrap((req, res) => {
    res.json(store.updateBook(req.session.student.id, req.params.id, req.body || {}));
  }));

  app.get('/api/admin/overview', requireRole('admin'), (req, res) => {
    res.json({ overview: store.adminOverview() });
  });

  app.post('/api/admin/reset-password', requireRole('admin'), wrap((req, res) => {
    res.json({ overview: store.resetStudentPassword(req.body?.studentId) });
  }));

  app.post('/api/admin/password', requireRole('admin'), wrap((req, res) => {
    res.json(store.changeAdminPassword(req.body?.currentPassword, req.body?.newPassword));
  }));

  app.use('/api', (req, res) => {
    res.status(404).json({ message: '없는 주소예요.' });
  });

  app.use((error, req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ message: '내용을 읽지 못했어요.' });
      return;
    }
    next(error);
  });

  const dist = path.join(root, 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  return app;
}

export function startServer({
  dataFile = path.join(root, 'data', 'library.json'),
  port = Number(process.env.PORT || 3000),
  host = '0.0.0.0',
  adminPassword = process.env.ADMIN_PASSWORD || 'yonggi1234',
} = {}) {
  const store = createStore(dataFile, { adminPassword });
  const app = createApp(store);
  return new Promise((resolve) => {
    const server = app.listen(port, host, () => {
      const address = server.address();
      resolve({
        server,
        store,
        port: address.port,
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  const port = Number(process.env.PORT || 3000);
  startServer({ port }).then(() => {
    const dist = path.join(root, 'dist');
    console.log(`용기반 독서기록장 http://0.0.0.0:${port}`);
    if (!fs.existsSync(dist)) {
      console.log('화면 파일이 없어요. npm run build 를 먼저 실행해 주세요.');
    }
  });
}
