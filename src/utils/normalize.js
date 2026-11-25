export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function unwrapData(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, 'data')
  ) {
    return payload.data
  }
  return payload
}

/**
 * 兼容常见的分页返回结构：
 * { data: { items, total } }、{ data: { records, total } }、{ data: [] }
 */
export function normalizeCollection(response) {
  const root = response && typeof response === 'object' ? response : {}
  const payload = unwrapData(root)

  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length }
  }

  if (!payload || typeof payload !== 'object') {
    return { items: [], total: 0 }
  }

  const listKeys = ['items', 'records', 'rows', 'list', 'results', 'content']
  let items = []
  for (const key of listKeys) {
    if (Array.isArray(payload[key])) {
      items = payload[key]
      break
    }
  }
  if (!items.length && Array.isArray(payload.data)) {
    items = payload.data
  }

  const total = toNumber(
    payload.total ??
      payload.total_count ??
      payload.totalCount ??
      payload.count ??
      root.total ??
      root.total_count,
    items.length,
  )

  return { items, total }
}

export function normalizePart(raw = {}) {
  return {
    ...raw,
    id: raw.id ?? raw.part_id ?? raw.partId,
    name: raw.name ?? raw.part_name ?? raw.partName ?? '',
    model: raw.model ?? raw.spec ?? raw.specification ?? '',
    category: raw.category ?? raw.category_name ?? raw.categoryName ?? '',
    brand: raw.brand ?? raw.brand_name ?? raw.brandName ?? '',
    stock: toNumber(raw.stock ?? raw.inventory ?? raw.inventory_stock),
    safe_stock: toNumber(
      raw.safe_stock ??
        raw.safeStock ??
        raw.safety_stock ??
        raw.min_stock ??
        raw.warning_stock,
    ),
    price: toNumber(
      raw.price ??
        raw.sale_price ??
        raw.selling_price ??
        raw.retail_price ??
        raw.unit_price,
    ),
  }
}

export function normalizeBusinessOption(raw = {}) {
  return {
    ...raw,
    id: raw.id ?? raw.supplier_id ?? raw.customer_id,
    name:
      raw.name ??
      raw.supplier_name ??
      raw.customer_name ??
      raw.company_name ??
      raw.contact_name ??
      '',
    contact: raw.contact ?? raw.contact_name ?? raw.phone ?? '',
  }
}

export function isLowStock(part) {
  return toNumber(part?.stock) <= toNumber(part?.safe_stock)
}

function pickNumber(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        return toNumber(source[key])
      }
    }
  }
  return 0
}

/**
 * 看板接口字段兼容：today_sales / month_sales / top_parts 等常见命名。
 */
export function normalizeDashboard(response) {
  const payload = unwrapData(response) || {}
  const today =
    payload.today && typeof payload.today === 'object' ? payload.today : {}
  const month =
    payload.month && typeof payload.month === 'object' ? payload.month : {}
  const overview =
    payload.overview && typeof payload.overview === 'object'
      ? payload.overview
      : payload.summary && typeof payload.summary === 'object'
        ? payload.summary
        : {}
  const sources = [payload, overview, today, month]

  const todaySales = pickNumber(sources, [
    'today_sales',
    'today_sales_amount',
    'todaySales',
    'today_amount',
    'today_total',
    'today_total_amount',
  ])
  const monthSales = pickNumber(sources, [
    'month_sales',
    'month_sales_amount',
    'monthSales',
    'month_amount',
    'month_total',
    'month_total_amount',
  ])

  let rawTop =
    payload.top_parts ??
    payload.topParts ??
    payload.top5 ??
    payload.top5_parts ??
    payload.top_products ??
    payload.sales_top5 ??
    overview.top_parts ??
    []

  if (rawTop && !Array.isArray(rawTop) && typeof rawTop === 'object') {
    rawTop = normalizeCollection(rawTop).items
  }
  if (!Array.isArray(rawTop)) rawTop = []

  const topParts = rawTop.slice(0, 5).map((item) => {
    const raw = item && typeof item === 'object' ? item : { name: String(item) }
    return {
      id: raw.id ?? raw.part_id ?? raw.partId,
      name: raw.name ?? raw.part_name ?? raw.partName ?? '未知配件',
      model: raw.model ?? raw.spec ?? '',
      quantity: toNumber(
        raw.quantity ??
          raw.sales_count ??
          raw.sold_count ??
          raw.total_quantity ??
          raw.sales_volume ??
          raw.value ??
          raw.count,
      ),
    }
  })

  return { todaySales, monthSales, topParts }
}

/**
 * 经营报表字段归一化：后端统一 snake_case，页面只消费 camelCase。
 */
export function normalizeDashboardReport(response) {
  const payload = unwrapData(response) || {}
  const topParts = Array.isArray(payload.top_parts) ? payload.top_parts : []
  const topCustomers = Array.isArray(payload.top_customers) ? payload.top_customers : []
  const topSuppliers = Array.isArray(payload.top_suppliers) ? payload.top_suppliers : []
  const categories = Array.isArray(payload.category_breakdown)
    ? payload.category_breakdown
    : []
  const trend = Array.isArray(payload.trend) ? payload.trend : []

  return {
    startDate: payload.start_date || '',
    endDate: payload.end_date || '',
    dataStartDate: payload.data_start_date || '',
    dataEndDate: payload.data_end_date || '',
    salesAmount: toNumber(payload.sales_amount),
    salesOrderCount: toNumber(payload.sales_order_count),
    itemsSold: toNumber(payload.items_sold),
    avgOrderAmount: toNumber(payload.avg_order_amount),
    purchaseAmount: toNumber(payload.purchase_amount),
    purchaseOrderCount: toNumber(payload.purchase_order_count),
    grossProfit: toNumber(payload.gross_profit),
    grossMargin: toNumber(payload.gross_margin),
    trendGranularity: payload.trend_granularity === 'month' ? 'month' : 'day',
    topParts: topParts.map((raw) => ({
      id: raw.part_id ?? raw.id,
      name: raw.part_name ?? raw.name ?? '未知配件',
      quantity: toNumber(raw.quantity),
      amount: toNumber(raw.amount),
    })),
    topCustomers: topCustomers.map((raw) => ({
      id: raw.customer_id ?? raw.partner_id ?? raw.id,
      name: raw.customer_name ?? raw.partner_name ?? raw.name ?? '未知客户',
      amount: toNumber(raw.amount),
      orderCount: toNumber(raw.order_count),
    })),
    topSuppliers: topSuppliers.map((raw) => ({
      id: raw.supplier_id ?? raw.partner_id ?? raw.id,
      name: raw.supplier_name ?? raw.partner_name ?? raw.name ?? '未知供应商',
      amount: toNumber(raw.amount),
      orderCount: toNumber(raw.order_count),
    })),
    categories: categories.map((raw) => ({
      name: raw.category ?? raw.name ?? '未分类',
      quantity: toNumber(raw.quantity),
      amount: toNumber(raw.amount),
    })),
    trend: trend.map((raw) => ({
      period: raw.period || '',
      salesAmount: toNumber(raw.sales_amount ?? raw.amount),
      orderCount: toNumber(raw.order_count ?? raw.count),
    })),
  }
}
