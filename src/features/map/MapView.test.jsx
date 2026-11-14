import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { goToLocalHour } from '../../test/clockHelpers.js'
import { getMobilitySnapshot } from '../../services/mobilityService.js'
import MapView from './MapView.jsx'

// Teste de fumaça do desenho: o jsdom não tem layout nem tiles, mas monta o SVG e os marcadores.
async function renderMap(props = {}) {
  goToLocalHour(12)
  const snapshot = await getMobilitySnapshot('sao-paulo')
  const view = render(
    <MapView snapshot={snapshot} mode="traffic" onSelectSegment={() => {}} {...props} />,
  )
  return { ...view, snapshot }
}

describe('MapView', () => {
  it('é uma região nomeada que aponta para as listas', async () => {
    const { getByRole } = await renderMap()
    expect(getByRole('region', { name: /Mapa esquemático/ })).toBeInTheDocument()
  })

  it('no modo trânsito desenha um traço por trecho, com a classe do nível', async () => {
    const { container, snapshot } = await renderMap()
    const paths = container.querySelectorAll('path.leaflet-interactive')
    expect(paths).toHaveLength(snapshot.segments.length)
    for (const path of paths) {
      expect(path.getAttribute('class')).toMatch(/nr-line-(free|moderate|heavy|unknown)/)
    }
  })

  it('o trecho destacado ganha um contorno extra', async () => {
    const { container, snapshot } = await renderMap({ selectedSegmentId: 'sao-paulo-s1' })
    expect(container.querySelectorAll('path.nr-halo')).toHaveLength(1)
    expect(container.querySelectorAll('path.leaflet-interactive')).toHaveLength(
      snapshot.segments.length,
    )
  })

  it('clicar em um trecho avisa qual foi', async () => {
    const onSelectSegment = vi.fn()
    const { container } = await renderMap({ onSelectSegment })
    container
      .querySelector('path.leaflet-interactive')
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onSelectSegment).toHaveBeenCalledWith(
      expect.stringMatching(/^sao-paulo-s\d+$/),
    )
  })

  it('no modo ônibus desenha as linhas e os ônibus numerados, sem foco de teclado', async () => {
    const { container, snapshot } = await renderMap({ mode: 'bus' })
    expect(container.querySelectorAll('path.nr-route')).toHaveLength(
      snapshot.lines.length,
    )
    const buses = container.querySelectorAll('.nr-bus')
    expect(buses).toHaveLength(snapshot.lines.reduce((n, l) => n + l.buses.length, 0))
    expect(container.querySelectorAll('.leaflet-marker-icon[tabindex]')).toHaveLength(0)
  })

  it('com uma linha aberta mostra só os ônibus e as paradas dela', async () => {
    const { container, snapshot } = await renderMap({
      mode: 'bus',
      selectedLineId: 'sao-paulo-l100',
    })
    const line = snapshot.lines.find((l) => l.id === 'sao-paulo-l100')
    expect(container.querySelectorAll('.nr-bus')).toHaveLength(line.buses.length)
    expect(container.querySelectorAll('path.nr-stop')).toHaveLength(line.stops.length)
    expect(container.querySelectorAll('path.nr-route-selected')).toHaveLength(1)
  })
})
