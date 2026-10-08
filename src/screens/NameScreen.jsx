import Dragon from '../components/Dragon.jsx';
import Avatar from '../components/Avatar.jsx';
import { studentMeta } from '../../shared/students.js';

export default function NameScreen({ students, onSelect, onAdmin }) {
  return (
    <section className="screen">
      <div className="screen-scroll name-screen">
        <header className="hero">
          <div className="hero-mark">
            <Dragon />
          </div>
          <p className="eyebrow">2학년 용기반</p>
          <h1>우리 독서기록장</h1>
          <p className="lede">이름을 누르고 내 책장으로 들어가요.</p>
        </header>
        <div className="name-list">
          {students.map((student) => {
            const meta = studentMeta(student.id);
            return (
              <button
                key={student.id}
                type="button"
                className="name-card"
                style={{ '--accent': meta.color }}
                onClick={() => onSelect(student)}
              >
                <Avatar animal={meta.animal} color={meta.color} />
                <span className="name-card-text">
                  <span className="name-card-name">{student.name}</span>
                  <span className="name-card-hint">
                    {student.hasPassword ? '비밀번호로 들어가기' : '비밀번호 만들기'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" className="teacher-link" onClick={onAdmin}>선생님 입장</button>
      </div>
    </section>
  );
}
