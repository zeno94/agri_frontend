import request from '@/utils/request'
import {
  normalizeBusinessOption,
  normalizeCollection,
} from '@/utils/normalize'

export async function getCustomers() {
  const response = await request.get('/customers/options')
  return normalizeCollection(response).items
    .map(normalizeBusinessOption)
    .filter((customer) => customer.id !== undefined && customer.id !== null)
}

export async function getCustomerPage(params = {}) {
  const response = await request.get('/customers', { params })
  return normalizeCollection(response)
}

export function getCustomerDetail(customerId) {
  return request.get(`/customers/${customerId}`)
}

export function createCustomer(payload) {
  return request.post('/customers', payload)
}

export function updateCustomer(customerId, payload) {
  return request.patch(`/customers/${customerId}`, payload)
}

export function addCustomerFollowup(customerId, payload) {
  return request.post(`/customers/${customerId}/followups`, payload)
}
