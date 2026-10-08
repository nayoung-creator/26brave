import { BOOKS_PER_ROW, BOOKS_PER_SHELF } from '../../shared/constants.js';
import { spineIndex } from '../../shared/shelf.js';
import { SPINES, themeForShelf } from '../themes.js';

function BookSpine({ book, number, fresh, onOpen }) {
  const spine = SPINES[spineIndex(book.id, SPINES.length)];
  return (
    <button
      type="button"
      className={`book ${fresh ? 'is-new' : ''}`}
      data-book-id={book.id}
      style={{ backgroundColor: spine.bg, color: spine.fg }}
      onClick={() => onOpen(book)}
      aria-label={`${book.title} 독후감 보기`}
    >
      <span className="book-title">{book.title}</span>
      <span className="book-no">{number}</span>
    </button>
  );
}

export default function Bookshelf({
  books,
  shelfIndex,
  freshId,
  onOpen,
  caseRef,
  connected = false,
}) {
  const theme = themeForShelf(shelfIndex);
  const rowCount = BOOKS_PER_SHELF / BOOKS_PER_ROW;
  const rows = Array.from({ length: rowCount }, (_, row) => {
    const start = row * BOOKS_PER_ROW;
    return Array.from({ length: BOOKS_PER_ROW }, (__, column) => books[start + column] || null);
  });
  const full = books.length === BOOKS_PER_SHELF;

  return (
    <section
      id={`shelf-${shelfIndex}`}
      ref={caseRef}
      className={`bookcase theme-${theme.id}`}
      aria-label={`${shelfIndex + 1}번째 ${theme.name}`}
    >
      <div className="bookcase-label">
        <h2>{shelfIndex + 1}번째 · {theme.name}</h2>
        <span>{books.length}/{BOOKS_PER_SHELF}권</span>
      </div>
      {connected && <p className="shelf-connect">위로 밀면 지난 책장이 이어져요</p>}
      <div className="shelf-progress" aria-hidden="true">
        <span style={{ width: `${(books.length / BOOKS_PER_SHELF) * 100}%` }} />
      </div>
      <div className="bookcase-body">
        {books.length === 0 && (
          <p className="shelf-empty-note">
            {shelfIndex === 0
              ? '아직 꽂힌 책이 없어요.\n독후감을 쓰면 이 칸에 책이 생겨요.'
              : '새 책장이에요.\n앞에서 50권을 다 채웠어요.'}
          </p>
        )}
        {rows.map((slots, rowIndex) => {
          const hasBooks = slots.some(Boolean);
          return (
            <div key={rowIndex} className={`shelf-row ${hasBooks ? 'has-books' : 'is-empty'}`}>
              {hasBooks && slots.map((book, column) => (
                book ? (
                  <BookSpine
                    key={book.id}
                    book={book}
                    number={rowIndex * BOOKS_PER_ROW + column + 1}
                    fresh={book.id === freshId}
                    onOpen={onOpen}
                  />
                ) : (
                  <div key={`empty-${column}`} className="book-ghost" />
                )
              ))}
            </div>
          );
        })}
        {full && <p className="shelf-full-note">50권이 모두 꽂혔어요</p>}
      </div>
    </section>
  );
}
