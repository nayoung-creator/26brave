import { useState } from 'react';
import BookSheet from '../components/BookSheet.jsx';
import Bookshelf from '../components/Bookshelf.jsx';
import { EXAMPLE_BOOK } from '../../shared/exampleBook.js';

export default function ExampleScreen({ onBack }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="screen">
      <header className="topbar">
        <div>
          <p className="eyebrow">학생에게 보여 주는 화면</p>
          <h1>예시 독후감</h1>
        </div>
        <button type="button" className="text-button" onClick={onBack}>돌아가기</button>
      </header>
      <div className="screen-scroll example-scroll">
        <p className="admin-banner">비밀번호는 나오지 않아요. 이 화면은 친구들 앞에서 켜도 괜찮아요.</p>
        <article className="example-paper">
          <p className="eyebrow">그림책</p>
          <h2>{EXAMPLE_BOOK.title}</h2>
          <p className="book-body example-body">{EXAMPLE_BOOK.content}</p>
        </article>
        <p className="example-shelf-label">책장에는 이렇게 꽂혀요. 책을 누르면 글을 다시 볼 수 있어요.</p>
        <div className="library-wall example-wall">
          <Bookshelf
            books={[EXAMPLE_BOOK]}
            shelfIndex={0}
            onOpen={() => setOpen(true)}
          />
        </div>
      </div>
      {open && (
        <BookSheet
          mode="view"
          book={EXAMPLE_BOOK}
          allowEdit={false}
          eyebrow="예시"
          onClose={() => setOpen(false)}
          onSubmit={() => {}}
        />
      )}
    </section>
  );
}
