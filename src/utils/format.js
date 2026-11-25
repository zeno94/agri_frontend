const numberFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0,
})

const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatNumber(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? numberFormatter.format(number) : fallback
}

export function formatMoney(value, fallback = '0.00') {
  const number = Number(value)
  return Number.isFinite(number) ? moneyFormatter.format(number) : fallback
}

/** 销售金额按整数元展示；采购/成本等仍用 formatMoney 保留两位。 */
export function formatYuan(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? numberFormatter.format(number) : fallback
}

export function formatDate(date = new Date(), withWeekday = true) {
  const target = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(target.getTime())) return ''

  const datePart = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(target)

  if (!withWeekday) return datePart

  const weekday = new Intl.DateTimeFormat('zh-CN', {
    weekday: 'short',
  }).format(target)

  return `${datePart} ${weekday}`
}

export function getGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 6) return '夜深了'
  if (hour < 11) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function formatPercent(value, digits = 1) {
  const number = Number(value)
  return Number.isFinite(number) ? `${number.toFixed(digits)}%` : `0.${'0'.repeat(digits)}%`
}
