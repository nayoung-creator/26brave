import { useEffect, useRef, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import PinPad, { PinDots } from '../components/PinPad.jsx';
import { PIN_LENGTH } from '../../shared/constants.js';
import { studentMeta } from '../../shared/students.js';

export default function PinScreen({ student, mode, onBack, onSetup, onLogin, onNeedLogin }) {
  const meta = studentMeta(student.id);
  const [step, setStep] = useState(1);
  const [firstPin, setFirstPin] = useState('');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    setDigits('');
    setStep(1);
    setFirstPin('');
  }, [mode]);

  function bump(message) {
    setError(message);
    setShake(true);
    setDigits('');
  }

  async function submit(pin) {
    if (mode === 'login') {
      setBusy(true);
      try {
        await onLogin(pin);
      } catch (err) {
        if (err.status === 409) onNeedLogin?.();
        bump(err.message);
        setBusy(false);
      }
      return;
    }

    if (step === 1) {
      setFirstPin(pin);
      setDigits('');
      setStep(2);
      setError('');
      return;
    }

    if (pin !== firstPin) {
      setFirstPin('');
      setStep(1);
      bump('번호가 달라요. 처음부터 다시 눌러 주세요.');
      return;
    }

    setBusy(true);
    try {
      await onSetup(pin);
    } catch (err) {
      setFirstPin('');
      setStep(1);
      if (err.status === 409) onNeedLogin?.();
      bump(err.message);
      setBusy(false);
    }
  }

  function press(digit) {
    if (busy || digits.length >= PIN_LENGTH) return;
    const next = `${digits}${digit}`;
    setDigits(next);
    setError('');
    if (next.length === PIN_LENGTH) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => submit(next), 180);
    }
  }

  function backspace() {
    if (busy) return;
    window.clearTimeout(timer.current);
    setDigits((current) => current.slice(0, -1));
  }

  const heading = mode === 'login'
    ? '비밀번호 4자리를 눌러 주세요'
    : step === 1
      ? '숫자 4자리를 눌러 비밀번호를 만들어요'
      : '같은 번호를 한 번 더 눌러 주세요';

  return (
    <section className="screen">
      <div className="screen-scroll pin-screen">
        <button type="button" className="text-button back-link" onClick={onBack}>이름 다시 고르기</button>
        <Avatar animal={meta.animal} color={meta.color} size={84} />
        <h1 className="pin-name">{student.name}</h1>
        <p className="pin-heading">{heading}</p>
        <PinDots
          filled={digits.length}
          total={PIN_LENGTH}
          shake={shake}
          onShakeEnd={() => setShake(false)}
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <PinPad disabled={busy} onDigit={press} onBackspace={backspace} />
      </div>
    </section>
  );
}
