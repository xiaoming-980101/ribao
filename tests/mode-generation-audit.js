import { expandUserInput, generateRandomDaily, generateLocalDirectionSuggestions, generateAIPrompt } from '../src/utils/generator.ts';

console.log('================================================================');
console.log('📋 4 大模式生成内容深度审查与样本探测');
console.log('================================================================\n');

const roles = ['frontend', 'backend'];

roles.forEach(role => {
  console.log(`\n=================== 岗位: ${role} ===================`);
  
  // 1. 推荐库
  const idlePool = generateLocalDirectionSuggestions(role, 'idle');
  console.log(`\n[系统维护 idle 推荐库样本]：`);
  idlePool.slice(0, 3).forEach((item, i) => {
    console.log(`  ${i+1}. [${item.tag}] ${item.title} -> ${item.summary}`);
  });

  const studyPool = generateLocalDirectionSuggestions(role, 'study');
  console.log(`\n[架构预研 study 推荐库样本]：`);
  studyPool.slice(0, 3).forEach((item, i) => {
    console.log(`  ${i+1}. [${item.tag}] ${item.title} -> ${item.summary}`);
  });

  // 2. 本地生成
  console.log(`\n[模式 1: 迭代任务 (用户输入: 联调订单支付与结算接口，排查金额精度计算Bug)]`);
  const taskSample = expandUserInput('联调订单支付与结算接口，排查金额精度计算Bug', role);
  console.log(`  标题: ${taskSample.title}`);
  console.log(`  正文: ${taskSample.content}`);

  console.log(`\n[模式 2: 系统维护 (无输入，自动生成)]`);
  const idleSample = generateRandomDaily('2026-09-03', false, role);
  console.log(`  标题: ${idleSample.title}`);
  console.log(`  正文: ${idleSample.content}`);

  console.log(`\n[模式 3: 架构预研 (无输入，技术学习生成)]`);
  const studySample = generateRandomDaily('2026-09-03', true, role);
  console.log(`  标题: ${studySample.title}`);
  console.log(`  正文: ${studySample.content}`);

  console.log(`\n[模式 4: 事项模板 / AI Prompt]`);
  const promptSample = generateAIPrompt('排查登录过期与Token刷新拦截', role);
  console.log(`  生成提示词开头: ${promptSample.slice(0, 100).replace(/\n+/g, ' ')}...`);
});

console.log('\n================================================================');
console.log('✅ 4 大模式生成样本审查完成');
console.log('================================================================');

