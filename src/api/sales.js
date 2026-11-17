import request from '@/utils/request'

export function createSaleOutbound(payload) {
  // 出库错误（尤其是库存不足）由页面单独弹窗呈现，因此关闭全局 toast。
  return request.post('/sales/outbound', payload, {
    skipErrorMessage: true,
  })
}
