import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_MAX, PIN_LENGTH, TITLE_MAX } from '../shared/constants.js';
import { STUDENTS } from '../shared/students.js';

const SESSION_DAYS = 30;

export class StoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function emptyData(adminPassword) {
  return {
    adminPassword,
    adminPasswordIsInitial: true,
    students: STUDENTS.map((student) => ({
      id: student.id,
      name: student.name,
      password: null,
      lastLoginAt: null,
    })),
    books: [],
    sessions: [],
  };
}

function safeEqual(leftValue, rightValue) {
  const left = Buffer.from(String(leftValue));
  const right = Buffer.from(String(rightValue));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function requirePin(password) {
  if (typeof password !== 'string' || !new RegExp(`^\\d{${PIN_LENGTH}}$`).test(password)) {
    throw new StoreError(400, '숫자 4자리로 만들어 주세요.');
  }
}

function requireStory(value, { empty, tooLong, max }) {
  if (typeof value !== 'string') throw new StoreError(400, empty);
  const text = value.trim();
  if (!text) throw new StoreError(400, empty);
  if ([...text].length > max) throw new StoreError(400, tooLong);
  return text;
}

function publicStudent(student) {
  return { id: student.id, name: student.name };
}

function publicBook(book) {
  return {
    id: book.id,
    title: book.title,
    content: book.content,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

function booksFor(data, studentId) {
  return data.books
    .filter((book) => book.studentId === studentId)
    .sort((a, b) => {
      const delta = new Date(a.createdAt) - new Date(b.createdAt);
      if (delta !== 0) return delta;
      return a.id.localeCompare(b.id);
    })
    .map(publicBook);
}

function findStudent(data, studentId) {
  const student = data.students.find((item) => item.id === studentId);
  if (!student) throw new StoreError(404, '이름을 다시 골라 주세요.');
  return student;
}

function overview(data) {
  return {
    adminPasswordIsInitial: data.adminPasswordIsInitial,
    students: data.students.map((student) => ({
      id: student.id,
      name: student.name,
      password: student.password,
      lastLoginAt: student.lastLoginAt,
      books: booksFor(data, student.id),
    })),
  };
}

function pruneSessions(data) {
  const cutoff = Date.now() - SESSION_DAYS * 24 * 60 * 60 * 1000;
  data.sessions = data.sessions.filter((session) => new Date(session.createdAt).getTime() > cutoff);
}

function createSession(data, { role, studentId = null }) {
  pruneSessions(data);
  const token = crypto.randomBytes(24).toString('hex');
  data.sessions.push({
    token,
    role,
    studentId,
    createdAt: new Date().toISOString(),
  });
  return token;
}

export function createStore(filePath, { adminPassword = 'yonggi1234' } = {}) {
  function read() {
    if (!fs.existsSync(filePath)) {
      const created = emptyData(adminPassword);
      write(created);
      return created;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function write(data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temporary = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(data, null, 2));
    fs.renameSync(temporary, filePath);
  }

  function update(mutator) {
    const data = read();
    const result = mutator(data);
    write(data);
    return result;
  }

  function sessionView(data, session) {
    if (!session) return null;
    if (session.role === 'admin') {
      return { role: 'admin', overview: overview(data) };
    }
    const student = data.students.find((item) => item.id === session.studentId);
    if (!student) return null;
    return {
      role: 'student',
      student: publicStudent(student),
      books: booksFor(data, student.id),
    };
  }

  return {
    publicStudents() {
      const data = read();
      return data.students.map((student) => ({
        id: student.id,
        name: student.name,
        hasPassword: Boolean(student.password),
      }));
    },

    setupPassword(studentId, password) {
      requirePin(password);
      return update((data) => {
        const student = findStudent(data, studentId);
        if (student.password) {
          throw new StoreError(409, '이미 비밀번호가 있어요. 비밀번호를 눌러 들어와요.');
        }
        student.password = password;
        student.lastLoginAt = new Date().toISOString();
        const token = createSession(data, { role: 'student', studentId: student.id });
        return {
          token,
          student: publicStudent(student),
          books: booksFor(data, student.id),
        };
      });
    },

    loginStudent(studentId, password) {
      requirePin(password);
      return update((data) => {
        const student = findStudent(data, studentId);
        if (!student.password) {
          throw new StoreError(409, '아직 비밀번호가 없어요. 새로 만들어 주세요.');
        }
        if (!safeEqual(student.password, password)) {
          throw new StoreError(401, '비밀번호가 맞지 않아요. 다시 눌러 볼까요?');
        }
        student.lastLoginAt = new Date().toISOString();
        const token = createSession(data, { role: 'student', studentId: student.id });
        return {
          token,
          student: publicStudent(student),
          books: booksFor(data, student.id),
        };
      });
    },

    loginAdmin(password) {
      if (typeof password !== 'string' || !password.trim()) {
        throw new StoreError(400, '선생님 비밀번호를 적어 주세요.');
      }
      return update((data) => {
        if (!safeEqual(data.adminPassword, password)) {
          throw new StoreError(401, '비밀번호가 맞지 않아요.');
        }
        const token = createSession(data, { role: 'admin' });
        return { token, overview: overview(data) };
      });
    },

    getSession(token) {
      if (!token) return null;
      const data = read();
      const session = data.sessions.find((item) => item.token === token);
      return sessionView(data, session);
    },

    logout(token) {
      update((data) => {
        data.sessions = data.sessions.filter((session) => session.token !== token);
        return { ok: true };
      });
    },

    addBook(studentId, input) {
      const title = requireStory(input.title, {
        empty: '책 제목을 적어 주세요.',
        tooLong: `책 제목은 ${TITLE_MAX}글자까지 적을 수 있어요.`,
        max: TITLE_MAX,
      });
      const content = requireStory(input.content, {
        empty: '독후감을 적어 주세요.',
        tooLong: `독후감은 ${CONTENT_MAX}글자까지 적을 수 있어요.`,
        max: CONTENT_MAX,
      });
      return update((data) => {
        findStudent(data, studentId);
        const now = new Date().toISOString();
        const book = {
          id: `b_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`,
          studentId,
          title,
          content,
          createdAt: now,
          updatedAt: now,
        };
        data.books.push(book);
        return { book: publicBook(book), books: booksFor(data, studentId) };
      });
    },

    updateBook(studentId, bookId, input) {
      const title = requireStory(input.title, {
        empty: '책 제목을 적어 주세요.',
        tooLong: `책 제목은 ${TITLE_MAX}글자까지 적을 수 있어요.`,
        max: TITLE_MAX,
      });
      const content = requireStory(input.content, {
        empty: '독후감을 적어 주세요.',
        tooLong: `독후감은 ${CONTENT_MAX}글자까지 적을 수 있어요.`,
        max: CONTENT_MAX,
      });
      return update((data) => {
        const book = data.books.find((item) => item.id === bookId && item.studentId === studentId);
        if (!book) throw new StoreError(404, '책을 찾지 못했어요.');
        book.title = title;
        book.content = content;
        book.updatedAt = new Date().toISOString();
        return { book: publicBook(book), books: booksFor(data, studentId) };
      });
    },

    adminOverview() {
      return overview(read());
    },

    resetStudentPassword(studentId) {
      return update((data) => {
        const student = findStudent(data, studentId);
        student.password = null;
        data.sessions = data.sessions.filter((session) => session.studentId !== studentId);
        return overview(data);
      });
    },

    changeAdminPassword(currentPassword, newPassword) {
      if (typeof newPassword !== 'string' || newPassword.trim().length < 4) {
        throw new StoreError(400, '새 비밀번호는 4글자 이상으로 적어 주세요.');
      }
      return update((data) => {
        if (!safeEqual(data.adminPassword, currentPassword || '')) {
          throw new StoreError(401, '지금 비밀번호가 맞지 않아요.');
        }
        data.adminPassword = newPassword.trim();
        data.adminPasswordIsInitial = false;
        return { ok: true, overview: overview(data) };
      });
    },
  };
}
