import { saveLog } from './storage';

export interface ParsedImportDay {
  date: string;
  title: string;
  hours: number;
  content: string;
  cooperation: boolean;
  difficulty: boolean;
  job?: string;
  isImported?: boolean;
}

export interface ImportResult {
  success: boolean;
  totalDays: number;
  dateRange: { start: string; end: string };
  importedList: ParsedImportDay[];
  error?: string;
}

/**
 * 格式化标准化日期 YYYY-MM-DD
 */
export function normalizeDateStr(val: any): string | null {
  if (val === undefined || val === null || val === '') return null;

  if (typeof val === 'number') {
    // 处理 Excel 序列号日期 (1900 日期系统，标准基准偏移 25569)
    // 强制使用 UTC 日期提取，彻底避免客户端本地时区（如 UTC+8）跨天截断误差
    const ms = Math.round((val - 25569) * 86400 * 1000);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  const match = str.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * 智能获取字段值（模糊正则匹配表头）
 */
function findRowValue(row: Record<string, any>, patterns: RegExp[]): any {
  for (const pattern of patterns) {
    for (const key of Object.keys(row)) {
      if (pattern.test(key.trim())) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return val;
        }
      }
    }
  }
  return '';
}

/**
 * 解析上传的 Excel 文件数据 (按需动态加载 xlsx 核心解析引擎)
 */
export async function parseExcelFile(file: File): Promise<ParsedImportDay[]> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Excel 文件中没有有效的数据表 (Sheet)');
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet);

  if (!rawRows || rawRows.length === 0) {
    throw new Error('未在 Excel 中解析到任何数据行');
  }

  // 按日期归类合并
  const dateMap: Record<string, any[]> = {};

  const datePatterns = [/实际完成时间/, /实际开始时间/, /工作日期/, /记录日期/, /截止时间/, /完成时间/, /开始时间/, /日期/, /时间/, /^date$/i];
  const titlePatterns = [/任务名称/, /任务标题/, /事项名称/, /工作事项/, /主题/, /^title$/i, /^summary$/i, /^name$/i, /^名称$/];
  const hourPatterns = [/实际工时/, /预计工时/, /工时\(h\)/i, /工时\(小时\)/, /工时/, /耗时/, /^hours?$/i];
  const contentPatterns = [/任务内容/, /工作内容/, /处理明细/, /工作总结/, /^内容$/, /^描述$/, /^content$/i, /^description$/i];

  rawRows.forEach((row) => {
    const timeVal = findRowValue(row, datePatterns);
    const dateStr = normalizeDateStr(timeVal);
    if (dateStr) {
      if (!dateMap[dateStr]) dateMap[dateStr] = [];
      dateMap[dateStr].push(row);
    }
  });

  const parsedDays: ParsedImportDay[] = [];

  Object.entries(dateMap).forEach(([dateStr, items]) => {
    let totalHours = 0;
    const contents: string[] = [];
    let mainTitle = '';

    items.forEach((item, idx) => {
      // 标题
      const itemTitle = String(findRowValue(item, titlePatterns) || '').trim();
      if (!mainTitle && itemTitle) {
        mainTitle = itemTitle;
      }

      // 工时
      const rawHourVal = findRowValue(item, hourPatterns);
      const rawHour = parseFloat(String(rawHourVal || 0));
      if (!isNaN(rawHour) && rawHour > 0) {
        totalHours += rawHour;
      }

      // 内容
      let rawContent = String(findRowValue(item, contentPatterns) || '').trim();
      if (!rawContent && itemTitle) {
        rawContent = itemTitle;
      }

      if (rawContent) {
        // 如果同一天有多条任务，添加序号与名称标注
        if (items.length > 1) {
          const prefix = itemTitle && !rawContent.includes(itemTitle) ? `【${itemTitle}】` : '';
          contents.push(`${idx + 1}. ${prefix}${rawContent}`);
        } else {
          contents.push(rawContent);
        }
      }
    });

    const finalTitle = mainTitle || `${dateStr} 工作日志`;
    const finalContent = contents.join('\n') || finalTitle;
    const finalHours = totalHours > 0 ? Math.round(totalHours * 10) / 10 : 8;

    const lowerAll = (finalTitle + ' ' + finalContent).toLowerCase();
    const cooperation = /对接|联调|协同|协作|走查|交付|评审|会议|跟进/.test(lowerAll);
    const difficulty = /修复|bug|缺陷|异常|排查|重构|死锁|崩溃|兼容/.test(lowerAll);

    parsedDays.push({
      date: dateStr,
      title: finalTitle,
      hours: finalHours,
      content: finalContent,
      cooperation,
      difficulty,
      isImported: true
    });
  });

  // 按日期正序排列
  parsedDays.sort((a, b) => a.date.localeCompare(b.date));

  return parsedDays;
}

/**
 * 批量将解析出的工作日志直接覆盖保存至系统
 */
export async function batchSaveImportedLogs(
  days: ParsedImportDay[],
  onProgress?: (current: number, total: number) => void
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < days.length; i++) {
    const item = days[i];
    try {
      const res = await saveLog(item.date, {
        title: item.title,
        hours: item.hours,
        content: item.content,
        cooperation: item.cooperation,
        difficulty: item.difficulty,
        isAutoGenerated: false,
        isImported: true
      });

      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
    }

    if (onProgress) {
      onProgress(i + 1, days.length);
    }
  }

  return { successCount, failCount };
}
