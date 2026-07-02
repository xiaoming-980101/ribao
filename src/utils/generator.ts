/**
 * 赢日志 - 智能日志生成与查重引擎 (超级语料库、去AI感、防重自检测版)
 */

// 1. 各岗位日常/无任务模板语料库 (每组扩充至20-25条，口语流水账，彻底消除AI腔)
const JOB_TEMPLATES: Record<string, { actions: string[][]; study: string[][] }> = {
  frontend: {
    actions: [
      [
        '把页面上一些重复的公共逻辑提取了一下，改成了通用的 Hook',
        '顺手把项目打包配置调整了下，删掉了几个没怎么用的第三方包',
        '在一些核心的代码里加了点空值校验和容错处理，防患未然',
        '调整了下数据量大时页面有点卡顿的问题，优化了下列表的渲染方式',
        '把项目里一些没用的废弃代码和没生效的 CSS 样式清理了下',
        '给页面上的几个高频交互按钮加了防抖，省得测试狂点导致重复请求',
        '配合测试修了下老旧手机上页面样式错位和兼容的一些小问题',
        '把之前的 API 请求层理了理，规范了接口报错时候的捕获逻辑',
        '把页面上几个图片加载慢的地方改成了图片懒加载，优化了占位图',
        '把代码里几处可能会报 Undefined 错误的地方加上了可选链保护',
        '顺手把控制台里遗留的几个警告信息排查并处理了下，干净了许多',
        '处理了下大表单页面输入时有点延迟的卡顿，优化了局部组件更新',
        '把项目里过期的几个依赖库升了下版本，顺便解决了下版本冲突',
        '把全局样式文件里重复定义的几个 CSS 颜色变量做了下归类和提取',
        '检查了下路由配置文件，把几个没怎么用的静态路由做了解耦',
        '把部分页面的图片格式转换了一下，换成了更省带宽的 WebP 格式',
        '把本地的接口 Mock 配置文件理了理，把几个新接口的数据模拟加上了',
        '顺手清理了下本地 Git 分支，把之前合过的主干没用的临时分支删了删',
        '把页面上的几个弹窗组件的动画效果调了调，感觉滑出来顺畅了一些',
        '把几个核心列表的请求增加了下拉刷新和触底加载更多的数据边界判断'
      ],
      [
        '在本地全部跑了一遍自测，老功能运行都没什么大问题',
        '降低了代码重复率，后面写新需求的时候应该会快一点',
        '网络不好的时候页面不容易卡死，容错展示稍微稳定了一些',
        '页面滚起来比之前顺畅了，整体交互体验好了一点点',
        '项目代码干净了不少，本地启动和打包速度也快了一点',
        '顺便把组件的使用说明写了写，方便其他同事后面协作',
        '经本地调试和测试环境验证，改动的地方都没什么大问题',
        '顺便给开发联调省了点时间，接口挂了也有友好的报错提示',
        '这样在弱网环境下首屏加载能快一些，消除了大段空白时间',
        '控制台报错少了很多，本地开发的体验也顺畅了一些',
        '避免了频繁输入时整页重绘的问题，输入框响应灵敏多了',
        '打包出来的静态资源文件小了十几KB，服务器加载速度小幅提升',
        '这样在分辨率比较尴尬的屏幕上也不会出现文字重叠的毛病了',
        '方便后续在不同分支切换联调时更清爽，避免本地分支混乱',
        '防止了极端网络报错时页面直接展示大白屏，交互细节稍微强了点',
        '老业务的回归测试都通过了，本地跑了几遍流程都没报错',
        '至少目前本地部署打包没出什么警告，环境整体感觉挺健康'
      ]
    ],
    study: [
      [
        '看了看 React 18 并发渲染机制的相关文章和文档',
        '研究了下 Vite 打包工具的一些高级优化技巧和构建提速方案',
        '学了下 TypeScript 5.x 版本的新特性，主要是高级类型用法',
        '看了一下微前端架构的接入方案，研究了下主子应用怎么通信',
        '学了下前端单测工具 Vitest，看了看怎么写基础测试用例',
        '调研了下目前前端异常监控系统的接入方式，看了看日志上报原理',
        '了解了下前端自动化 CI/CD 流程的配置方法，看了看脚本编写'
      ],
      [
        '在本地新建了个测试分支写了点 Demo 跑了跑，效果还行',
        '记了点学习笔记整理到团队知识库里了，方便大家以后查阅',
        '为以后复杂页面的性能优化和强类型校验先做做技术储备',
        '结合咱们现在的项目评估了下，整理了一份简单的优化思路',
        '在本地非核心模块编写了样板测试，方便后续在全组尝试推广',
        '看看后续能不能把项目提交自动部署的那套脚本优化得更省时一点',
        '方便后面在项目重构时能提供一键定位线上报错的能力'
      ]
    ]
  },
  designer: {
    actions: [
      [
        '整理并优化了现有的 UI 设计规范组件库，统一了页面间距和字号',
        '对前端已经还原上线的几个核心页面进行了视觉和交互走查',
        '收集并分类整理了一些优秀的移动端交互设计案例与配图素材',
        '把上个版本完结的稿件进行了规范重命名和图层归档，删掉了草稿',
        '配合开发的同事，给他们补切了几个特殊分辨率的 Icon 图标',
        '整理了近期项目的设计交付源文件，更新了团队云盘的设计资源',
        '检查了下新版页面在不同尺寸手机上的显示效果，微调了部分间距',
        '把之前积攒的几个零碎的样式修改需求集中处理了下，更新了设计稿',
        '把设计稿上的颜色规范梳理了一遍，剔除了几处相近的杂乱配色',
        '和产品对了下后续版本的需求走向，做了一些粗略的线框图构思',
        '处理了几个复杂图表的视觉呈现方式，尝试改成了更清晰的折线图',
        '把设计协作软件里的多余过期页面清理了下，归档了已上线历史页',
        '调整了页面中几个插图的视觉细节，使得整体设计调性更加统一',
        '针对大屏幕电脑做了响应式设计稿的间距微调，规避了拉伸后空洞的毛病',
        '把一些老旧页面的背景色与字体对比度调了调，提升了视觉可读性'
      ],
      [
        '把发现的切图模糊和字体字号不对的问题列成 Bug 反馈给开发了',
        '这样后面的设计产出可以直接用规范组件，效率应该会高不少',
        '给自己的设计素材库充了充电，后面做新需求时能多点灵感',
        '删掉了本地一堆杂乱的临时图层，把设计云盘的空间腾了腾',
        '顺便和前端确认了下部分复杂动效的实现细节，确保还原度',
        '方便后面新加入的同事协作时直接调用，省得重复对间距',
        '把微调后的高保真视觉图重新上传到协作平台了，跟产品对了一下',
        '切图文件都已经按规范命好名了，发在开发群里供开发替换使用',
        '这样界面整体的色彩统一性高了很多，不会看起来五颜六色的了',
        '把几个复杂的交互流程线框图梳理出来了，跟产品对了对基本逻辑',
        '老版本的设计包都备份归档了，协作平台上只保留目前最新的工作面',
        '这样在大屏展示下版面也比较饱满，视觉比例看着舒服多了',
        '至少目前来看，界面在几个常用机型下的显示比例基本稳定了'
      ]
    ],
    study: [
      [
        '研究了下目前前沿的 AI 辅助设计工具，看了看怎么用它生成插画',
        '看了一些关于 UI 动效设计和微交互原则的优秀案例与教程',
        '学了下最新版 Figma 的变量 (Variables) 功能和响应式布局组件用法',
        '调研了下目前流行的 B 端暗黑模式设计规范和色彩搭配技巧',
        '看了看前端基础的 CSS 布局知识，研究下怎么写有利于开发还原',
        '研究了下目前国外几个大厂的优秀排版和网格系统规则'
      ],
      [
        '在本地动手做了几个小 Demo 练习了下，感觉对提高效率挺有用',
        '整理了份暗黑模式配色指南记在文档里，方便后面做暗黑皮肤时参考',
        '以后做组件库时可以直接用变量来控颜色和间距，改起来会快很多',
        '这样以后跟开发小哥沟通动画效果时就更顺畅了，能降低沟通成本',
        '整理出了一份网格间距规范，打算后续跟组里其他成员对一对看看'
      ]
    ]
  }
};

