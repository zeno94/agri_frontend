import request from '@/utils/request'
import {
  normalizeCollection,
  normalizePart,
} from '@/utils/normalize'

export async function getParts(params = {}) {
  const response = await request.get('/parts', { params })
  const { items, total } = normalizeCollection(response)
  return {
    items: items.map(normalizePart),
    total,
  }
}

export async function getPartOptions() {
  const { items } = await getParts({ page: 1, page_size: 1000 })
  return items.filter((part) => part.id !== undefined && part.id !== null)
}

export function createPart(payload) {
  return request.post('/parts', payload)
}

export async function getWarningParts() {
  const response = await request.get('/parts/warning')
  return normalizeCollection(response).items.map(normalizePart)
}
