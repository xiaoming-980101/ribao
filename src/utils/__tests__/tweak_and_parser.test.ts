import { describe, it, expect } from 'vitest';
// @ts-expect-error server/.js module outside tsconfig include scope, resolved by vitest
import { parseGeneratedLog } from '../../../server/utils/aiPrompt.js';

describe('parseGeneratedLog & Tweak Format Robustness Tests', () => {
  it('应正确解析标准 标题 + 内容 格式', () => {
    const raw = '标题：页面样式与布局适配调优\n内容：今天排查了不同机型下的布局错位问题，优化了弹性盒自适应逻辑，本地自测正常。';
    const res = parseGeneratedLog(raw, '原标题', '原内容');
    expect(res.title).toBe('页面样式与布局适配调优');
    expect(res.content).toBe('今天排查了不同机型下的布局错位问题，优化了弹性盒自适应逻辑，本地自测正常。');
    expect(res.content).not.toContain('标题：');
  });

  it('当大模型截断只输出了标题时，必须保留原内容，绝不能把标题内容塞入正文', () => {
    const raw = '标题：多条件筛选分页联动优化';
    const originalContent = '今天主要调试了数据看板多条件筛选与分页的联动逻辑，解决了重置搜索条件时页码未归位的问题，核对了查询参数的传递格式，本地回归测试正常。';
    const res = parseGeneratedLog(raw, '多条件筛选分页联动优化', originalContent);
    expect(res.title).toBe('多条件筛选分页联动优化');
    expect(res.content).toBe(originalContent);
    expect(res.content).not.toContain('标题：');
  });

  it('应正确解析带 Markdown 加粗的 **标题** 与 **内容**', () => {
    const raw = '**标题**：新接口数据联调与报错兜底\n**内容**：配合后端联调了新接口，核对了字段结构，并增加了异常空态提示。';
    const res = parseGeneratedLog(raw);
    expect(res.title).toBe('新接口数据联调与报错兜底');
    expect(res.content).toBe('配合后端联调了新接口，核对了字段结构，并增加了异常空态提示。');
  });

  it('当大模型直接输出连贯的一段话而没有标题前缀时，应正确解析', () => {
    const raw = '今天主要跟进处理了测试提测反馈的几处交互缺陷，修复了弹窗关闭后状态未及时重置的偶发问题，已在测试环境验证通过。';
    const res = parseGeneratedLog(raw, '默认标题', '默认内容');
    expect(res.content).toBe(raw);
    expect(res.title.length).toBeGreaterThan(0);
  });

  it('当大模型输出带有 1. 2. 序号时，自动清洗为自然连贯的一段话', () => {
    const raw = '标题：表单输入校验排查\n内容：\n1. 排查了表单切换时的必填校验遗漏。\n2. 优化了下拉联动与禁用态逻辑。\n3. 本地自测通过。';
    const res = parseGeneratedLog(raw);
    expect(res.title).toBe('表单输入校验排查');
    expect(res.content).not.toContain('1.');
    expect(res.content).not.toContain('2.');
    expect(res.content).not.toContain('3.');
    expect(res.content).toContain('排查了表单切换时的必填校验遗漏');
  });
  it('多行内容必须按行重新连接，不得把相邻两行的末尾与开头粘成一个词', () => {
    // 模型未按「一段话」要求输出、且行尾没有标点时，旧实现直接删换行会粘连成「缓存击穿优化了」
    const raw = '标题：缓存与并发排查' + '\n' + '内容：' + '\n' + '排查用户中台的 Redis 缓存击穿' + '\n' + '优化了并发下单的重复提交拦截';
    const res = parseGeneratedLog(raw);
    expect(res.title).toBe('缓存与并发排查');
    expect(res.content).not.toContain('缓存击穿优化了');
    expect(res.content.split('\n')).toEqual([
      '排查用户中台的 Redis 缓存击穿',
      '优化了并发下单的重复提交拦截'
    ]);
  });

  it('空行与多余空白应被清理，不产生连续空行', () => {
    const raw = '标题：日常维护' + '\n' + '内容：' + '\n' + '清理废弃组件。' + '\n' + '\n' + '   ' + '\n' + '补充空态提示。';
    const res = parseGeneratedLog(raw);
    expect(res.content).toBe('清理废弃组件。' + '\n' + '补充空态提示。');
  });
});