// 极简日志名称
const JOB_TITLES: Record<string, { random: string[]; study: string[] }> = {
  frontend: {
    random: [
      '前端公共逻辑提取与优化', '日常代码整理与无用依赖清理', '项目打包配置优化与调试', 
      '页面卡顿优化与缺陷修复', '冗余代码清理与组件整理', '表单输入优化与防抖增加',
      '样式规范重整与兼容处理', '接口请求层规范与异常捕获'
    ],
    study: ['React并发机制学习', '打包优化方案调研', 'TS高级类型学习', '微前端方案预研', '前端单元测试学习', '前端异常上报机制调研']
  },
  designer: {
    random: [
      'UI设计规范整理与统一', '前端页面视觉走查反馈', '设计素材收集与资源归档', 
      '设计稿图层规范化整理', '切图标注交付与动效对接', '界面高保真视觉细节优化',
      '跨端分辨率适配视觉微调', '历史稿件规范命名与备份'
    ],
    study: ['AI设计工具预研', '微交互动画设计学习', 'Figma新特性与变量学习', '暗黑模式设计规范调研', 'CSS布局与还原规范学习', '前沿网格布局规则研究']
  }
};

// 3. 扩写关键字匹配规则 (前端/设计师)
interface KeywordRule {
  title: string;
  descriptions: string[];
  cooperation: boolean;
  difficulty: boolean;
}

