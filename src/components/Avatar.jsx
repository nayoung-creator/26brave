function Face({ animal, color }) {
  if (animal === 'fox') {
    return (
      <>
        <polygon points="14,30 24,8 32,28" fill={color} />
        <polygon points="50,30 40,8 32,28" fill={color} />
        <polygon points="18,24 24,12 28,24" fill="#ffe7c2" />
        <polygon points="46,24 40,12 36,24" fill="#ffe7c2" />
        <circle cx="32" cy="36" r="16" fill={color} />
        <ellipse cx="32" cy="40" rx="8" ry="6" fill="#fff4e4" />
        <circle cx="26" cy="34" r="2.2" fill="#2a2118" />
        <circle cx="38" cy="34" r="2.2" fill="#2a2118" />
        <circle cx="32" cy="39" r="1.6" fill="#2a2118" />
      </>
    );
  }
  if (animal === 'rabbit') {
    return (
      <>
        <ellipse cx="22" cy="20" rx="6" ry="14" fill={color} />
        <ellipse cx="42" cy="20" rx="6" ry="14" fill={color} />
        <ellipse cx="22" cy="20" rx="3" ry="9" fill="#ffd7e4" />
        <ellipse cx="42" cy="20" rx="3" ry="9" fill="#ffd7e4" />
        <circle cx="32" cy="40" r="16" fill={color} />
        <circle cx="26" cy="38" r="2.2" fill="#2a2118" />
        <circle cx="38" cy="38" r="2.2" fill="#2a2118" />
        <path d="M29 44c2 2 6 2 8 0" fill="none" stroke="#2a2118" strokeWidth="1.8" strokeLinecap="round" />
      </>
    );
  }
  if (animal === 'owl') {
    return (
      <>
        <polygon points="18,18 24,8 30,18" fill={color} />
        <polygon points="34,18 40,8 46,18" fill={color} />
        <ellipse cx="32" cy="38" rx="18" ry="16" fill={color} />
        <circle cx="25" cy="36" r="6" fill="#fff8ee" />
        <circle cx="39" cy="36" r="6" fill="#fff8ee" />
        <circle cx="25" cy="36" r="2.3" fill="#2a2118" />
        <circle cx="39" cy="36" r="2.3" fill="#2a2118" />
        <polygon points="32,40 28,45 36,45" fill="#e39b12" />
      </>
    );
  }
  if (animal === 'bear') {
    return (
      <>
        <circle cx="16" cy="22" r="8" fill={color} />
        <circle cx="48" cy="22" r="8" fill={color} />
        <circle cx="16" cy="22" r="4" fill="#ffd7b0" />
        <circle cx="48" cy="22" r="4" fill="#ffd7b0" />
        <circle cx="32" cy="38" r="18" fill={color} />
        <ellipse cx="32" cy="42" rx="8" ry="6" fill="#ffd7b0" />
        <circle cx="26" cy="36" r="2.2" fill="#2a2118" />
        <circle cx="38" cy="36" r="2.2" fill="#2a2118" />
        <ellipse cx="32" cy="41" rx="2.4" ry="1.8" fill="#2a2118" />
      </>
    );
  }
  return (
    <>
      <path d="M20 16c-4-8 2-12 6-8" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M44 16c4-8-2-12-6-8" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx="18" cy="12" r="3" fill="#f0c36a" />
      <circle cx="46" cy="12" r="3" fill="#f0c36a" />
      <circle cx="32" cy="38" r="18" fill={color} />
      <ellipse cx="32" cy="40" rx="10" ry="8" fill="#ffd7b0" />
      <circle cx="26" cy="36" r="2.2" fill="#2a2118" />
      <circle cx="38" cy="36" r="2.2" fill="#2a2118" />
      <path d="M28 44c2.2 2.4 7.8 2.4 10 0" fill="none" stroke="#2a2118" strokeWidth="1.8" strokeLinecap="round" />
    </>
  );
}

export default function Avatar({ animal, color, size = 64 }) {
  return (
    <svg className="avatar" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#fff8ee" />
      <Face animal={animal} color={color} />
    </svg>
  );
}
