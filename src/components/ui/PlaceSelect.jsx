import { useState } from 'react'
import { CITIES, getNeighborhood } from '../../domain/places.js'
import { SelectField } from './FormFields.jsx'

/**
 * Escolha de bairro em dois passos: município e depois bairro.
 * `value` é o id do bairro ("sao-paulo/pinheiros") ou texto vazio.
 * Dois selects nativos funcionam bem com leitor de tela e teclado de celular.
 */
export function PlaceSelect({ value, onChange, onBlur, error, required }) {
  const [cityId, setCityId] = useState(() => getNeighborhood(value)?.cityId ?? '')
  const city = CITIES.find((c) => c.id === cityId)

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Município"
        required={required}
        value={cityId}
        onChange={(e) => {
          setCityId(e.target.value)
          onChange('')
        }}
      >
        <option value="">Escolha o município</option>
        {CITIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Bairro"
        required={required}
        value={value ?? ''}
        disabled={!city}
        error={error}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {city ? 'Escolha o bairro' : 'Escolha primeiro o município'}
        </option>
        {city?.neighborhoods.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </SelectField>
    </div>
  )
}