const FRONTEND_KEYWORD_MAPS: Record<string, KeywordRule> = {
  '登录': {
    title: '用户登录模块开发调试',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '把用户登录 and 注册页面画了下，顺便加了下表单的基础校验。',
      '把登录接口调通了，处理了本地 Token 存储和请求拦截器携带的逻辑。',
      '处理了下登录过期自动跳回登录页和无感刷新的问题，交互更顺了。'
    ]
  },
  '页面': {
    title: '业务页面还原与适配',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '写了写几个核心业务页面的布局，顺便调了下手机端的适配。',
      '把页面拆成了几个复用的小组件，方便后面其他页面直接用。',
      '调了下复杂的表格布局样式，顺便修了下老旧浏览器兼容问题。'
    ]
  },
  '接口': {
    title: 'API接口对接与联调',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '跟后端对了一下接口，调通了数据，顺便把 TypeScript 的类型写了写。',
      '处理了下接口加载超时和断网报错时的兜底提示，防止页面空白。',
      '把页面上几个重复的接口请求合并了下，减少了点网络请求开销。'
    ]
  },
  '联调': {
    title: '业务接口前后端联调',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '和后端一块联调了几个业务接口，对了一下数据格式，都没什么问题。',
      '本地用 Mock 模拟了几个极端的接口状态码，把自测用例跑了一遍。',
      '优化了页面刚进去时接口并发加载的顺序，页面渲染稍微快了一点。'
    ]
  },
  'bug': {
    title: '偶发Bug排查与修复',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '排查并修了测试反馈的几个偶发 Bug，加了些空值校验防止页面崩。',
      '解决了某些机型下列表滑不动以及样式错位的问题。',
      '把历史积攒的几个小缺陷集中修了下，在本地把自测跑了一遍。'
    ]
  },
  '优化': {
    title: '前端页面性能调优',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '优化了下项目打包出来的文件体积，删掉了生产包里打印的 console。',
      '把页面上的大图片压缩了下，顺便加了懒加载，首屏加载快了点。',
      '解决了交互时组件老是重复渲染的问题，滚动页面比之前顺滑了。'
    ]
  },
  '重构': {
    title: '核心业务逻辑代码重构',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '把之前写得比较乱的旧模块代码理了理，把数据层 and 视图层分开了下。',
      '把里面的业务状态管理逻辑重构了下，理顺了组件间的传参规则。',
      '删掉了好几处重复写的冗余代码，用公共函数做了一下统一。'
    ]
  }
};

