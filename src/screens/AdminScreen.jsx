import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import { formatDateTime } from '../format.js';
import { studentMeta } from '../../shared/students.js';

export default function AdminLoginScreen({ onBack, onLogin }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onLogin(password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <div className="screen-scroll admin-login">
        <button type="button" className="text-button back-link" onClick={onBack}>이름 고르기로</button>
        <p className="eyebrow">2학년 용기반</p>
        <h1>선생님 입장</h1>
        <p className="lede">선생님 비밀번호를 적어 주세요.</p>
        <form onSubmit={submit} className="writer">
          <label htmlFor="admin-password">비밀번호</label>
          <input
            id="admin-password"
            type={show ? 'text' : 'password'}
            value={password}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="button" className="text-button show-password" onClick={() => setShow((value) => !value)}>
            {show ? '비밀번호 가리기' : '비밀번호 보이기'}
          </button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '확인하는 중...' : '들어가기'}
          </button>
        </form>
      </div>
    </section>
  );
}

export function AdminScreen({ overview, onLogout, onReset, onChangePassword, onOpenBook }) {
  const [openId, setOpenId] = useState(null);
  const [pendingReset, setPendingReset] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function reset(studentId) {
    setBusy(true);
    setError('');
    try {
      await onReset(studentId);
      setPendingReset(null);
      setMessage('비밀번호를 지웠어요. 다음에 들어올 때 새로 만들어요.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (newPassword.trim().length < 4) {
      setError('새 비밀번호는 4글자 이상으로 적어 주세요.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 서로 달라요.');
      return;
    }
    setBusy(true);
    try {
      await onChangePassword(currentPassword, newPassword.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('선생님 비밀번호를 바꿨어요.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="screen">
      <header className="topbar">
        <div>
          <p className="eyebrow">2학년 용기반</p>
          <h1>선생님 책장</h1>
          <p>친구 5명의 기록</p>
        </div>
        <button type="button" className="text-button" onClick={onLogout}>나가기</button>
      </header>
      <div className="screen-scroll admin-scroll">
        {overview.adminPasswordIsInitial && (
          <p className="admin-banner">처음 비밀번호를 아직 쓰고 있어요. 아래쪽에서 바꿔 주세요.</p>
        )}
        {message && <p className="admin-message" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {overview.students.map((student) => {
          const meta = studentMeta(student.id);
          const opened = openId === student.id;
          const stories = [...student.books].reverse();
          return (
            <article key={student.id} className="admin-card">
              <div className="admin-person">
                <Avatar animal={meta.animal} color={meta.color} size={56} />
                <div>
                  <h2>{student.name}</h2>
                  <p>마지막 접속</p>
                  <p className="admin-time">{formatDateTime(student.lastLoginAt)}</p>
                </div>
              </div>
              <div className="admin-pin">
                <span>비밀번호</span>
                <strong>{student.password || '아직 없어요'}</strong>
              </div>
              {pendingReset === student.id ? (
                <div className="confirm-row">
                  <p>비밀번호를 지울까요? 독후감은 그대로 남아요.</p>
                  <div className="confirm-actions">
                    <button type="button" className="ghost" disabled={busy} onClick={() => setPendingReset(null)}>아니요</button>
                    <button type="button" className="primary" disabled={busy} onClick={() => reset(student.id)}>지울게요</button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="ghost"
                  disabled={!student.password || busy}
                  onClick={() => setPendingReset(student.id)}
                >
                  {student.password ? '비밀번호 초기화' : '비밀번호가 비어 있어요'}
                </button>
              )}
              <button
                type="button"
                className="text-button record-toggle"
                onClick={() => setOpenId(opened ? null : student.id)}
              >
                독후감 {student.books.length}편 {opened ? '접기' : '보기'}
              </button>
              {opened && (
                stories.length === 0 ? (
                  <p className="empty-records">아직 기록이 없어요.</p>
                ) : (
                  <ul className="admin-books">
                    {stories.map((book) => (
                      <li key={book.id}>
                        <button type="button" onClick={() => onOpenBook(student, book)}>
                          <span>{book.title}</span>
                          <small>{formatDateTime(book.createdAt)}</small>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </article>
          );
        })}

        <form className="admin-card writer" onSubmit={changePassword}>
          <h2>선생님 비밀번호 바꾸기</h2>
          <label htmlFor="current-password">지금 비밀번호</label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            autoComplete="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <label htmlFor="new-password">새 비밀번호</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            autoComplete="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <label htmlFor="confirm-password">새 비밀번호 한 번 더</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button type="submit" className="primary" disabled={busy}>바꾸기</button>
        </form>
      </div>
    </section>
  );
}
