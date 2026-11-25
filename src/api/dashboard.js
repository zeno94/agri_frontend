import request from '@/utils/request'
import {
  normalizeDashboard,
  normalizeDashboardReport,
} from '@/utils/normalize'

export async function getDashboard() {
  const response = await request.get('/dashboard')
  return normalizeDashboard(response)
}

export async function getDashboardReport(params = {}) {
  const response = await request.get('/dashboard/report', { params })
  return normalizeDashboardReport(response)
}
