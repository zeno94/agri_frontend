import request from '@/utils/request'
import {
  normalizeBusinessOption,
  normalizeCollection,
} from '@/utils/normalize'

export async function getCustomers() {
  const response = await request.get('/customers')
  return normalizeCollection(response).items
    .map(normalizeBusinessOption)
    .filter((customer) => customer.id !== undefined && customer.id !== null)
}
