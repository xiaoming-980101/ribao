export function getJobDisplayName(job, customJobName = '') {
  if (job === 'designer') return 'UI/UX 视觉设计师';
  if (job === 'tester') return '测试工程师';
  if (job === 'custom') return String(customJobName || '').trim() || '自定义岗位';
  return '前端开发工程师';
}

export function buildTaskSeed(userInput, job, mode, customJobName = '') {
  const currentMode = mode === 'idle' || mode === 'study' ? mode : 'task';
  const explicitInput = typeof userInput === 'string' ? userInput.trim() : '';

  if (currentMode === 'task' && explicitInput) {
    return `【${explicitInput}】`;
  }

  const jobName = getJobDisplayName(job, customJobName);
  const presets = job === 'designer'
    ? {
        task: '“设计开发：细化核心页面高保真视觉稿、核对产品线框流程、整理切图交付并走查开发还原效果”',
        idle: '“日常维护：整理历史项目高保真视觉源文件，清理本地 Figma 冗余图层和过期切图，核对组件间距、字号和颜色标注，并把常用素材重新归档”',
        study: '“设计预研：调研移动端 UI/UX 交互趋势，收集优秀商业设计案例，拆解几个常见页面的信息层级和动效细节，整理个人视觉提案思路”'
      }
    : (job === 'tester'
      ? {
          task: '“测试验证：执行提测功能用例、复测历史缺陷、补充异常场景和复现步骤，并整理回归测试结果”',
          idle: '“日常维护：整理回归测试清单，清理测试环境脏数据，复查历史缺陷状态，并抽查几个核心流程的稳定性”',
          study: '“测试预研：学习测试用例设计和自动化脚本稳定性优化，整理边界值、异常分支和兼容性检查点”'
        }
      : (job === 'custom'
        ? {
            task: `“${jobName}：推进当天事项处理，核对关键细节，整理过程记录，并确认后续需要跟进的问题”`,
            idle: `“${jobName}日常维护：整理近期资料 and 记录，检查已完成事项的后续状态，补齐遗漏信息并归档常用材料”`,
            study: `“${jobName}学习复盘：阅读岗位相关方法资料，复盘近期事项处理过程，整理可复用的检查清单和改进点”`
          }
        : {
        task: '“业务开发：编写日常模块页面与交互逻辑、配合后端完成数据联调、本地浏览器回归走查”',
        idle: '“日常维护：检查历史页面在不同宽度下的样式兼容和交互细节，清理控制台警告、无用日志和本地配置项，顺手梳理公共组件入参，并跑一遍常用页面回归自测”',
        study: '“技术预研：阅读前端工程化规范指南，在本地环境搭建测试 Demo，验证构建配置和组件写法差异，整理框架新特性笔记”'
      }));

  return presets[currentMode];
}

export function parseGeneratedLog(rawText) {
  const cleaned = rawText
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  let title = '日常开发维护';
  let content = cleaned;

  const titleMatch = cleaned.match(/(?:^|\n)\s*标题\s*[:：]\s*(.+?)(?=\n|$)/);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim().replace(/^["“]|["”]$/g, '');
  }

  const contentMatch = cleaned.match(/(?:^|\n)\s*内容\s*[:：]\s*([\s\S]+)/);
  if (contentMatch && contentMatch[1]) {
    content = contentMatch[1].trim();
  } else if (titleMatch) {
    content = cleaned
      .replace(/(?:^|\n)\s*标题\s*[:：]\s*.+?(?=\n|$)/, '')
      .trim();
  }

  content = content
    .replace(/(?:^|\n)\s*内容\s*[:：]\s*/g, '\n')
    .trim();

  if (title.length > 30) {
    title = title.slice(0, 30);
  }

  return { title, content };
}
