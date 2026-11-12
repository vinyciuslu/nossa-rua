// Modos de cor disponíveis. Os valores de cada modo ficam em src/index.css.
export const COLOR_MODES = [
  { id: 'default', label: 'Padrão', hint: 'Cores originais do app.' },
  {
    id: 'red-green',
    label: 'Vermelho-verde',
    hint: 'Para protanopia e deuteranopia: azul, âmbar e marrom-avermelhado.',
  },
  {
    id: 'blue-yellow',
    label: 'Azul-amarelo',
    hint: 'Para tritanopia: verde, magenta e vermelho.',
  },
  {
    id: 'high-contrast',
    label: 'Alto contraste',
    hint: 'Preto sobre branco, bordas e foco reforçados.',
  },
]
