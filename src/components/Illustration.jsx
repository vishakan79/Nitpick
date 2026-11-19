// A magnifying glass over lines of code, with pen marks. Drawn as SVG so it stays sharp.
export default function Illustration({ className = '' }) {
  const bars = [
    [28, 40, 150],
    [28, 62, 110],
    [48, 84, 170],
    [48, 106, 90],
    [48, 128, 140],
    [28, 150, 120],
    [28, 172, 180],
    [28, 194, 70],
  ]
  return (
    <svg viewBox="0 0 360 300" className={className} role="img" aria-label="A magnifying glass over lines of code with a red pen mark">
      <rect x="8" y="12" width="250" height="236" rx="10" fill="#FAFBFE" stroke="#0D1526" strokeWidth="2.5" />
      <rect x="8" y="12" width="250" height="26" rx="10" fill="#EEF1F7" stroke="#0D1526" strokeWidth="2.5" />
      <circle cx="26" cy="25" r="4" fill="#E4484F" />
      <circle cx="40" cy="25" r="4" fill="#FFD84A" />
      <circle cx="54" cy="25" r="4" fill="#157A52" />
      {bars.map(([x, y, w], i) => (
        <rect key={i} x={x} y={y + 12} width={w} height="9" rx="4.5" fill={i === 4 ? '#FFD84A' : '#D3D9E6'} />
      ))}
      <path d="M50 150q4-5 8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0" fill="none" stroke="#E4484F" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="226" cy="150" r="58" fill="#FFD84A" fillOpacity="0.28" stroke="#0D1526" strokeWidth="5" />
      <path d="M206 128a34 34 0 0 1 22-12" fill="none" stroke="#FAFBFE" strokeWidth="5" strokeLinecap="round" />
      <path d="M268 192l56 56" stroke="#0D1526" strokeWidth="16" strokeLinecap="round" />
      <path d="M268 192l56 56" stroke="#E4484F" strokeWidth="6" strokeLinecap="round" />
      <path d="M196 156l16 16 32-38" fill="none" stroke="#0D1526" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
