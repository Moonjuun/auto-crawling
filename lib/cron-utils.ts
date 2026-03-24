/**
 * cron 표현식을 한국어로 설명하는 헬퍼
 * 자주 쓰는 패턴만 처리하고 나머지는 그대로 반환
 */
export function cronToKorean(expression: string): string {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return expression

  const [min, hour, dom, mon, dow] = parts

  // 매 분
  if (expression === '* * * * *') return '매 1분마다'

  // 매 n분
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `매 ${min.slice(2)}분마다`
  }

  // 매 시간 정각
  if (min === '0' && hour === '*') return '매 시간 정각'

  // 매 n시간
  if (min === '0' && hour.startsWith('*/')) return `매 ${hour.slice(2)}시간마다`

  // 매일 특정 시간
  if (dom === '*' && mon === '*' && dow === '*' && !hour.includes('*')) {
    const h = hour.padStart(2, '0')
    const m = min === '0' ? '00' : min.padStart(2, '0')
    return `매일 ${h}:${m}`
  }

  // 매주 특정 요일
  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
  if (dom === '*' && mon === '*' && dow !== '*' && !dow.includes('*')) {
    const dayNum = parseInt(dow, 10)
    if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
      const h = hour.padStart(2, '0')
      const m = min === '0' ? '00' : min.padStart(2, '0')
      return `매주 ${DAY_NAMES[dayNum]}요일 ${h}:${m}`
    }
  }

  // 그 외: 그대로 반환
  return expression
}

/** 자주 쓰는 cron 프리셋 목록 */
export const CRON_PRESETS = [
  { label: '매 1분마다', value: '* * * * *' },
  { label: '매 5분마다', value: '*/5 * * * *' },
  { label: '매 10분마다', value: '*/10 * * * *' },
  { label: '매 30분마다', value: '*/30 * * * *' },
  { label: '매 시간 정각', value: '0 * * * *' },
  { label: '매 6시간마다', value: '0 */6 * * *' },
  { label: '매일 오전 9시', value: '0 9 * * *' },
  { label: '매일 자정', value: '0 0 * * *' },
  { label: '매주 월요일 오전 9시', value: '0 9 * * 1' },
]
