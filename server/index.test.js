import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startServer } from './index.js';

async function useServer() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yonggi-'));
  const started = await startServer({
    dataFile: path.join(directory, 'library.json'),
    port: 0,
    host: '127.0.0.1',
    adminPassword: 'yonggi1234',
  });
  return started;
}

async function request(base, route, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  return { status: response.status, data };
}

test('students set a pin, write, edit, and keep the story on their own shelf', async () => {
  const started = await useServer();
  try {
    const listed = await request(started.url, '/api/students');
    assert.equal(listed.status, 200);
    assert.deepEqual(listed.data.students.map((student) => student.name), [
      '노지호', '안이정', '윤설', '이서하', '이은우',
    ]);
    assert.equal(listed.data.students.every((student) => student.hasPassword === false), true);

    const tooShort = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'nojiho', password: '12' },
    });
    assert.equal(tooShort.status, 400);

    const setup = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'nojiho', password: '1357' },
    });
    assert.equal(setup.status, 200);
    assert.equal(setup.data.student.name, '노지호');
    assert.equal(JSON.stringify(setup.data).includes('1357'), false);

    const again = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'nojiho', password: '2468' },
    });
    assert.equal(again.status, 409);

    const wrong = await request(started.url, '/api/auth/login', {
      method: 'POST',
      body: { studentId: 'nojiho', password: '9999' },
    });
    assert.equal(wrong.status, 401);

    const login = await request(started.url, '/api/auth/login', {
      method: 'POST',
      body: { studentId: 'nojiho', password: '1357' },
    });
    assert.equal(login.status, 200);
    const token = login.data.token;

    const empty = await request(started.url, '/api/books', {
      method: 'POST',
      token,
      body: { title: '   ', content: '재미있어요' },
    });
    assert.equal(empty.status, 400);

    const created = await request(started.url, '/api/books', {
      method: 'POST',
      token,
      body: { title: ' 콩쥐 팥쥐 ', content: ' 용기가 생겼어요. ' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.data.book.title, '콩쥐 팥쥐');
    assert.equal(created.data.books.length, 1);

    const updated = await request(started.url, `/api/books/${created.data.book.id}`, {
      method: 'PUT',
      token,
      body: { title: '콩쥐팥쥐', content: '다시 읽고 싶어요.' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.data.book.content, '다시 읽고 싶어요.');
    assert.notEqual(updated.data.book.updatedAt, updated.data.book.createdAt);

    const other = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'yoonseol', password: '1212' },
    });
    const stolen = await request(started.url, `/api/books/${created.data.book.id}`, {
      method: 'PUT',
      token: other.data.token,
      body: { title: '다른 책', content: '못 바꿔요' },
    });
    assert.equal(stolen.status, 404);

    const mine = await request(started.url, '/api/me', { token: other.data.token });
    assert.equal(mine.data.books.length, 0);
  } finally {
    await started.close();
  }
});

test('admin can see pins, last visit, stories, and reset a password', async () => {
  const started = await useServer();
  try {
    const setup = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'leeseoha', password: '8080' },
    });
    await request(started.url, '/api/books', {
      method: 'POST',
      token: setup.data.token,
      body: { title: '도서관에 간 날', content: '조용해서 좋았어요.' },
    });

    const denied = await request(started.url, '/api/admin/overview', { token: setup.data.token });
    assert.equal(denied.status, 401);

    const badAdmin = await request(started.url, '/api/admin/login', {
      method: 'POST',
      body: { password: 'nope' },
    });
    assert.equal(badAdmin.status, 401);

    const admin = await request(started.url, '/api/admin/login', {
      method: 'POST',
      body: { password: 'yonggi1234' },
    });
    assert.equal(admin.status, 200);
    const seoha = admin.data.overview.students.find((student) => student.id === 'leeseoha');
    assert.equal(seoha.password, '8080');
    assert.ok(seoha.lastLoginAt);
    assert.equal(seoha.books[0].title, '도서관에 간 날');
    assert.equal(admin.data.overview.students.find((student) => student.id === 'leeeunwoo').password, null);

    const reset = await request(started.url, '/api/admin/reset-password', {
      method: 'POST',
      token: admin.data.token,
      body: { studentId: 'leeseoha' },
    });
    assert.equal(reset.status, 200);
    const cleared = reset.data.overview.students.find((student) => student.id === 'leeseoha');
    assert.equal(cleared.password, null);
    assert.equal(cleared.books.length, 1);

    const expired = await request(started.url, '/api/me', { token: setup.data.token });
    assert.equal(expired.status, 401);

    const changed = await request(started.url, '/api/admin/password', {
      method: 'POST',
      token: admin.data.token,
      body: { currentPassword: 'yonggi1234', newPassword: 'class-room' },
    });
    assert.equal(changed.status, 200);
    assert.equal(changed.data.overview.adminPasswordIsInitial, false);

    const oldPassword = await request(started.url, '/api/admin/login', {
      method: 'POST',
      body: { password: 'yonggi1234' },
    });
    assert.equal(oldPassword.status, 401);
    const nextPassword = await request(started.url, '/api/admin/login', {
      method: 'POST',
      body: { password: 'class-room' },
    });
    assert.equal(nextPassword.status, 200);
  } finally {
    await started.close();
  }
});

test('fifty books stay on the first shelf and later books follow', async () => {
  const started = await useServer();
  try {
    const setup = await request(started.url, '/api/auth/setup', {
      method: 'POST',
      body: { studentId: 'ahniejeong', password: '0000' },
    });
    let latest = null;
    for (let index = 0; index < 51; index += 1) {
      latest = await request(started.url, '/api/books', {
        method: 'POST',
        token: setup.data.token,
        body: { title: `책 ${index + 1}`, content: `${index + 1}번째 독후감` },
      });
      assert.equal(latest.status, 201);
    }
    assert.equal(latest.data.books.length, 51);
    assert.equal(latest.data.books[0].title, '책 1');
    assert.equal(latest.data.books[50].title, '책 51');
  } finally {
    await started.close();
  }
});
