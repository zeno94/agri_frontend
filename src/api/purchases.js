import request from '@/utils/request'

export function createPurchaseInbound(payload, idempotencyKey) {
  // 带上 Idempotency-Key 后，网络超时重试不会重复入库
  return request.post('/purchases/inbound', payload, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })
}
