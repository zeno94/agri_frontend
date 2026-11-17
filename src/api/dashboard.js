import request from '@/utils/request'
import { normalizeDashboard } from '@/utils/normalize'

export async function getDashboard() {
  const response = await request.get('/dashboard')
  return normalizeDashboard(response)
}
