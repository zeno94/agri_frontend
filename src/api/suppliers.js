import request from '@/utils/request'
import {
  normalizeBusinessOption,
  normalizeCollection,
} from '@/utils/normalize'

export async function getSuppliers() {
  const response = await request.get('/suppliers')
  return normalizeCollection(response).items
    .map(normalizeBusinessOption)
    .filter((supplier) => supplier.id !== undefined && supplier.id !== null)
}
