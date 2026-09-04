import { describe, it, expect } from 'vitest'
import { calculateSimilarity } from '../../src/utils/generator'

/** 参照实现：优化前的完整二维矩阵版本，用于差分校验 */
function referenceSimilarity(str1: string, str2: string): number {
  const clean = (s: string) => (s || '').toLowerCase().replace(/[\s\d.、,，.。;；?？!！:：\-[\]()（）"“”'‘’/\\_]/g, '')
  const s1 = clean(str1)
  const s2 = clean(str2)
  if (!s1 || !s2) return 0
  if (s1 === s2) return 100

  const getGrams = (str: string, n = 2): Map<string, number> => {
    const map = new Map<string, number>()
    if (str.length < n) { map.set(str, 1); return map }
    for (let i = 0; i <= str.length - n; i++) {
      const gram = str.substring(i, i + n)
      map.set(gram, (map.get(gram) || 0) + 1)
    }
    return map
  }
  const grams1 = getGrams(s1, 2)
  const grams2 = getGrams(s2, 2)
  let intersection = 0, total1 = 0, total2 = 0
  grams1.forEach((count, gram) => { total1 += count; if (grams2.has(gram)) intersection += Math.min(count, grams2.get(gram)!) })
  grams2.forEach((count) => { total2 += count })
  const ngramSimilarity = total1 + total2 > 0 ? (2 * intersection) / (total1 + total2) * 100 : 0

  const len1 = s1.length, len2 = s2.length
  const matrix: number[][] = []
  for (let i = 0; i <= len1; i++) matrix[i] = [i]
  for (let j = 0; j <= len2; j++) matrix[0][j] = j
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
    }
  }
  const distance = matrix[len1][len2]
  const levSimilarity = (1 - distance / Math.max(len1, len2)) * 100
  const finalSim = ngramSimilarity >= 60 ? Math.max(levSimilarity, ngramSimilarity) : levSimilarity * 0.4 + ngramSimilarity * 0.6
  return Math.min(100, Math.max(0, Math.round(finalSim)))
}

const POOL = '联调订单结算接口修复优惠券金额计算显示逻辑清理冗余废弃组件未生效样式本地全流程自测下单退款链路运行正常缓存击穿并发重复提交排查索引重建慢查询abcXYZ0123，。、；！？“”()[]_ /' + String.fromCharCode(92)

function rand(n: number, seed: { v: number }) {
  let out = ''
  for (let i = 0; i < n; i++) {
    seed.v = (seed.v * 1103515245 + 12345) & 0x7fffffff
    out += POOL[seed.v % POOL.length]
  }
  return out
}

describe('编辑距离优化的差分等价性', () => {
  it('对 600 组随机输入，优化版与二维矩阵参照实现结果必须完全一致', () => {
    const seed = { v: 20260904 }
    let checked = 0
    for (let k = 0; k < 600; k++) {
      seed.v = (seed.v * 1103515245 + 12345) & 0x7fffffff
      const la = seed.v % 120
      seed.v = (seed.v * 1103515245 + 12345) & 0x7fffffff
      const lb = seed.v % 120
      const a = rand(la, seed)
      const b = rand(lb, seed)
      expect(calculateSimilarity(a, b)).toBe(referenceSimilarity(a, b))
      checked++
    }
    expect(checked).toBe(600)
  })

  it('边界输入（空串/单字/等长/超长）结果一致', () => {
    const cases: Array<[string, string]> = [
      ['', ''], ['', 'abc'], ['abc', ''], ['a', 'a'], ['a', 'b'],
      ['前端', '前端'], ['前端', '后端'],
      ['重构完成'.repeat(60), '重构完毕'.repeat(60)],
      ['、、、', '。。。'],
      ['🙂🙂', '🙂🙃']
    ]
    for (const [a, b] of cases) {
      expect(calculateSimilarity(a, b)).toBe(referenceSimilarity(a, b))
    }
  })
})
