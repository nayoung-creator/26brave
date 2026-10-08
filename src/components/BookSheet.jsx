import { useEffect, useState } from 'react';
import { CONTENT_MAX, TITLE_MAX } from '../../shared/constants.js';
import { formatDateTime } from '../format.js';

const SUGGESTIONS = ['재미있었어요.', '슬펐어요.', '용기가 생겼어요.', '또 읽고 싶어요.'];

export default function BookSheet({
  mode,
  book,
  allowEdit = true,
  eyebrow = '',
  onClose,
  onEdit,
  onSubmit,
}) {
  const writing = mode === 'create' || mode === 'edit';
  const [title, setTitle] = useState(book?.title || '');
  const [content, setContent] = useState(book?.content || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!writing) return undefined;
    const field = document.getElementById(mode === 'edit' ? 'book-content' : 'book-title');
    field?.focus();
    return undefined;
  }, [writing, mode]);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    if (!title.trim()) {
      setError('책 제목을 적어 주세요.');
      return;
    }
    if (!content.trim()) {
      setError('독후감을 적어 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ title: title.trim(), content: content.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  function addSuggestion(text) {
    setContent((current) => {
      const next = current.trim() ? `${current.trim()} ${text}` : text;
      return [...next].slice(0, CONTENT_MAX).join('');
    });
  }

  const edited = book && book.updatedAt && book.updatedAt !== book.createdAt;

  return (
    <div className="sheet-backdrop" role="presentation">
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-bar">
          <button type="button" className="text-button" onClick={onClose}>닫기</button>
          <h2 id="sheet-title">
            {mode === 'create' && '독후감 쓰기'}
            {mode === 'edit' && '독후감 수정'}
            {mode === 'view' && (allowEdit ? '내가 쓴 글' : '독후감')}
          </h2>
          <span className="sheet-bar-spacer" />
        </div>

        {mode === 'view' && book && (
          <article className="reader">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <p className="reader-date">{formatDateTime(book.createdAt)}</p>
            <h3 className="reader-title">{book.title}</h3>
            <p className="book-body">{book.content}</p>
            {edited && <p className="reader-edited">수정함 · {formatDateTime(book.updatedAt)}</p>}
            {allowEdit && (
              <button type="button" className="primary" onClick={onEdit}>수정하기</button>
            )}
          </article>
        )}

        {writing && (
          <form className="writer" onSubmit={save}>
            <label htmlFor="book-title">책 제목</label>
            <input
              id="book-title"
              value={title}
              maxLength={TITLE_MAX}
              placeholder="책 이름을 적어 주세요"
              onChange={(event) => setTitle(event.target.value)}
            />
            <label htmlFor="book-content">독후감</label>
            <textarea
              id="book-content"
              value={content}
              maxLength={CONTENT_MAX}
              placeholder="어떤 이야기가 있었나요?"
              onChange={(event) => setContent(event.target.value)}
            />
            {content.length > 600 && (
              <p className="counter">{content.length} / {CONTENT_MAX}</p>
            )}
            <p className="chip-label">이렇게 시작할 수도 있어요</p>
            <div className="chips">
              {SUGGESTIONS.map((text) => (
                <button key={text} type="button" className="chip" onClick={() => addSuggestion(text)}>
                  {text}
                </button>
              ))}
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="primary" disabled={saving}>
              {saving ? '저장하는 중...' : mode === 'edit' ? '수정해서 저장' : '책장에 꽂기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
