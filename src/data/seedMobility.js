/**
 * Rede de mobilidade FICTÍCIA: trechos monitorados por sensores simulados e
 * linhas de ônibus circulares.
 *
 * É esquemática de propósito: os trechos ligam o centro de dois bairros em linha
 * reta e as linhas passam por "pontos" nomeados pelo bairro. Nada aqui segue uma
 * rua real, tem nome de rua ou de empresa de ônibus; assim ninguém confunde o
 * protótipo com informação de trânsito de verdade.
 *
 * Coordenadas são aproximações do centro de cada bairro: [latitude, longitude].
 */

const COORDS = {
  'sao-paulo': {
    Centro: [-23.5505, -46.6333],
    Pinheiros: [-23.567, -46.692],
    'Vila Mariana': [-23.589, -46.634],
    Mooca: [-23.559, -46.599],
    Tatuapé: [-23.54, -46.576],
    Santana: [-23.503, -46.625],
    Itaquera: [-23.54, -46.456],
    Butantã: [-23.571, -46.726],
    Lapa: [-23.525, -46.701],
    'Santo Amaro': [-23.654, -46.714],
    Penha: [-23.53, -46.544],
    Ipiranga: [-23.587, -46.61],
    Jabaquara: [-23.646, -46.642],
  },
  campinas: {
    Centro: [-22.906, -47.061],
    Cambuí: [-22.899, -47.05],
    Taquaral: [-22.875, -47.051],
    'Barão Geraldo': [-22.818, -47.069],
    Sousas: [-22.859, -46.974],
  },
  santos: {
    'Vila Mathias': [-23.95, -46.333],
    Boqueirão: [-23.962, -46.324],
    Gonzaga: [-23.968, -46.331],
    Embaré: [-23.972, -46.326],
    'Ponta da Praia': [-23.986, -46.303],
  },
}

// [id, bairro A, bairro B, velocidade livre (km/h), pico da manhã (0-1), pico da tarde (0-1)]
const SEGMENTS = {
  'sao-paulo': [
    ['s1', 'Pinheiros', 'Centro', 50, 0.9, 0.7],
    ['s2', 'Lapa', 'Centro', 50, 0.8, 0.8],
    ['s3', 'Santana', 'Centro', 60, 0.85, 0.6],
    ['s4', 'Tatuapé', 'Mooca', 50, 0.6, 0.8],
    ['s5', 'Mooca', 'Ipiranga', 50, 0.5, 0.7],
    ['s6', 'Vila Mariana', 'Jabaquara', 60, 0.4, 0.9],
    ['s7', 'Santo Amaro', 'Jabaquara', 60, 0.6, 0.85],
    ['s8', 'Butantã', 'Pinheiros', 50, 0.9, 0.9],
    ['s9', 'Itaquera', 'Tatuapé', 60, 0.85, 0.5],
    ['s10', 'Penha', 'Tatuapé', 50, 0.5, 0.7],
  ],
  campinas: [
    ['s1', 'Centro', 'Cambuí', 40, 0.8, 0.7],
    ['s2', 'Cambuí', 'Taquaral', 50, 0.6, 0.8],
    ['s3', 'Barão Geraldo', 'Taquaral', 60, 0.85, 0.6],
    ['s4', 'Sousas', 'Cambuí', 60, 0.5, 0.85],
  ],
  santos: [
    ['s1', 'Vila Mathias', 'Boqueirão', 40, 0.6, 0.7],
    ['s2', 'Boqueirão', 'Gonzaga', 40, 0.5, 0.8],
    ['s3', 'Gonzaga', 'Ponta da Praia', 50, 0.4, 0.9],
  ],
}

// [id, código, nome, nós do percurso (a linha volta ao primeiro), ônibus, minutos por volta, trechos usados]
const LINES = {
  'sao-paulo': [
    [
      'l100',
      '100',
      'Circular Centro e Zona Oeste',
      ['Centro', 'Lapa', 'Butantã', 'Pinheiros'],
      5,
      70,
      ['s1', 's2', 's8'],
    ],
    [
      'l200',
      '200',
      'Circular Zona Leste',
      ['Centro', 'Mooca', 'Tatuapé', 'Itaquera', 'Penha'],
      6,
      90,
      ['s4', 's5', 's9', 's10'],
    ],
    [
      'l300',
      '300',
      'Circular Zona Sul',
      ['Centro', 'Vila Mariana', 'Jabaquara', 'Santo Amaro', 'Ipiranga'],
      5,
      85,
      ['s5', 's6', 's7'],
    ],
  ],
  campinas: [
    [
      'l10',
      '10',
      'Circular Centro, Cambuí e Taquaral',
      ['Centro', 'Cambuí', 'Taquaral', 'Barão Geraldo'],
      4,
      60,
      ['s1', 's2', 's3'],
    ],
    ['l20', '20', 'Circular Sousas', ['Centro', 'Cambuí', 'Sousas'], 3, 50, ['s1', 's4']],
  ],
  santos: [
    [
      'l1',
      '1',
      'Circular da Orla',
      ['Vila Mathias', 'Boqueirão', 'Gonzaga', 'Ponta da Praia'],
      4,
      45,
      ['s1', 's2', 's3'],
    ],
  ],
}

const CITY_INFO = {
  'sao-paulo': { name: 'São Paulo', center: [-23.5505, -46.6333], zoom: 11 },
  campinas: { name: 'Campinas', center: [-22.895, -47.04], zoom: 12 },
  santos: { name: 'Santos', center: [-23.96, -46.325], zoom: 13 },
}

// "Centro" vira "Terminal Central"; os demais, "Ponto <bairro>". Todos fictícios.
const stopName = (node) => (node === 'Centro' ? 'Terminal Central' : `Ponto ${node}`)

function buildCity(cityId) {
  const at = (node) => COORDS[cityId][node]

  const segments = SEGMENTS[cityId].map(([id, a, b, freeFlowKmh, morning, evening]) => ({
    id: `${cityId}-${id}`,
    name: `Ligação ${a}–${b}`,
    path: [at(a), at(b)],
    sensor: { id: `sensor-${cityId}-${id}`, freeFlowKmh, morning, evening },
  }))

  const lines = LINES[cityId].map(
    ([id, code, name, nodes, busCount, cycleMinutes, segmentIds]) => ({
      id: `${cityId}-${id}`,
      code,
      name,
      // circular: o último ponto é o primeiro, para fechar a volta
      path: [...nodes, nodes[0]].map(at),
      stops: nodes.map((node, vertexIndex) => ({
        id: `${cityId}-${id}-p${vertexIndex + 1}`,
        name: stopName(node),
        vertexIndex,
      })),
      busCount,
      cycleMinutes,
      segmentIds: segmentIds.map((s) => `${cityId}-${s}`),
    }),
  )

  return { id: cityId, ...CITY_INFO[cityId], segments, lines }
}

export const MOBILITY_CITIES = Object.keys(CITY_INFO).map(buildCity)
