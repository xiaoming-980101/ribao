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

  it('应能够成功剥离 <think>...</think> 标签并提取真实标题与内容', () => {
    const raw = `<think>
The user wants to generate a frontend daily log.
Role: Senior Frontend Engineer.
Task: TypeScript typing规范.
</think>
标题：复杂业务数据TypeScript类型规范
内容：推进复杂业务数据TypeScript类型规范沉淀，梳理接口数据转换中的类型声明与通用泛型工具，建立团队代码规范笔记，本地验证自测正常。`;
    const res = parseGeneratedLog(raw);
    expect(res.title).toBe('复杂业务数据TypeScript类型规范');
    expect(res.content).toContain('推进复杂业务数据TypeScript类型规范沉淀');
    expect(res.content).not.toContain('<think>');
    expect(res.content).not.toContain('The user wants to generate');
  });

  it('应能够成功剥离带有 Here\'s a thinking process 前缀的思考链并提取中文结果', () => {
    const raw = `Here's a thinking process:
**Analyze the Request:**
- **Role:** Senior Front-end Engineer, rigorous, efficient.
- **Task:** Extract the given input into a concise, professional work item record.
**Drafting - Step-by-step:**
**Title extraction (8-14 chars):**
Need to encapsulate the essence. Options:
- 复杂业务数据TypeScript类型规范 (10 chars)

标题：复杂业务数据TypeScript类型规范
内容：推进复杂业务数据TypeScript类型规范沉淀，梳理接口数据转换中的类型声明与通用泛型工具，建立团队代码规范笔记，本地验证自测正常。`;
    const res = parseGeneratedLog(raw);
    expect(res.title).toBe('复杂业务数据TypeScript类型规范');
    expect(res.content).toBe('推进复杂业务数据TypeScript类型规范沉淀，梳理接口数据转换中的类型声明与通用泛型工具，建立团队代码规范笔记，本地验证自测正常。');
    expect(res.title).not.toContain("Here's a think");
    expect(res.content).not.toContain("Analyze the Request");
  });

  it('当大模型仅输出了英文思考过程而未输出中文正文时，应标记为 isInvalid', () => {
    const raw = `Here's a thinking process:
**Analyze the Request:**
- **Role:** Senior Front-end Engineer, rigorous, efficient.
- **Task:** Extract the given input into a concise, professional work item record.
- **Rules:**
- No diary style (no "today I did this", "first A then B")
- No bullet points, must be 1-2 sentences
- Length: 40-80 Chinese characters`;
    const res = parseGeneratedLog(raw, '默认标题', '默认内容');
    expect(res.isInvalid).toBe(true);
    expect(res.title).not.toBe("Here's a think");
    expect(res.content).not.toContain("Analyze the Request");
  });

  it('参考 DEEIX-Chat: 支持解析 parts 数组及混合 reasoning 结构', async () => {
    // @ts-expect-error test import
    const { extractResponseText, stripThinkingProcess } = await import('../../../server/utils/modelUtils.js');

    // 1. Array of parts with reasoning type
    const apiData1 = {
      choices: [{
        message: {
          content: [
            { type: 'thought', text: 'thinking about user requirements' },
            { type: 'text', text: '标题：微前端应用隔离与沙箱治理\n内容：推进微前端主子应用间 CSS 隔离与 JS 沙箱优化，本地联调通过。' }
          ]
        }
      }]
    };
    const { rawText: raw1 } = extractResponseText(apiData1);
    expect(raw1).toBe('标题：微前端应用隔离与沙箱治理\n内容：推进微前端主子应用间 CSS 隔离与 JS 沙箱优化，本地联调通过。');
    const parsed1 = parseGeneratedLog(raw1);
    expect(parsed1.title).toBe('微前端应用隔离与沙箱治理');

    // 2. Reasoning in reasoning_content field (DeepSeek-R1 / QwQ)
    const apiData2 = {
      choices: [{
        message: {
          reasoning_content: 'Let me think step by step...',
          content: '标题：支付回调异步重试队列\n内容：重构第三方支付 Webhook 回调验签与幂等消费逻辑，自测重试机制正常。'
        }
      }]
    };
    const { rawText: raw2 } = extractResponseText(apiData2);
    expect(raw2).toBe('标题：支付回调异步重试队列\n内容：重构第三方支付 Webhook 回调验签与幂等消费逻辑，自测重试机制正常。');

    // 3. Various thinking tags: <thought>, <thinking>, <|begin_of_thought|>
    const rawWithThoughtTags = '<thought>User is frontend engineer</thought>标题：长列表虚拟滚动性能调优\n内容：针对百万级数据表格引入虚拟列表渲染，优化滚动掉帧现象，自测帧率稳定在 60fps。';
    const stripped = stripThinkingProcess(rawWithThoughtTags);
    expect(stripped).not.toContain('<thought>');
    expect(stripped).toContain('长列表虚拟滚动性能调优');
  });

  it('当在无任务(idle)或架构预研(study)模式下选中了方向卡片时，buildPrompts 必须精准采用选中的卡片内容，绝不能随机生成其他事项', async () => {
    // @ts-expect-error test import
    const { buildPrompts, buildTaskSeed } = await import('../../../server/utils/aiPrompt.js');

    const selectedCardInput = '【负责系统/平台：宁波数据看板h5】看板定时刷新状态同步优化：优化宁波数据看板h5定时刷新时用户操作被重置问题，暂停刷新并在交互后恢复，更新状态提示';
    
    // 测试 buildTaskSeed
    const seed = buildTaskSeed(selectedCardInput, 'frontend', 'idle');
    expect(seed).toBe(`【${selectedCardInput}】`);
    expect(seed).toContain('宁波数据看板h5');
    expect(seed).toContain('看板定时刷新状态同步优化');

    // 测试 buildPrompts
    const { userPrompt } = buildPrompts({
      userInput: selectedCardInput,
      job: 'frontend',
      mode: 'idle'
    });
    expect(userPrompt).toContain('宁波数据看板h5');
    expect(userPrompt).toContain('看板定时刷新状态同步优化');
    expect(userPrompt).not.toContain('长列表加载性能与防抖节流');
  });
});



