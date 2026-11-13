import { HOURS } from '../domain/relativeTime.js'

/**
 * Conteúdo estadual fictício: alertas, notícias e eventos.
 *
 * As três "fontes" abaixo NÃO existem. Os nomes foram inventados para que
 * ninguém confunda o protótipo com comunicação de um órgão real: nenhum alerta
 * daqui deve ser seguido de verdade. Os municípios são reais só para o filtro
 * por região funcionar.
 *
 * As datas são relativas a `epochMs` (a primeira abertura do app neste aparelho),
 * em horas: números negativos são "passado", positivos são "futuro". Assim o
 * relógio de demonstração faz alertas expirarem e eventos acontecerem.
 */

const SOURCES = {
  alerts: { id: 'central-alertas', name: 'Central Fictícia de Alertas' },
  news: { id: 'agencia-noticias', name: 'Agência Fictícia de Notícias' },
  culture: { id: 'rede-cultural', name: 'Rede Cultural Fictícia' },
  sports: { id: 'liga-esportiva', name: 'Liga Esportiva Fictícia' },
}

// [id, source, cityId, nível, publicado(h), expira(h), título, resumo]
const ALERTS = [
  [
    'a1',
    'alerts',
    null,
    'attention',
    -3,
    30,
    'Previsão de chuva forte em várias regiões',
    'Pancadas de chuva com rajadas de vento podem ocorrer à tarde e à noite. Evite áreas de alagamento e não estacione sob árvores.',
  ],
  [
    'a2',
    'alerts',
    'campinas',
    'urgent',
    -1,
    12,
    'Risco de alagamento em vias baixas',
    'Vias próximas a córregos podem alagar rapidamente. Evite atravessar trechos com água e procure um local alto se a água subir.',
  ],
  [
    'a3',
    'alerts',
    'santos',
    'info',
    -6,
    48,
    'Maré alta no fim de semana',
    'A maré fica acima do normal em alguns horários. Moradores da orla devem acompanhar os horários antes de sair com o carro.',
  ],
  [
    'a4',
    'alerts',
    'sao-paulo',
    'attention',
    -20,
    6,
    'Tempo seco e baixa umidade',
    'A umidade do ar deve ficar baixa à tarde. Beba água com frequência e evite atividades físicas intensas nas horas mais quentes.',
  ],
  [
    'a5',
    'alerts',
    'ribeirao-preto',
    'info',
    -2,
    72,
    'Queima controlada proibida no período',
    'O uso de fogo em terrenos e áreas de vegetação segue proibido. Não faça queimadas e não jogue bitucas de cigarro na vegetação.',
  ],
]

// [id, source, cityId, publicado(h), título, resumo, parágrafos]
const NEWS = [
  [
    'n1',
    'news',
    null,
    -5,
    'Mutirão de limpeza de bueiros chega a mais cidades',
    'A ação preventiva, anunciada antes do período de chuvas, amplia o número de bairros atendidos.',
    [
      'A programação do mutirão foi ampliada e agora inclui bairros de mais municípios. Equipes percorrem as ruas retirando folhas e lixo das bocas de lobo.',
      'Moradores podem ajudar não jogando lixo na rua e avisando, pelo Nossa Rua, quando um bueiro estiver entupido.',
    ],
  ],
  [
    'n2',
    'news',
    null,
    -28,
    'Calendário de vacinação de rotina é divulgado',
    'Postos de saúde seguem com horários ampliados em alguns dias da semana.',
    [
      'Quem está com a carteira de vacinação atrasada pode procurar o posto mais próximo. Leve um documento com foto e o cartão de vacinas, se tiver.',
      'Os horários variam por unidade: confirme antes de sair de casa.',
    ],
  ],
  [
    'n3',
    'news',
    'sao-paulo',
    -9,
    'Ciclofaixa de lazer terá novo trecho aos domingos',
    'O trecho acrescentado liga dois parques e deve facilitar o passeio em família.',
    [
      'A novidade começa no próximo domingo, das 7h às 16h, com sinalização e equipes de apoio ao longo do percurso.',
      'Quem quiser participar pode levar a própria bicicleta; haverá pontos de água e de apoio mecânico básico.',
    ],
  ],
  [
    'n4',
    'news',
    'campinas',
    -14,
    'Feira de produtores passa a funcionar também às quartas',
    'A mudança atende pedidos de moradores que trabalham aos sábados.',
    [
      'A feira terá mais de trinta barracas, com frutas, verduras, queijos e produtos artesanais.',
      'O horário de quarta-feira será das 15h às 20h.',
    ],
  ],
  [
    'n5',
    'news',
    'santos',
    -40,
    'Projeto de plantio de mudas começa na orla',
    'Voluntários poderão adotar mudas e acompanhar o crescimento pela internet.',
    [
      'A primeira etapa prevê o plantio de espécies nativas em canteiros ao longo da orla.',
      'As inscrições para voluntários ficam abertas por duas semanas.',
    ],
  ],
  [
    'n6',
    'news',
    'ribeirao-preto',
    -60,
    'Biblioteca municipal amplia horário de funcionamento',
    'O espaço passa a abrir também aos sábados, com atividades para crianças.',
    [
      'Além do empréstimo de livros, a programação inclui contação de histórias e oficinas de leitura.',
      'A entrada é livre e não é preciso fazer inscrição.',
    ],
  ],
]

