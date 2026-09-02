import { describe, it, expect, vi } from 'vitest';
import { parseExcelFile, batchSaveImportedLogs, normalizeDateStr } from '../excelImporter';
import * as storage from '../storage';

describe('Excel 工作日志导入器测试', () => {
  it('应当能正确解析多种日期格式与 Excel 序列号日期', () => {
    // 字符串格式
    expect(normalizeDateStr('2026-08-28')).toBe('2026-08-28');
    expect(normalizeDateStr('2026/08/28')).toBe('2026-08-28');
    expect(normalizeDateStr('2026.8.5')).toBe('2026-08-05');

    // Excel 序列号格式 (46262 代表 2026-08-28)
    // 2026-08-28 UTC 毫秒差除以 86400000 + 25569 = 46262
    const excelSerial = 46262;
    expect(normalizeDateStr(excelSerial)).toBe('2026-08-28');

    // 无效输入
    expect(normalizeDateStr(null)).toBeNull();
    expect(normalizeDateStr('')).toBeNull();
    expect(normalizeDateStr('invalid-date')).toBeNull();
  });
  it('应当能正确解析任务列表导出 Excel 并聚合同一天的任务', async () => {
    const samplePath = 'D:/下载/任务列表导出_20260831151506.xlsx';
    let nodeFs: any = null;
    try {
      // @ts-ignore
      nodeFs = await import('fs');
    } catch (_) {}

    if (!nodeFs || !nodeFs.existsSync(samplePath)) {
      console.warn('测试环境未找到外部真实 Excel 文件，跳过外部路径读取');
      return;
    }

    const buffer = nodeFs.readFileSync(samplePath);
    const file = new File([buffer], 'tasks.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const parsedDays = await parseExcelFile(file);
    expect(parsedDays.length).toBeGreaterThan(0);

    const day28 = parsedDays.find((d) => d.date === '2026-08-28');
    expect(day28).toBeDefined();
    expect(day28?.title).toContain('宁波工行数据看板');
    expect(day28?.hours).toBe(4);
    expect(day28?.content).toContain('调整页面展示样式');

    // 检查是否覆盖了多个日期
    const day24 = parsedDays.find((d) => d.date === '2026-08-24');
    expect(day24).toBeDefined();
    expect(day24?.content).toContain('腾讯地图');
  });

  it('应当支持批量保存并触发进度回调', async () => {
    vi.spyOn(storage, 'saveLog').mockResolvedValue({ success: true, isOffline: false });

    const mockDays = [
      { date: '2026-08-01', title: '测试1', hours: 8, content: '内容1', cooperation: false, difficulty: false },
      { date: '2026-08-02', title: '测试2', hours: 8, content: '内容2', cooperation: true, difficulty: false }
    ];

    let progressCount = 0;
    const result = await batchSaveImportedLogs(mockDays, (cur, total) => {
      expect(total).toBe(2);
      progressCount = cur;
    });

    expect(result.successCount).toBe(2);
    expect(result.failCount).toBe(0);
    expect(progressCount).toBe(2);
  });
});