const DESIGNER_KEYWORD_MAPS: Record<string, KeywordRule> = {
  '设计': {
    title: '业务高保真视觉稿设计',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '根据产品画的原型需求，把几个核心页面的视觉稿设计了一下，对了下整体的交互。',
      '把新需求的高保真视觉设计稿画完了，调整了下局部的配色和视觉层级关系。',
      '把新版页面的设计方案细化了下，处理了按钮状态、异常空状态等细节设计。'
    ]
  },
  '视觉': {
    title: '界面视觉设计开发',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '对核心模块进行了视觉改版升级，调整了色彩搭配和间距规范，让界面更清爽。',
      '把这期的海报和宣传配图画了下，出了两版不同的排版方案供产品选择。'
    ]
  },
  '切图': {
    title: '设计稿切图标注与交付',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '把做好的设计稿切图和标注整理好了，上传到了平台，跟前端对接了下切图大小。',
      '给开发同事补切了几个特定尺寸的图标，顺便对了下他们本地实现的效果。'
    ]
  },
  '标注': {
    title: '设计交付标注规范整理',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '完善了视觉稿上的组件间距标注，对一些特殊交互动效做了文字说明，方便开发协作。'
    ]
  },
  '走查': {
    title: '已开发页面视觉走查',
    cooperation: true,
    difficulty: true,
    descriptions: [
      '对前端开发还原出来的页面进行了视觉走查，列出了几个像素对不齐的 Bug。',
      '和前端一块看了看已上线的页面，把字体、颜色对了一下，调了几个错位的地方。'
    ]
  },
  '原型': {
    title: '产品原型需求分析与设计',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '理了理产品给的原型需求，把大概的设计思路和排版版面规划了一下。',
      '把核心流程的草图和线框图画了画，跟产品对了一下底层的交互逻辑。'
    ]
  }
};

// 通用口语兜底
const GENERAL_EXPANDS = [
  '照着排期继续写写业务代码，并在本地跑了跑自测。',
  '把日常开发里的一些小细节调了调，功能运行都没什么大问题。',
  '跟产品、后端一块对了对需求，确保后面做出来效果一致。',
  '完成了改动范围内的全部功能自测，随时可以提给测试。'
];

const DESIGNER_GENERAL_EXPANDS = [
  '推进了相关模块的设计细化，顺便做好了交付文件的整理。',
  '把日常设计方案中的一些小间距调了调，保证整体视觉效果一致。',
  '跟产品、前端一块对了对交互逻辑，确保开发出来的还原度。',
  '完成了这期改动范围内的全部视觉稿输出，随时可以交付给开发。'
];

export interface GeneratedLogResult {
  title: string;
  hours: number;
  cooperation: boolean;
  difficulty: boolean;
  content: string;
}

/**
 * 随机获取数组中的一个元素
 */
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 1. 核心生成逻辑：针对无任务的随机混淆生成 (真随机，且单次提取100%去重)
 */
export function generateRandomFrontendDaily(
  date: string,
  isStudyMode: boolean = false,
  job: string = 'frontend'
): GeneratedLogResult {
  const template = JOB_TEMPLATES[job] || JOB_TEMPLATES.frontend;
  const titles = JOB_TITLES[job] || JOB_TITLES.frontend;

  const lines: string[] = [];
  let title = '';

  if (isStudyMode) {
    title = getRandomElement(titles.study);
    const count = Math.random() > 0.5 ? 1 : 2;
    const p1Pool = [...template.study[0]];
    const p2Pool = [...template.study[1]];

    for (let i = 0; i < count; i++) {
      if (p1Pool.length === 0 || p2Pool.length === 0) break;
      const idx1 = Math.floor(Math.random() * p1Pool.length);
      const part1 = p1Pool.splice(idx1, 1)[0];
      const idx2 = Math.floor(Math.random() * p2Pool.length);
      const part2 = p2Pool.splice(idx2, 1)[0];

      lines.push(`${i + 1}. ${part1}，${part2}。`);
    }
  } else {
    title = getRandomElement(titles.random);
    const count = Math.random() > 0.5 ? 2 : 3;
    const p1Pool = [...template.actions[0]];
    const p2Pool = [...template.actions[1]];

    for (let i = 0; i < count; i++) {
      if (p1Pool.length === 0 || p2Pool.length === 0) break;
      const idx1 = Math.floor(Math.random() * p1Pool.length);
      const part1 = p1Pool.splice(idx1, 1)[0];
      const idx2 = Math.floor(Math.random() * p2Pool.length);
      const part2 = p2Pool.splice(idx2, 1)[0];

      lines.push(`${i + 1}. ${part1}，${part2}。`);
    }
  }

  return {
    title,
    hours: 8,
    cooperation: false,
    difficulty: false,
    content: lines.join('\n')
  };
}

