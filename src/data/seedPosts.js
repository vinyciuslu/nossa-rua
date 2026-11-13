import { createRng } from '../domain/random.js'
import { CITIES } from '../domain/places.js'
import { HOURS } from '../domain/relativeTime.js'

/**
 * Publicações fictícias que povoam o app (relatos, avisos e comércio).
 *
 * Tudo aqui é inventado e genérico de propósito: não cita ruas, empresas nem
 * ocorrências reais. O bairro é real só para o app funcionar; o conteúdo, não.
 * Cada bairro usa um gerador com semente própria: mesmo bairro, mesmas
 * publicações, sempre. As datas são relativas a `epochMs` (o momento em que
 * este aparelho abriu o app pela primeira vez), então avançar o relógio de
 * demonstração envelhece as publicações.
 */

const REPORT_TEMPLATES = {
  road: [
    [
      'Buraco grande na via principal',
      'O buraco aumenta a cada chuva e os carros desviam para a outra faixa. Já causou susto em quem passa de moto.',
    ],
    [
      'Asfalto afundando perto da praça',
      'O pavimento cedeu e a água da chuva se acumula no local, formando uma poça funda.',
    ],
    [
      'Cratera depois das últimas chuvas',
      'Abriu uma cratera no meio da rua. Os vizinhos colocaram galhos para sinalizar.',
    ],
  ],
  lighting: [
    [
      'Poste apagado há dias',
      'O poste da esquina está apagado há mais de uma semana e a rua fica muito escura à noite.',
    ],
    [
      'Rua escura na saída do ponto de ônibus',
      'Várias lâmpadas queimadas no trecho. Quem volta tarde do trabalho caminha no escuro.',
    ],
    [
      'Lâmpadas queimadas na praça',
      'Metade da iluminação da praça não acende, e o local fica deserto ao anoitecer.',
    ],
  ],
  cleaning: [
    [
      'Lixo acumulado na calçada',
      'O lixo se acumula perto do ponto e atrai ratos e insetos. A coleta parece não estar passando.',
    ],
    [
      'Caçamba transbordando',
      'A caçamba está cheia há dias e o entulho já ocupa parte da calçada.',
    ],
    [
      'Entulho jogado em terreno vazio',
      'Descartam entulho e móveis velhos no terreno ao lado, e o mato cresce em volta.',
    ],
  ],
  tree: [
    [
      'Árvore inclinada sobre a calçada',
      'A árvore se inclinou depois do vento forte e pode cair em quem passa.',
    ],
    [
      'Galhos grandes prestes a cair',
      'Há galhos secos e pesados sobre a fiação e sobre o ponto de ônibus.',
    ],
    [
      'Árvore caída bloqueia a passagem',
      'Uma árvore caiu e ocupa metade da calçada. Pedestres precisam descer para a rua.',
    ],
  ],
  flooding: [
    [
      'Bueiro entupido alaga a rua',
      'Sempre que chove, o bueiro transborda e a água invade a calçada e as garagens.',
    ],
    [
      'Água acumulada depois da chuva',
      'A água fica parada por horas no cruzamento e atrapalha ônibus e pedestres.',
    ],
  ],
  signal: [
    [
      'Semáforo apagado no cruzamento',
      'O semáforo não funciona e o cruzamento ficou perigoso, principalmente no horário de pico.',
    ],
    [
      'Tempo curto para pedestres atravessarem',
      'O sinal fecha antes de idosos e crianças terminarem a travessia.',
    ],
  ],
  sidewalk: [
    [
      'Calçada quebrada e irregular',
      'Os buracos e o desnível dificultam a passagem de cadeiras de rodas e carrinhos de bebê.',
    ],
    [
      'Calçada tomada por raízes',
      'As raízes levantaram o piso e já houve tropeços de moradores.',
    ],
  ],
}

