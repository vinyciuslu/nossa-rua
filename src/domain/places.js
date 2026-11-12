/**
 * Catálogo de lugares do protótipo: uma amostra de municípios do estado de São
 * Paulo e alguns de seus bairros. Não é a lista completa; serve para o produto
 * funcionar de ponta a ponta. Em um backend real, viria de uma base oficial.
 *
 * O id de um bairro é "<município>/<bairro>" em minúsculas e sem acento, e é
 * estável: pode ser gravado em contas e relatos.
 */

const slug = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const RAW_CITIES = [
  [
    'São Paulo',
    [
      'Pinheiros',
      'Vila Mariana',
      'Mooca',
      'Tatuapé',
      'Santana',
      'Itaquera',
      'Butantã',
      'Lapa',
      'Santo Amaro',
      'Penha',
      'Ipiranga',
      'Jabaquara',
    ],
  ],
  ['Campinas', ['Cambuí', 'Taquaral', 'Barão Geraldo', 'Sousas', 'Centro']],
  ['Santos', ['Gonzaga', 'Boqueirão', 'Embaré', 'Ponta da Praia', 'Vila Mathias']],
  ['Guarulhos', ['Centro', 'Vila Augusta', 'Cumbica', 'Macedo']],
  ['Osasco', ['Centro', 'Bela Vista', 'Presidente Altino', 'Jaguaribe']],
  ['Santo André', ['Centro', 'Campestre', 'Vila Assunção', 'Jardim']],
  [
    'Ribeirão Preto',
    ['Centro', 'Jardim Sumaré', 'Ribeirânia', 'Alto da Boa Vista', 'Nova Ribeirânia'],
  ],
  ['São José dos Campos', ['Centro', 'Jardim Esplanada', 'Vila Adyana', 'Santana']],
  ['Sorocaba', ['Centro', 'Campolim', 'Éden', 'Jardim Santa Rosália']],
]

export const CITIES = RAW_CITIES.map(([name, neighborhoods]) => {
  const id = slug(name)
  return {
    id,
    name,
    neighborhoods: neighborhoods.map((n) => ({
      id: `${id}/${slug(n)}`,
      name: n,
      cityId: id,
      cityName: name,
    })),
  }
})

const NEIGHBORHOODS_BY_ID = new Map(
  CITIES.flatMap((city) => city.neighborhoods).map((n) => [n.id, n]),
)

export const getNeighborhood = (id) => NEIGHBORHOODS_BY_ID.get(id) ?? null

export const getCity = (id) => CITIES.find((city) => city.id === id) ?? null

/** "Pinheiros · São Paulo". Devolve texto vazio para id desconhecido. */
export function formatPlace(id) {
  const n = getNeighborhood(id)
  return n ? `${n.name} · ${n.cityName}` : ''
}