// [id, source, cityId, publicado(h), início(h), duração(h), local, preço, título, resumo]
const EVENTS = [
  [
    'e1',
    'culture',
    'campinas',
    -72,
    30,
    3,
    'Biblioteca do bairro',
    null,
    'Feira de livros, trocas e leitura',
    'Traga um livro e leve outro. Haverá mesa de troca, leitura em voz alta e espaço para crianças.',
  ],
  [
    'e2',
    'sports',
    'sao-paulo',
    -48,
    54,
    4,
    'Parque da cidade',
    null,
    'Corrida e caminhada de 5 km',
    'Percurso plano e sinalizado, para todas as idades. Haverá água e alongamento coletivo.',
  ],
  [
    'e3',
    'culture',
    'santos',
    -24,
    78,
    2,
    'Praça da orla',
    '15,00',
    'Show de música regional ao pôr do sol',
    'Apresentação com artistas locais. Os ingressos ajudam a manter a programação cultural.',
  ],
  [
    'e4',
    'culture',
    null,
    -96,
    8,
    3,
    'Centro cultural',
    null,
    'Oficina de grafite para iniciantes',
    'Materiais incluídos. Vagas limitadas; chegue com 15 minutos de antecedência.',
  ],
  [
    'e5',
    'sports',
    'ribeirao-preto',
    -120,
    150,
    5,
    'Ginásio municipal',
    '10,00',
    'Torneio de vôlei amador',
    'Equipes mistas e abertas a quem quiser jogar. As inscrições são feitas no local.',
  ],
  [
    'e6',
    'culture',
    'sao-paulo',
    -200,
    -30,
    2,
    'Teatro do bairro',
    null,
    'Sessão de cinema ao ar livre',
    'Exibição de um filme nacional com entrada gratuita. O evento já aconteceu: serve para ver como ficam eventos encerrados.',
  ],
  [
    'e7',
    'culture',
    'campinas',
    -10,
    340,
    4,
    'Praça central',
    null,
    'Feira de artesanato e gastronomia',
    'Barracas de artesãos e cozinheiros locais, com música ao vivo durante a tarde.',
  ],
]

const at = (epochMs, hours) => new Date(epochMs + hours * HOURS).toISOString()

/** Itens do feed estadual. Cada geração produz o mesmo conteúdo para a mesma `epochMs`. */
export function generateSeedState(epochMs) {
  const alerts = ALERTS.map(([id, source, cityId, level, pub, exp, title, summary]) => ({
    kind: 'alert',
    id: `seed-state-${id}`,
    source: SOURCES[source],
    cityId,
    level,
    publishedAt: at(epochMs, pub),
    expiresAt: at(epochMs, exp),
    title,
    summary,
  }))

  const news = NEWS.map(([id, source, cityId, pub, title, summary, body]) => ({
    kind: 'news',
    id: `seed-state-${id}`,
    source: SOURCES[source],
    cityId,
    publishedAt: at(epochMs, pub),
    title,
    summary,
    body,
  }))

  const events = EVENTS.map(
    ([id, source, cityId, pub, start, duration, venue, price, title, summary]) => ({
      kind: 'event',
      id: `seed-state-${id}`,
      source: SOURCES[source],
      cityId,
      publishedAt: at(epochMs, pub),
      startsAt: at(epochMs, start),
      endsAt: at(epochMs, start + duration),
      venue,
      price,
      title,
      summary,
    }),
  )

  return [...alerts, ...news, ...events]
}
