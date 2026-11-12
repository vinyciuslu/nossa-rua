/**
 * Ilustrações próprias (SVG), usadas só onde cumprem função:
 *  - CategoryIllustration: imagem de reserva quando um relato ainda não tem foto.
 *    Sempre vem identificada como "Ilustração", para ninguém tomá-la por foto real.
 *  - EmptyIllustration: estados vazios.
 * As cores vêm dos tokens, então acompanham os modos de cor.
 */

function Frame({ label, children }) {
  return (
    <svg
      viewBox="0 0 320 180"
      role="img"
      aria-label={label}
      className="block h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="320" height="180" className="fill-primary-soft" />
      {children}
    </svg>
  )
}

function Road() {
  return (
    <>
      <rect y="120" width="320" height="60" className="fill-ink-muted" />
      <path
        d="M0 150h320"
        className="stroke-surface"
        strokeWidth="3"
        strokeDasharray="18 14"
      />
    </>
  )
}

const SCENES = {
  road: () => (
    <Frame label="Ilustração: buraco em uma rua">
      <Road />
      <ellipse cx="170" cy="146" rx="38" ry="12" className="fill-ink" />
      <ellipse cx="170" cy="144" rx="30" ry="8" className="fill-primary-ink" />
      <path d="M232 112l12 26h-24z" className="fill-accent" />
      <path d="M226 130h12" className="stroke-surface" strokeWidth="3" />
    </Frame>
  ),
  lighting: () => (
    <Frame label="Ilustração: poste de iluminação apagado">
      <rect y="130" width="320" height="50" className="fill-ink-muted" />
      <path
        d="M120 130V48h50"
        className="stroke-ink"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="160" y="44" width="30" height="12" rx="4" className="fill-ink" />
      <path
        d="M168 62l14 0M172 70l6 0"
        className="stroke-ink-muted"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M232 70l14 14m0-14l-14 14"
        className="stroke-danger"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Frame>
  ),
  cleaning: () => (
    <Frame label="Ilustração: lixeira transbordando">
      <rect y="130" width="320" height="50" className="fill-surface-warm" />
      <path d="M130 70h60l-8 62h-44z" className="fill-ink" />
      <rect x="124" y="62" width="72" height="9" rx="3" className="fill-primary-ink" />
      <circle cx="148" cy="56" r="10" className="fill-warn" />
      <circle cx="172" cy="52" r="12" className="fill-ok" />
      <circle cx="205" cy="128" r="7" className="fill-warn" />
      <circle cx="108" cy="130" r="6" className="fill-ok" />
    </Frame>
  ),
  tree: () => (
    <Frame label="Ilustração: árvore inclinada">
      <rect y="130" width="320" height="50" className="fill-surface-warm" />
      <path
        d="M160 132l14-62"
        className="stroke-ink"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="184" cy="56" r="34" className="fill-ok" />
      <circle cx="158" cy="68" r="24" className="fill-ok-ink" />
      <path
        d="M232 100l10 10m0-10l-10 10"
        className="stroke-danger"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Frame>
  ),
  generic: () => (
    <Frame label="Ilustração: rua da cidade">
      <Road />
      <path
        d="M160 130c-14-14-26-24-26-40a26 26 0 0 1 52 0c0 16-12 26-26 40z"
        className="fill-accent"
      />
      <circle cx="160" cy="90" r="9" className="fill-surface" />
    </Frame>
  ),
}

/** `category`: road | lighting | cleaning | tree | generic */
export function CategoryIllustration({ category = 'generic' }) {
  const Scene = SCENES[category] ?? SCENES.generic
  return <Scene />
}

export function EmptyIllustration() {
  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label="Ilustração: rua com um marcador de local"
      className="h-28 w-40"
    >
      <rect width="160" height="120" rx="20" className="fill-primary-soft" />
      <rect y="78" width="160" height="42" className="fill-ink-muted" />
      <path
        d="M0 99h160"
        className="stroke-surface"
        strokeWidth="3"
        strokeDasharray="14 10"
      />
      <path
        d="M80 84C68 72 58 64 58 48a22 22 0 0 1 44 0c0 16-10 24-22 36z"
        className="fill-primary"
      />
      <circle cx="80" cy="48" r="8" className="fill-surface" />
    </svg>
  )
}