/**
 * 2. 核心生成逻辑：根据用户输入进行智能扩写
 */
export function expandUserInput(userInput: string, job: string = 'frontend'): GeneratedLogResult {
  const trimmed = userInput.trim();
  if (!trimmed) {
    const randomSeed = new Date().toISOString() + Math.random().toString();
    return generateRandomFrontendDaily(randomSeed, false, job);
  }

  const keywordMaps = job === 'designer' ? DESIGNER_KEYWORD_MAPS : FRONTEND_KEYWORD_MAPS;
  const generalExpands = job === 'designer' ? DESIGNER_GENERAL_EXPANDS : GENERAL_EXPANDS;

  const tasks = trimmed.split(/[,，\s;；\n]+/).filter(Boolean);
  const lines: string[] = [];
  
  let finalTitle = '';
  let finalCooperation = false;
  let finalDifficulty = false;

  tasks.forEach((task, index) => {
    let matchedPrefix = '';
    let matchedExpandedText = '';
    let matchedRule: KeywordRule | null = null;

    for (const key in keywordMaps) {
      if (task.toLowerCase().includes(key)) {
        matchedPrefix = `[${task}]：`;
        matchedRule = keywordMaps[key];
        matchedExpandedText = getRandomElement(matchedRule.descriptions);
        break;
      }
    }

    if (matchedRule) {
      const lineLeader = job === 'designer' ? '' : (matchedRule.descriptions.indexOf(matchedExpandedText) === 0 ? '主要' : '下午');
      lines.push(`${index + 1}. ${lineLeader}${matchedPrefix}${matchedExpandedText}`);
      
      if (matchedRule.cooperation) finalCooperation = true;
      if (matchedRule.difficulty) finalDifficulty = true;
      
      if (!finalTitle) {
        finalTitle = matchedRule.title;
      }
    } else {
      const baseExpand = getRandomElement(generalExpands);
      lines.push(`${index + 1}. 处理了[${task}]相关工作，${baseExpand}`);
    }
  });

  if (!finalTitle) {
    if (tasks.length > 0) {
      finalTitle = `${tasks[0].substring(0, 15)}${job === 'designer' ? '日常设计细化' : '日常功能开发'}`;
    } else {
      finalTitle = job === 'designer' ? '日常视觉设计工作' : '前端业务代码编写';
    }
  }

  if (finalTitle.length > 30) {
    finalTitle = finalTitle.substring(0, 27) + '...';
  }

  // 单条扩写时的口语自测自检后缀
  if (lines.length === 1 && !userInput.includes('优化') && !userInput.includes('重构') && !userInput.includes('走查')) {
    const maintenanceLines = JOB_TEMPLATES[job]?.actions[0] || JOB_TEMPLATES.frontend.actions[0];
    const p1 = getRandomElement(maintenanceLines);
    lines.push(`2. 顺手${p1.charAt(0).toLowerCase() + p1.slice(1)}，自测觉得没什么大问题。`);
  }

  return {
    title: finalTitle,
    hours: 8,
    cooperation: finalCooperation,
    difficulty: finalDifficulty,
    content: lines.join('\n')
  };
}

