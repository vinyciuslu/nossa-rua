// Os tamanhos vêm de variáveis CSS (--icon-sm/md/lg), que o modo "ícones grandes"
// redefine. Por isso nenhum ícone do app recebe tamanho em pixels diretamente.
const SIZES = {
  sm: 'size-(--icon-sm)',
  md: 'size-(--icon-md)',
  lg: 'size-(--icon-lg)',
}

/** Envolve um ícone do Lucide. Ícones são decorativos: o texto ao lado os descreve. */
export function Icon({ icon: Glyph, size = 'md', className = '', ...props }) {
  return (
    <Glyph
      aria-hidden="true"
      focusable="false"
      strokeWidth={2.25}
      className={`${SIZES[size]} shrink-0 ${className}`}
      {...props}
    />
  )
}
