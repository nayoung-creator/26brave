import Avatar from '../components/Avatar.jsx';
import Dragon from '../components/Dragon.jsx';
import { studentMeta } from '../../shared/students.js';

export default function ResumeScreen({ session, onContinue, onSwitch }) {
  const student = session.role === 'student' ? session.student : null;
  const meta = student ? studentMeta(student.id) : null;

  return (
    <section className="screen">
      <div className="screen-scroll resume-screen">
        <div className="hero-mark">
          {meta ? <Avatar animal={meta.animal} color={meta.color} size={84} /> : <Dragon />}
        </div>
        <p className="eyebrow">2학년 용기반</p>
        <h1>{student ? `${student.name}의 책장` : '선생님 책장'}</h1>
        <p className="lede">
          {student
            ? '이 책장이 열려 있어요. 본인이 맞으면 이어서 들어가요.'
            : '선생님으로 들어와 있어요.'}
        </p>
        <button type="button" className="primary" onClick={onContinue}>이어서 들어가기</button>
        <button type="button" className="ghost" onClick={onSwitch}>다른 이름으로</button>
      </div>
    </section>
  );
}
