import request from '@/utils/request'
import {
  normalizeBusinessOption,
  normalizeCollection,
} from '@/utils/normalize'

export async function getSuppliers() {
  const response = await request.get('/suppliers/options')
  return normalizeCollection(response).items
    .map(normalizeBusinessOption)
    .filter((supplier) => supplier.id !== undefined && supplier.id !== null)
}

export async function getSupplierPage(params = {}) {
  const response = await request.get('/suppliers', { params })
  return normalizeCollection(response)
}

export function createSupplier(payload) {
  return request.post('/suppliers', payload)
}

export function updateSupplier(supplierId, payload) {
  return request.patch(`/suppliers/${supplierId}`, payload)
}
