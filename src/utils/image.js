/**
 * Preparo da foto antes de guardar.
 *
 * Ela é REDESENHADA em um canvas e salva como JPEG. Isso:
 *  - reduz o tamanho (fotos de celular têm vários MB);
 *  - corrige a orientação (o navegador aplica a rotação da câmera ao desenhar);
 *  - remove os metadados (EXIF), inclusive a localização GPS, que o canvas não
 *    carrega. Privacidade: quem fotografa não revela a própria posição exata.
 */
export const MAX_INPUT_BYTES = 15 * 1024 * 1024
export const MAX_DIMENSION = 1280
export const JPEG_QUALITY = 0.8

/** Lado maior limitado a `max`, mantendo a proporção. Nunca amplia. */
export function fitWithin(width, height, max = MAX_DIMENSION) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export async function compressImage(file) {
  if (!file.type?.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('A imagem é muito grande. Escolha uma com menos de 15 MB.')
  }

  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Não foi possível ler essa imagem. Tente outra foto.')
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  // Fundo branco: PNG com transparência viraria preto em JPEG.
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  )
  if (!blob) throw new Error('Não foi possível preparar a imagem. Tente outra foto.')
  return blob
}