/**
 * 3. 核心查重算法：Levenshtein Distance 自动编辑距离计算
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const clean = (s: string) => s.replace(/[\s\d.、,，.。;；?？!！]/g, '');
  const s1 = clean(str1);
  const s2 = clean(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  const len1 = s1.length;
  const len2 = s2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  const similarity = (1 - distance / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * 4. 评估相似度等级
 */
export function getSimilarityLevel(similarity: number, threshold: number = 50): {
  level: 'safe' | 'warning' | 'danger';
  color: string;
  text: string;
} {
  if (similarity < 30) {
    return { level: 'safe', color: '#10B981', text: '安全（与历史记录相似度极低）' };
  } else if (similarity < threshold) {
    return { level: 'warning', color: '#F59E0B', text: '中等（存在一定的局部重复表达）' };
  } else {
    return { level: 'danger', color: '#EF4444', text: '高危（相似度高，可能被判定为重复/敷衍！）' };
  }
}

/**
 * 5. 核心大模型 Prompt 生成器 (豆包专版)
 */
export function generateAIPrompt(userInput: string, job: string): string {
  const jobName = job === 'designer' ? 'UI/UX 视觉设计师' : '前端开发工程师';
  const tasksText = userInput.trim()
    ? `【${userInput.trim()}】`
    : '“日常基础代码库维护与细节调优（今天没有特定大需求上线，主要进行排错与代码整理自测）”';

  const examples = job === 'designer' ? `
* ❌ 反面例子（太虚太浮夸，HR一眼看穿是AI）：
“针对产品核心展示模块进行了全方位的交互体验设计与视觉包装升级，构建了高复用的视觉规范，显著提升了页面在跨终端环境下的用户体感和开发对接效率。”
* 🟢 正面例子（非常写实自然，工作量饱和）：
“跟产品对了对下期需求的线框图，理了理几个复杂的页面跳转逻辑。下午把这期核心的高保真视觉设计稿细化了下，顺便把本地图层重新命名归档整理了下，给云盘腾了腾空间。”
` : `
* ❌ 反面例子（太虚太浮夸，HR一眼看穿是AI）：
“深度重构了系统核心列表渲染组件，引入了基于虚拟滚动的高效异步加载算法，成功缩减了打包体积，显著优化了页面在低端机型下的首屏交互流畅度。”
* 🟢 正面例子（非常写实自然，工作量饱和）：
“把首页列表数据多的时候有点卡顿的问题给优化了下，改成了按需懒加载渲染。顺手把项目打包的配置文件精简了下，清理了几个过期不用的包，在本地跑了下回归测试。”
`;

  return `你是一个在公司里默默搬砖、踏实干活的专业 ${jobName}。我今天主要做的工作是：${tasksText}。请根据我的工作内容，帮我写一份日常工作日志。

要求：
1. 语气必须高度口语化、平实写实，像真人随手写的流水账。绝对不要有任何浮夸的 AI 腔调和官腔（多用“改了改”、“调了调”、“排查了”、“修了一下”、“对了一下”，绝对不要用“重构了冗余逻辑”、“显著提升了性能”、“优化了打包体积”等浮夸词汇）。
2. 工作量显得“饱满且充实”。如果我给出的工作内容比较简短，请帮我在合理的专业范围内进行步骤展开（比如把“写了登录”合理扩展拆解为：画页面布局、处理表单参数校验、联调接口以及本地跑自测等）。
3. 增加一点点口语化的工作细节（比如“把 Figma 的间距标注仔细对了一遍”、“把控制台里的几个警告日志清理了一下”等），让日报显得极其真实。
4. 字数控制在 100 - 150 字之间，分条列出（2-3条即可）。
5. 顺便帮我起一个 15 字以内的极简日志标题。

请参考并对比以下写作风格：
${examples}

请严格按照以下格式直接输出（不要有任何多余的 Markdown 代码块或前后缀解释说明）：
标题：[极简日志标题]
内容：
1. [第一条工作内容，大白话口语，写实有细节]
2. [第二条工作内容，大白话口语，写实有细节]`;
}
