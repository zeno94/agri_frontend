import request from '@/utils/request'

export function createSaleOutbound(payload, idempotencyKey) {
  // 出库错误（尤其是库存不足）由页面单独弹窗呈现，因此关闭全局 toast。
  // 带上 Idempotency-Key 后，网络超时重试不会重复扣库存。
  return request.post('/sales/outbound', payload, {
    skipErrorMessage: true,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })
}

export function listSales(params = {}) {
  return request.get('/sales', { params })
}
