import { useCallback, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken } from './api.js';
import BookSheet from './components/BookSheet.jsx';
import Dragon from './components/Dragon.jsx';
import AdminLoginScreen, { AdminScreen } from './screens/AdminScreen.jsx';
import ExampleScreen from './screens/ExampleScreen.jsx';
import NameScreen from './screens/NameScreen.jsx';
import PinScreen from './screens/PinScreen.jsx';
import ResumeScreen from './screens/ResumeScreen.jsx';
import ShelfScreen from './screens/ShelfScreen.jsx';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [session, setSession] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [adminBook, setAdminBook] = useState(null);
  const [notice, setNotice] = useState('');
  const [freshId, setFreshId] = useState(null);
  const [bootError, setBootError] = useState('');

  const loadStudents = useCallback(async () => {
    const data = await api('/api/students');
    setStudents(data.students);
    return data.students;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (getToken()) {
          const me = await api('/api/me');
          if (!alive) return;
          setSession(me);
          setScreen('resume');
          return;
        }
        await loadStudents();
        if (alive) setScreen('names');
      } catch (error) {
        if (!alive) return;
        clearToken();
        try {
          await loadStudents();
          if (alive) setScreen('names');
        } catch (loadError) {
          if (!alive) return;
          setBootError(loadError.message || error.message);
          setScreen('error');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadStudents]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function logout(message) {
    try {
      if (getToken()) await api('/api/auth/logout', { method: 'POST' });
    } catch {
      /* The session is already gone. */
    }
    clearToken();
    setSession(null);
    setSelected(null);
    setSheet(null);
    setAdminBook(null);
    setFreshId(null);
    if (message) setNotice(message);
    try {
      await loadStudents();
      setScreen('names');
    } catch (error) {
      setBootError(error.message);
      setScreen('error');
    }
  }

  async function guarded(action) {
    try {
      return await action();
    } catch (error) {
      if (error.status === 401) {
        await logout('다시 들어와 주세요.');
        return null;
      }
      throw error;
    }
  }

  function enterStudent(result) {
    setToken(result.token);
    setSession({ role: 'student', student: result.student, books: result.books });
    setFreshId(null);
    setScreen('shelf');
  }

  function rememberPassword(hasPassword) {
    setSelected((current) => (current ? { ...current, hasPassword } : current));
    setStudents((list) => list.map((student) => (
      student.id === selected?.id ? { ...student, hasPassword } : student
    )));
  }

  async function saveBook(input) {
    if (sheet?.mode === 'edit') {
      const result = await guarded(() => api(`/api/books/${sheet.book.id}`, {
        method: 'PUT',
        body: input,
      }));
      if (!result) return;
      setSession((current) => ({ ...current, books: result.books }));
      setSheet({ mode: 'view', book: result.book });
      setNotice('수정했어요.');
      return;
    }
    const result = await guarded(() => api('/api/books', { method: 'POST', body: input }));
    if (!result) return;
    setSession((current) => ({ ...current, books: result.books }));
    setFreshId(result.book.id);
    setSheet(null);
    setNotice('책장에 꽂았어요.');
  }

  return (
    <div className="app">
      {notice && <div className="toast" role="status">{notice}</div>}

      {screen === 'loading' && (
        <section className="screen">
          <div className="center-state">
            <Dragon />
            <p>책장을 열고 있어요</p>
          </div>
        </section>
      )}

      {screen === 'error' && (
        <section className="screen">
          <div className="center-state">
            <Dragon />
            <p>{bootError}</p>
            <button type="button" className="primary" onClick={() => window.location.reload()}>
              다시 열기
            </button>
          </div>
        </section>
      )}

      {screen === 'names' && (
        <NameScreen
          students={students}
          onSelect={(student) => {
            setSelected(student);
            setScreen('pin');
          }}
          onAdmin={() => setScreen('admin-login')}
        />
      )}

      {screen === 'pin' && selected && (
        <PinScreen
          student={selected}
          mode={selected.hasPassword ? 'login' : 'setup'}
          onBack={() => setScreen('names')}
          onSetup={enterStudent}
          onLogin={enterStudent}
          onNeedLogin={() => rememberPassword(!selected.hasPassword)}
        />
      )}

      {screen === 'resume' && session && (
        <ResumeScreen
          session={session}
          onContinue={() => setScreen(session.role === 'admin' ? 'admin' : 'shelf')}
          onSwitch={() => logout()}
        />
      )}

      {screen === 'shelf' && session?.role === 'student' && (
        <ShelfScreen
          student={session.student}
          books={session.books || []}
          freshId={freshId}
          onWrite={() => setSheet({ mode: 'create' })}
          onOpen={(book) => setSheet({ mode: 'view', book })}
          onLogout={() => logout()}
        />
      )}

      {screen === 'admin-login' && (
        <AdminLoginScreen
          onBack={() => setScreen('names')}
          onLogin={async (password) => {
            const result = await api('/api/admin/login', {
              method: 'POST',
              body: { password },
            });
            setToken(result.token);
            setSession({ role: 'admin', overview: result.overview });
            setScreen('admin');
          }}
        />
      )}

      {screen === 'admin' && session?.role === 'admin' && (
        <AdminScreen
          overview={session.overview}
          onLogout={() => logout()}
          onReset={async (studentId) => {
            const result = await guarded(() => api('/api/admin/reset-password', {
              method: 'POST',
              body: { studentId },
            }));
            if (!result) throw new Error('다시 들어와 주세요.');
            setSession((current) => ({ ...current, overview: result.overview }));
          }}
          onChangePassword={async (currentPassword, newPassword) => {
            const result = await guarded(() => api('/api/admin/password', {
              method: 'POST',
              body: { currentPassword, newPassword },
            }));
            if (!result) throw new Error('다시 들어와 주세요.');
            setSession((current) => ({ ...current, overview: result.overview }));
          }}
          onOpenBook={(student, book) => setAdminBook({ student, book })}
          onShowExample={() => setScreen('example')}
        />
      )}

      {screen === 'example' && <ExampleScreen onBack={() => setScreen('admin')} />}

      {sheet && screen === 'shelf' && (
        <BookSheet
          key={`${sheet.mode}-${sheet.book?.id || 'new'}`}
          mode={sheet.mode}
          book={sheet.book}
          onClose={() => setSheet(null)}
          onEdit={() => setSheet({ mode: 'edit', book: sheet.book })}
          onSubmit={saveBook}
        />
      )}

      {adminBook && (
        <BookSheet
          key={adminBook.book.id}
          mode="view"
          book={adminBook.book}
          allowEdit={false}
          eyebrow={adminBook.student.name}
          onClose={() => setAdminBook(null)}
          onSubmit={() => {}}
        />
      )}
    </div>
  );
}
