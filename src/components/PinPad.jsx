const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinDots({ filled, total, shake, onShakeEnd }) {
  return (
    <div className={`pin-dots ${shake ? 'shake' : ''}`} onAnimationEnd={onShakeEnd}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={`pin-dot ${index < filled ? 'on' : ''}`} />
      ))}
    </div>
  );
}

export default function PinPad({ disabled, onDigit, onBackspace }) {
  return (
    <div className="pin-pad" aria-label="비밀번호 숫자판">
      {KEYS.map((key) => (
        <button key={key} type="button" className="pin-key" disabled={disabled} onClick={() => onDigit(key)}>
          {key}
        </button>
      ))}
      <span />
      <button type="button" className="pin-key" disabled={disabled} onClick={() => onDigit('0')}>
        0
      </button>
      <button type="button" className="pin-key pin-key-muted" disabled={disabled} onClick={onBackspace} aria-label="한 자리 지우기">
        지움
      </button>
    </div>
  );
}
