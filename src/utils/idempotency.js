/**
 * 幂等键：一次业务尝试一个，失败重试时复用同一个。
 *
 * 为什么需要：网络超时后用户重试、刷新页面重填、开两个标签页，服务端会收到两个
 * 内容完全相同的请求。带上同一个 Idempotency-Key，后端只执行一次、后续回放结果。
 *
 * 生成规则：32 位十六进制，符合后端 ^[A-Za-z0-9_-]{8,64}$ 的校验。
 * crypto.randomUUID 只在安全上下文可用（https 或 localhost）；用 http + IP 访问时降级。
 */
export function newIdempotencyKey() {
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID().replace(/-/g, '')
  }
  if (cryptoObj?.getRandomValues) {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  }
  return `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}