const NOTICE_TEMPLATES = [
  {
    level: 'urgent',
    title: 'Previsão de chuva forte nas próximas horas',
    description:
      'Evite áreas que costumam alagar e não atravesse ruas com água acumulada. Procure um local seguro se o tempo piorar.',
  },
  {
    level: 'attention',
    title: 'Coleta de lixo com horário alterado',
    description:
      'Neste fim de semana a coleta passa mais tarde que o normal. Deixe o lixo na calçada só perto do horário.',
  },
  {
    level: 'attention',
    title: 'Obra pode interditar parte da rua',
    description:
      'Uma obra programada pode fechar uma faixa durante o dia. Planeje o trajeto com antecedência.',
  },
  {
    level: 'info',
    title: 'Mutirão de limpeza da praça no sábado',
    description:
      'Moradores e voluntários se reúnem pela manhã para limpar e plantar mudas. Quem quiser pode participar.',
  },
  {
    level: 'info',
    title: 'Campanha de vacinação no posto do bairro',
    description:
      'O posto estende o atendimento neste fim de semana. Leve a caderneta de vacinação.',
  },
]

const COMMERCIAL_TEMPLATES = [
  [
    'Padaria Exemplo',
    'Pão quentinho às 6h',
    'Todos os dias, pão francês quentinho a partir das 6h. Na compra de 10, o décimo é por conta da casa.',
  ],
  [
    'Mercadinho Modelo',
    'Ofertas de hortifruti na quarta',
    'Quarta é dia de feira no mercadinho: frutas, verduras e legumes com preço especial.',
  ],
  [
    'Pet Shop Demonstração',
    'Banho e tosa com horário marcado',
    'Agende o banho e a tosa do seu pet e ganhe uma escovação de dentes.',
  ],
  [
    'Café Ficção',
    'Café com bolo no fim da tarde',
    'Das 16h às 18h, café com fatia de bolo a preço combinado.',
  ],
  [
    'Academia Protótipo',
    'Aula experimental gratuita',
    'Venha conhecer o espaço com uma aula experimental, sem compromisso.',
  ],
]

const pick = (rng, list) => list[Math.floor(rng() * list.length)]
const slugId = (neighborhoodId) => neighborhoodId.replace(/\//g, '-')

function reportsFor(neighborhood, rng, epochMs) {
  const categories = Object.keys(REPORT_TEMPLATES)
  const count = 3 + Math.floor(rng() * 3) // 3 a 5
  return Array.from({ length: count }, (_, i) => {
    const category = pick(rng, categories)
    const [title, description] = pick(rng, REPORT_TEMPLATES[category])
    const ageHours = 1 + rng() * 6 * 24 // de 1 h a 6 dias
    return {
      id: `seed-${slugId(neighborhood.id)}-r${i + 1}`,
      type: 'report',
      neighborhoodId: neighborhood.id,
      createdAt: new Date(epochMs - ageHours * HOURS).toISOString(),
      title,
      description,
      category,
      baseSupports: Math.floor(rng() * 45),
    }
  })
}

function noticeFor(neighborhood, rng, epochMs) {
  if (rng() < 0.4) return []
  const t = pick(rng, NOTICE_TEMPLATES)
  return [
    {
      id: `seed-${slugId(neighborhood.id)}-n1`,
      type: 'notice',
      neighborhoodId: neighborhood.id,
      createdAt: new Date(epochMs - (1 + rng() * 40) * HOURS).toISOString(),
      title: t.title,
      description: t.description,
      level: t.level,
      source: 'moderation',
    },
  ]
}

function commercialFor(neighborhood, rng, epochMs) {
  if (rng() < 0.35) return []
  const [businessName, title, description] = pick(rng, COMMERCIAL_TEMPLATES)
  return [
    {
      id: `seed-${slugId(neighborhood.id)}-c1`,
      type: 'commercial',
      neighborhoodId: neighborhood.id,
      createdAt: new Date(epochMs - (3 + rng() * 60) * HOURS).toISOString(),
      title,
      description,
      businessName,
    },
  ]
}

/** Todas as publicações simuladas de todos os bairros do catálogo. */
export function generateSeedPosts(epochMs) {
  return CITIES.flatMap((city) => city.neighborhoods).flatMap((neighborhood) => {
    const rng = createRng(`seed:${neighborhood.id}`)
    return [
      ...reportsFor(neighborhood, rng, epochMs),
      ...noticeFor(neighborhood, rng, epochMs),
      ...commercialFor(neighborhood, rng, epochMs),
    ]
  })
}
