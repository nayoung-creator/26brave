export default function Dragon({ size = 88 }) {
  return (
    <svg className="dragon" width={size} height={size} viewBox="0 0 88 88" aria-hidden="true">
      <ellipse cx="44" cy="80" rx="22" ry="5" fill="rgba(90,40,10,0.12)" />
      <path d="M16 52c1-6 4-14 2-20 8 4 10 12 8 18" fill="#f0c36a" />
      <path d="M72 52c-1-6-4-14-2-20-8 4-10 12-8 18" fill="#f0c36a" />
      <path d="M20 46c2-20 12-30 24-30s22 10 24 30c2 16-8 28-24 28S18 62 20 46z" fill="#ef5a45" />
      <path d="M28 24c-6-12 2-18 8-12" fill="none" stroke="#ef5a45" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 24c6-12-2-18-8-12" fill="none" stroke="#ef5a45" strokeWidth="5" strokeLinecap="round" />
      <circle cx="28" cy="18" r="4" fill="#f0c36a" />
      <circle cx="60" cy="18" r="4" fill="#f0c36a" />
      <ellipse cx="44" cy="50" rx="16" ry="13" fill="#ffd7b0" />
      <circle cx="36" cy="48" r="3.2" fill="#2a2118" />
      <circle cx="52" cy="48" r="3.2" fill="#2a2118" />
      <circle cx="37.1" cy="46.9" r="1.1" fill="#fff" />
      <circle cx="53.1" cy="46.9" r="1.1" fill="#fff" />
      <ellipse cx="44" cy="56" rx="4.2" ry="3" fill="#d94a3c" />
      <path d="M37 62c2.6 3.4 11.4 3.4 14 0" fill="none" stroke="#2a2118" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
