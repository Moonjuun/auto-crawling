import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 서버 전용 관리자 클라이언트
// service_role 키를 사용해 RLS를 우회합니다 (단독 사용자 앱이므로 안전)
// 반드시 서버 사이드(Server Components, Server Actions, Route Handlers)에서만 사용
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      '.env.local에 NEXT_PUBLIC_SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY를 설정해주세요.'
    )
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      // 서버 사이드에서 세션 불필요
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
