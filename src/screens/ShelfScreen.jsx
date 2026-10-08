import { useEffect, useRef, useState } from 'react';
import Bookshelf from '../components/Bookshelf.jsx';
import { groupIntoShelves } from '../../shared/shelf.js';

export default function ShelfScreen({ student, books, freshId, onWrite, onOpen, onLogout }) {
  const scrollRef = useRef(null);
  const currentRef = useRef(null);
  const shelves = groupIntoShelves(books);
  const currentIndex = shelves.length - 1;
  const [seeingCurrent, setSeeingCurrent] = useState(true);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'start' });
  }, [student.id]);

  useEffect(() => {
    if (!freshId) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const book = scrollRef.current?.querySelector(`[data-book-id="${freshId}"]`);
      book?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [freshId]);

  useEffect(() => {
    const root = scrollRef.current;
    const target = currentRef.current;
    if (!root || !target) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setSeeingCurrent(entry.isIntersecting);
    }, { root, threshold: 0.25 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [currentIndex, books.length]);

  function scrollToShelf(index) {
    scrollRef.current?.querySelector(`#shelf-${index}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <section className="screen">
      <header className="topbar">
        <div>
          <p className="eyebrow">2학년 용기반</p>
          <h1>{student.name}의 책장</h1>
          <p>꽂힌 책 {books.length}권</p>
        </div>
        <button type="button" className="text-button" onClick={onLogout}>나가기</button>
      </header>
      <div className="library-scroll" ref={scrollRef}>
        <div className="library-wall">
          {shelves.map((shelfBooks, index) => (
            <Bookshelf
              key={`${student.id}-${index}`}
              books={shelfBooks}
              shelfIndex={index}
              freshId={freshId}
              onOpen={onOpen}
              connected={index === currentIndex && index > 0}
              caseRef={index === currentIndex ? currentRef : undefined}
            />
          ))}
        </div>
      </div>
      <div className="bottom-bar">
        {shelves.length > 1 && (
          <button
            type="button"
            className="ghost"
            onClick={() => scrollToShelf(seeingCurrent ? Math.max(currentIndex - 1, 0) : currentIndex)}
          >
            {seeingCurrent ? '지난 책장' : '지금 책장'}
          </button>
        )}
        <button type="button" className="primary" onClick={onWrite}>독후감 쓰기</button>
      </div>
    </section>
  );
}
