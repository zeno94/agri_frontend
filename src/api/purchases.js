import request from '@/utils/request'

export function createPurchaseInbound(payload) {
  return request.post('/purchases/inbound', payload)
}
