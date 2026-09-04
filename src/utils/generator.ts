
import { DirectionOption } from '../types/ai';

export const LOCAL_DIRECTION_POOLS: Record<string, { idle: DirectionOption[]; study: DirectionOption[] }> = {
  frontend: {
    idle: [
      { id: 'fe_style', title: '页面样式与多分辨率适配', summary: '排查不同分辨率下弹性布局折行与间距错位，优化长文本省略与空状态展示', tag: '样式调优' },
      { id: 'fe_form', title: '大表单数据校验与联动逻辑', summary: '排查复杂表单切换选项时的必填校验遗漏，优化下拉联动与禁用态逻辑', tag: '表单逻辑' },
      { id: 'fe_api_adapt', title: '新接口字段对接与报错兜底', summary: '对接后端新提供的业务接口，核对字段映射并补充弱网与空数据友好提示', tag: '接口联调' },
      { id: 'fe_bug_fix', title: '提测缺陷跟进与交互细节修复', summary: '跟进测试反馈的交互缺陷，修复弹窗重复弹出及数据回显不及时问题', tag: '缺陷修复' },
      { id: 'fe_list_filter', title: '列表多条件筛选与分页联动', summary: '调试搜索条件重置后的分页状态，优化多条件组合查询时的参数传递与回显', tag: '业务联动' },
      { id: 'fe_mobile_compat', title: '移动端多机型走查与兼容适配', summary: '在不同机型环境下走查页面样式，修复点击穿透与滚动穿透等交互异常', tag: '多端兼容' },
      { id: 'fe_refactor_clean', title: '通用组件抽离与代码瘦身', summary: '将多处相似的操作弹窗与确认逻辑抽离为公用组件，清理废弃样式与变量', tag: '代码重构' },
      { id: 'fe_scroll_debounce', title: '长列表加载性能与防抖节流', summary: '针对长列表滚动加载与搜索输入增加防抖节流，补充骨架屏占位与触底提示', tag: '体验优化' }
    ],
    study: [
      { id: 'fe_hooks_pattern', title: 'React/Vue 状态管理与 Hooks 实践', summary: '调研常用状态管理与自定义 Hooks 封装模式，整理在现有业务中的复用方案', tag: '框架最佳实践' },
      { id: 'fe_perf_opt', title: '首屏加载与前端打包体积优化', summary: '梳理路由懒加载、组件按需引入与分包构建策略，结合项目现状制定优化清单', tag: '性能建设' },
      { id: 'fe_ts_types', title: '复杂业务数据 TypeScript 类型规范', summary: '整理接口数据转换中的类型声明与通用泛型工具，沉淀团队代码规范笔记', tag: '代码规范' },
      { id: 'fe_edge_cases', title: '前端弱网与极端边界容错自测', summary: '梳理网络超时、极端字符与无权限等常见边界测试要点，建立组件自检清单', tag: '质量自查' },
      { id: 'fe_ui_system', title: '前端无障碍与响应式组件设计', summary: '调研主流组件库在不同屏幕尺寸下的响应式规范，沉淀公共业务组件设计标准', tag: '组件规范' }
    ]
  },
  backend: {
    idle: [
      { id: 'be_sql', title: '慢查询排查与联合索引治理', summary: '排查近期慢 SQL 查询日志，针对高频全表扫描补充复合索引并验证执行计划', tag: '数据库调优' },
      { id: 'be_cache', title: 'Redis 缓存过期与防击穿优化', summary: '排查热点缓存过期策略，增加空值缓存兜底与随机过期时间，防止雪崩', tag: '缓存治理' },
      { id: 'be_dto', title: '接口数据契约与 DTO 规范重构', summary: '清理废弃 API 路由与无效 DTO 字段，统一业务错误码与全局异常拦截格式', tag: '接口规范' },
      { id: 'be_trace', title: '链路跟踪 TraceID 与日志治理', summary: '在服务间调用链注入唯一请求链路跟踪 ID，清理无效冗余 Debug 日志', tag: '监控治理' },
      { id: 'be_queue', title: '消息队列堆积排查与幂等消费', summary: '排查异步消息堆积告警，调优批量拉取数量与重试策略，增加消费幂等保护', tag: '异步解耦' },
      { id: 'be_pool', title: '数据库连接池水位调优与回收', summary: '排查数据库连接池最大闲置与活跃连接数，优化超时回收时间与监控指标', tag: '稳定性' }
    ],
    study: [
      { id: 'be_lock', title: '高并发分布式锁续期与容灾预研', summary: '调研分布式锁在网络分区下的自动续期与容灾降级方案，本地验证并发行为', tag: '并发架构' },
      { id: 'be_grpc', title: '微服务 RPC 通信与序列化调优', summary: '阅读微服务 RPC 通信与 Protobuf 序列化优化技术文档，对比性能并整理笔记', tag: '微服务架构' },
      { id: 'be_deadlock', title: '数据库死锁与事务隔离级别复盘', summary: '复盘历史并发事务死锁排查案例，梳理行级锁竞争规避与隔离级别设计清单', tag: '技术复盘' },
      { id: 'be_otel', title: '服务可观测性与全链路监控学习', summary: '调研分布式链路追踪与指标监控标准，整理服务无侵入接入的最佳实践规范', tag: '可观测性' },
      { id: 'be_sharding', title: '数据库水平分表与读写分离预研', summary: '调研大数据量下数据库分表与读写分离方案，评估历史数据归档与分片键设计', tag: '存储架构' }
    ]
  },
  fullstack: {
    idle: [
      { id: 'fs_contract', title: '前后端端到端 TypeScript 契约统一', summary: '使用共享类型包统一前端 API 调用与后端接口 DTO 定义，消除类型不一致隐患', tag: '契约工程' },
      { id: 'fs_docker', title: '全栈 Docker 多阶段构建分层优化', summary: '重构多阶段构建 Dockerfile，引入国内镜像源并裁剪冗余依赖层', tag: '容器运维' },
      { id: 'fs_auth', title: '端到端鉴权与安全响应标头加固', summary: '加固 CSRF/CORS 策略与安全响应头配置，梳理 Refresh Token 自动续签机制', tag: '安全防护' },
      { id: 'fs_db_query', title: '全栈链路查询耗时排查与多级缓存', summary: '排查前端高频接口在后端的 SQL 执行效率，为高频只读数据添加多级缓存', tag: '全链路优化' },
      { id: 'fs_clean', title: '全栈废弃模块与冗余依赖清理', summary: '梳理前后端未引用文件与过期 API 路由，精简代码仓库体积并执行回归验证', tag: '代码重构' }
    ],
    study: [
      { id: 'fs_ssr', title: '现代 SSR/SSG 服务端渲染架构对比', summary: '调研服务端渲染与边缘计算缓存策略，搭建 Benchmark 原型评估首屏提速效果', tag: '渲染架构' },
      { id: 'fs_api_design', title: '现代 API 架构与聚合查询方案', summary: '对比前后端数据按需查询与接口聚合开销，评估在多端矩阵项目中的适配度', tag: 'API 架构' },
      { id: 'fs_oidc', title: '基于 OAuth 2.1 与 OIDC 统一认证', summary: '研究基于现代标准协议的多端单点登录流转，整理权限中台接入架构规范', tag: '统一认证' },
      { id: 'fs_serverless', title: 'Serverless 与边缘计算应用预研', summary: '调研轻量级 Serverless 函数在低频定时任务与 Webhook 处理中的落地可行性', tag: '云原生' },
      { id: 'fs_monitoring', title: '全栈端到端错误监控与告警体系', summary: '调研前后端统一异常捕获与告警上报链路，整理异常上下文链路关联方案', tag: '监控体系' }
    ]
  },
  designer: {
    idle: [
      { id: 'ui_token', title: '设计系统全局色彩与字阶规范整理', summary: '统一设计系统中的色彩语义化层级与排版比例标尺，整理公共组件库源文件', tag: '设计系统' },
      { id: 'ui_clean', title: '历史项目 Figma 图层规范化与归档', summary: '清理过期项目源文件，规范图层命名、AutoLayout 约束与切图标注导出', tag: '资产管理' },
      { id: 'ui_empty', title: '多场景通用异常缺省页与插画设计', summary: '补充网络断开、权限受限、数据为空等极端边界状态下的高质感空态插图', tag: '体验微调' },
      { id: 'ui_motion', title: '核心微交互动效曲线与参数标定', summary: '规范弹窗出现、页面转场与按钮点击的物理阻尼参数，与前端同步实现标准', tag: '动效规范' },
      { id: 'ui_audit', title: '线上已发布页面视觉走查与还原核对', summary: '走查生产环境各分辨率下的字号、间距与圆角还原细节，整理视觉优化清单', tag: '还原度走查' }
    ],
    study: [
      { id: 'ui_figma_vars', title: 'Figma Variables 高级变量与暗黑适配', summary: '研究主题模式一键切换下的语义 Token 映射，搭建跨端设计组件库变量骨架', tag: '设计系统' },
      { id: 'ui_accessibility', title: '无障碍色彩对比度与可访问性标准', summary: '学习 WCAG 2.1 颜色对比度要求，评估现有产品在高对比度下的视觉可识别度', tag: '包容性设计' },
      { id: 'ui_design_tokens', title: 'Design Tokens 跨端同步工作流', summary: '研究 Figma Token 插件与前端 CSS Variables 自动化同步机制，提高协作效率', tag: '工程化协作' },
      { id: 'ui_micro_ux', title: '微交互心智模型与用户感知延迟优化', summary: '学习界面操作即时反馈与过渡动效心理学，整理表单交互防挫败体验卡片', tag: '交互体验' },
      { id: 'ui_ai_workflow', title: 'AI 辅助设计工具在资产生成中的应用', summary: '探索利用 AI 工具快速生成灵感 Moodboard、矢量图标与插画的标准化工作流', tag: '效率探索' }
    ]
  },
  tester: {
    idle: [
      { id: 'qa_auto_scripts', title: '自动化测试脚本稳定性与断言调优', summary: '优化端到端测试用例中的等待与元素定位策略，降低网络抖动导致的误报率', tag: '自动化测试' },
      { id: 'qa_data_clean', title: '测试环境基准数据与账号池维护', summary: '重置并维护测试数据库初始桩数据，规范各角色权限测试账号与测试用例关联', tag: '环境治理' },
      { id: 'qa_regression', title: '核心业务主流程回归测试用例库', summary: '梳理并更新高频主流程冒烟测试清单，归纳易漏测边界条件并沉淀检查卡片', tag: '用例体系' },
      { id: 'qa_bug_audit', title: '历史缺陷复盘与漏测归因分析', summary: '统计分析上期版本线上问题与提测 Bug 分布，梳理质量薄弱模块及防范策略', tag: '质量复盘' },
      { id: 'qa_mock_server', title: '接口 Mock 异常桩与弱网规则配置', summary: '配置 500、超时、极端乱码返回的 Mock 场景，验证前端容错及重试提示表现', tag: '异常模拟' }
    ],
    study: [
      { id: 'qa_k6_perf', title: '基于 K6 / JMeter 性能压测指标分析', summary: '学习并发压测线程模型、TPS 吞吐量与 P99 响应延迟分析，整理压测方案模板', tag: '性能测试' },
      { id: 'qa_playwright', title: 'Playwright 现代化 UI 自动化测试', summary: '学习 Playwright 录制回放与多端并行执行特性，对比现有框架并搭建 POC 验证', tag: '工具升级' },
      { id: 'qa_security', title: 'Web 安全渗透与常见漏洞测试要点', summary: '学习 SQL 注入、XSS 与越权访问排查要点，整理常规业务安全测试检查项', tag: '安全测试' },
      { id: 'qa_contract', title: '基于契约测试的前后端解耦测试', summary: '研究微服务前后端契约断言方案，评估在接口变更联调中降低沟通成本的收益', tag: '契约测试' },
      { id: 'qa_shift_left', title: '测试左移与开发自测覆盖度量', summary: '调研需求阶段用例先行与开发自测清单标准，梳理提升提测质量的标准作业流', tag: '流程建设' }
    ]
  },
  pm: {
    idle: [
      { id: 'pm_funnel', title: '核心转化漏斗与用户埋点数据复盘', summary: '分析近期功能上线后的留存、点击转化与流失环节，产出核心数据分析简报', tag: '数据复盘' },
      { id: 'pm_feedback', title: '用户与客服反馈问题分类归档', summary: '收集业务端、客服与用户社群的高频问题，整理需求池并评估下期优先级', tag: '需求池管理' },
      { id: 'pm_prd_spec', title: '历史功能 PRD 交互文档与规则补全', summary: '更新线上已发布模块的正式业务规则说明书，沉淀业务术语词典与状态流转图', tag: '文档治理' },
      { id: 'pm_roadmap', title: '季度迭代路线图与里程碑拆解', summary: '结合团队研发资源与业务指标目标，梳理各业务阶段里程碑与关键交付节点', tag: '规划排期' },
      { id: 'pm_competitor', title: '竞品同类模块功能细节深度走查', summary: '体验对标竞品最新版本的交互链路与引导策略，提炼可参考的体验亮点与差异', tag: '竞品分析' }
    ],
    study: [
      { id: 'pm_ai_product', title: 'AI 原生应用产品交互设计模式调研', summary: '研究 LLM 对话交互与 Generative UI 最佳实践，分析如何降低用户输入门槛', tag: 'AI 产品' },
      { id: 'pm_growth', title: 'PLG 产品驱动增长模型与策略', summary: '学习以产品体验驱动自传播与转化的设计框架，梳理自服务引导流程优化点', tag: '增长策略' },
      { id: 'pm_metrics', title: '北极星指标体系与指标下钻拆解', summary: '学习现代数字化产品核心指标监控体系，设计科学的 A/B 测试对照评估方案', tag: '数据体系' },
      { id: 'pm_user_research', title: '定性用户深度访谈与共情地图绘制', summary: '学习标准化用户访谈提纲设计与画像归类方法，沉淀用户核心痛点卡片', tag: '用户研究' },
      { id: 'pm_strategy', title: '商业化变现模式与定价策略调研', summary: '分析 SaaS 与平台型产品的增值功能分层策略，整理商业化推进调研报告', tag: '商业策略' }
    ]
  },
  devops: {
    idle: [
      { id: 'ops_disk_clean', title: '服务器基础资源与磁盘空间巡检清理', summary: '排查各节点磁盘使用率与大日志占用，清理悬空无用 Docker 镜像与系统缓存', tag: '系统巡检' },
      { id: 'ops_alert_rule', title: 'Prometheus 告警阈值与降噪治理', summary: '调优高频抖动告警规则，合并重复告警通知，优化 Grafana 核心大盘展示', tag: '监控优化' },
      { id: 'ops_security', title: '服务器安全补丁与 SSH/防火墙加固', summary: '排查已知系统安全漏洞，加固 SSH 端口访问策略与非必要外网端口安全组', tag: '安全加固' },
      { id: 'ops_backup_drill', title: '数据库冷备份与容灾恢复有效性演练', summary: '抽检数据库定时备份文件完整性，在测试节点验证异地恢复与数据校验流程', tag: '容灾演练' },
      { id: 'ops_ci_speed', title: 'CI/CD 流水线构建缓存与依赖加速', summary: '优化 Docker 镜像层缓存与国内 NPM/Maven 代理源，缩短自动化构建耗时', tag: '效能提升' }
    ],
    study: [
      { id: 'ops_k8s_mesh', title: 'Service Mesh 流量治理与金丝雀发布', summary: '学习 Istio 服务网格微服务流量调度策略与零停机灰度发布方案，整理实操笔记', tag: '云原生' },
      { id: 'ops_iac', title: 'Terraform 基础设施即代码 (IaC) 实践', summary: '研究使用声明式代码编排云服务器与网络资源，评估团队基础设施自动化改造', tag: '自动化运维' },
      { id: 'ops_ebpf', title: 'eBPF 现代系统级可观测性与网络诊断', summary: '学习 Linux 内核级探针在网络排障、性能分析与安全防御中的应用场景与案例', tag: '底层技术' },
      { id: 'ops_gitops', title: 'ArgoCD 与 GitOps 持续部署最佳实践', summary: '学习声明式集群状态管理与配置漂移自愈机制，整理团队 CD 升级方案', tag: 'GitOps' },
      { id: 'ops_finops', title: '云原生资源降本增效 (FinOps) 治理', summary: '调研按需弹性伸缩、HPA 自动扩缩容与闲置资源回收，沉淀成本管控规范', tag: '成本优化' }
    ]
  },
  generic: {
    idle: [
      { id: 'gen_doc', title: '近期业务文档整理与知识沉淀', summary: '归纳整理近期项目文档与常用操作指引，规范团队公共知识库目录结构', tag: '资料整理' },
      { id: 'gen_clean', title: '待办事项核对与历史流程归档', summary: '梳理已完成事项的后续跟进状态，清理过期待办并核对遗漏协作信息', tag: '流程归档' },
      { id: 'gen_efficiency', title: '个人工作流自动化与效率工具调优', summary: '优化日常高频操作的快捷脚本与模板配置，精简重复性事务流转成本', tag: '效能优化' },
      { id: 'gen_sync', title: '跨部门协作进展跟进与答疑', summary: '跟进上下游协作事项的处理进展，解答日常咨询并同步关键进度节点', tag: '业务协同' },
      { id: 'gen_review', title: '月度重点事项执行情况复盘自查', summary: '对照月度目标回顾阶段性交付质量，总结实施阻碍并整理改善措施', tag: '工作复盘' }
    ],
    study: [
      { id: 'gen_skill', title: '岗位专业技能与行业前沿资料学习', summary: '阅读行业前沿分析报告与专业最佳实践指南，提炼可落地的思维方法并做笔记', tag: '技能提升' },
      { id: 'gen_process', title: '敏捷项目协同与标准化流程学习', summary: '学习高效团队在跨部门协作与质量把控方面的标准作业流程，沉淀参考建议', tag: '方法论' },
      { id: 'gen_tool', title: 'AI 辅助生产力工具在日常场景的实操', summary: '探索利用 AI 工具快速提取信息、整理结构化文档与数据校验的实操技巧', tag: '效率探索' },
      { id: 'gen_writing', title: '结构化技术写作与表达逻辑提升', summary: '学习金字塔原理在技术方案与工作总结中的应用，提升跨团队沟通交付效率', tag: '沟通表达' },
      { id: 'gen_problem_solving', title: '复杂问题根因分析与复盘方法论', summary: '学习 5-Whys 分析法与故障复盘机制，梳理日常研发与协作的避坑卡片', tag: '根因分析' }
    ]
  }
};

/**
 * 本地智能方向推荐引擎：生成 5 个垂直岗位且避开历史重复的方向建议
 */
export function generateLocalDirectionSuggestions(
  job: string = 'frontend',
  mode: string = 'idle',
  customJobName: string = '',
  recentLogs: any[] = [],
  platform: string = ''
): DirectionOption[] {
  const jobKey = resolveJobKey(job, customJobName);
  const currentMode = mode === 'study' ? 'study' : 'idle';
  const pool = LOCAL_DIRECTION_POOLS[jobKey]?.[currentMode] || LOCAL_DIRECTION_POOLS.generic[currentMode];
  const cleanPlatform = typeof platform === 'string' ? platform.trim() : '';

  // 将近期日志中的标题做相似度过滤，避免推荐高度重复的方向
  let candidates = [...pool];
  if (Array.isArray(recentLogs) && recentLogs.length > 0) {
    const historyTitles = recentLogs
      .filter((l: any) => l?.title)
      .map((l: any) => l.title);
    if (historyTitles.length > 0) {
      candidates = candidates.filter(item =>
        !historyTitles.some(h => calculateSimilarity(h, item.title) >= 50)
      );
    }
  }

  // 若过滤后不足 5 个，从原始池补回
  if (candidates.length < 5) {
    const usedIds = new Set(candidates.map(c => c.id));
    const fallback = pool.filter(c => !usedIds.has(c.id));
    candidates = [...candidates, ...fallback].slice(0, 10);
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 5);

  if (cleanPlatform) {
    return selected.map((item, idx) => {
      const title = `${cleanPlatform}${item.title}`;
      return {
        ...item,
        id: `plat_dir_${idx + 1}`,
        title: title.length > 18 ? title.slice(0, 17) : title,
        summary: `针对${cleanPlatform}，${item.summary}`
      };
    });
  }

  return selected;
}

/**
 * 赢日志 - 真实专业一线研发语料库 (无口语废话、具体闭环、免微调版)
 */

const JOB_TEMPLATES: Record<string, { actions: string[]; study: string[] }> = {
  backend: {
    actions: [
      '排查近期接口响应耗时偏高问题，检查慢 SQL 日志并补加联合索引，测试库复测查询延迟降至 20ms 以内。',
      '梳理业务状态机流转逻辑，修复并发请求下订单状态可能异常覆盖的边界缺陷，本地并发测试正常。',
      '重构用户权限校验与鉴权中间件，规范 Token 失效与刷新拦截机制，完成接口鉴权自测。',
      '对接新业务数据查询接口，编写入参严格校验并补充枚举类型约束，配合前端完成数据联调。',
      '优化 Redis 缓存数据读取策略，增加空值缓存兜底与随机过期时间防范击穿风险，服务运行平稳。',
      '解耦服务层冗余数据组装逻辑，提取通用 DTO/VO 转换工具方法，本地通过单元测试边界验证。',
      '排查消息队列消费者偶发积压告警，调优批量消费拉取数量与重试策略，增加消费幂等保护。',
      '完善全局异常捕获层，统一各业务模块错误状态码与中文友好提示，自测异常返回正常。',
      '重构数据库批量数据插入与更新逻辑，采用分批事务提交避免长事务锁表，压测运行稳定。',
      '在核心业务调用链路中注入唯一 TraceID 上下文，清理冗余调试日志，便于后续链路排障。',
      '排查数据库连接池最大闲置与活跃连接水位，调优超时回收参数，监控指标维持在健康区间。',
      '梳理第三方 Webhook 回调验签与异步分发逻辑，完善重试队列与幂等性去重保护，联调测试通过。'
    ],
    study: [
      '调研高并发场景下分布式锁的自动续期与容灾降级方案，本地搭建 Demo 验证极端网络分区下的行为。',
      '阅读微服务 RPC 通信与 Protobuf 序列化优化技术文档，对比性能表现并整理调研总结笔记。',
      '复盘历史并发事务死锁排查案例，梳理行级锁竞争规避与事务隔离级别设计清单。',
      '调研云原生分布式链路追踪标准（OpenTelemetry），整理服务无侵入接入的最佳实践规范。',
      '研究大数据量下数据库分表与读写分离方案，评估历史数据归档与分片键设计可行性。'
    ]
  },
  frontend: {
    actions: [
      '排查并修复列表页面在移动端不同分辨率下的样式折行与溢出问题，优化弹性盒自适应布局，多机型走查正常。',
      '排查复杂表单切换选项时的必填校验遗漏，优化下拉选项联动与禁用态逻辑，本地自测提交正常。',
      '对接新业务数据查询接口，核对字段映射结构并补充网络异常与空数据友好提示，自测流程流转正常。',
      '跟进测试反馈的偶发交互缺陷，修复弹窗重复弹出及数据未及时刷新问题，测试环境复测通过。',
      '调试数据列表多条件组合筛选与分页联动逻辑，解决重置搜索条件时页码未归位问题，自测查询正常。',
      '提取页面多处重复的操作弹窗与确认逻辑为通用组件，清理无用控制台输出与废弃样式，代码结构清晰。',
      '针对长列表滚动渲染卡顿问题，增加数据防抖与节流控制，补充加载中骨架屏占位与触底提示。',
      '排查并处理控制台遗留的类型警告，规范复杂异步请求错误拦截与弱网友好提示，运行稳定。',
      '优化大表单输入响应延迟，针对非受控组件与局部重绘进行性能调优，输入体验流畅无卡顿。',
      '检查路由配置与静态资源加载策略，配置图片懒加载与 WebP 压缩，降低首屏资源加载耗时。'
    ],
    study: [
      '调研 React/Vue 最新状态管理与自定义 Hooks 封装模式，整理在现有业务组件中的适用场景与迁移建议。',
      '梳理前端首屏加载性能与静态资源打包分包策略，结合现有项目路由分析并整理优化方案。',
      '整理业务接口复杂数据转换中的 TypeScript 类型声明与通用泛型工具，沉淀团队代码规范笔记。',
      '梳理网络超时、极端字符与无权限等常见边界测试要点，建立前端组件健壮性自检清单。',
      '调研主流组件库在响应式与无障碍设计方面的规范，梳理团队通用公共业务组件设计标准。'
    ]
  },
  fullstack: {
    actions: [
      '打通前后端数据全链路交互，完成前端动态表单与后端 RESTful API 数据持久化，本地全流程自测正常。',
      '设计新业务模块数据表结构并实现对应服务接口，同步完成前端可视化表格展示与多条件筛选。',
      '排查跨域配置与认证 Cookie 跨端携带问题，统一本地开发与测试环境网关转发配置，联调通过。',
      '优化全栈应用多阶段构建 Dockerfile，裁剪冗余依赖层并加快自动化构建部署，容器启动平稳。',
      '统一前后端 API 入参返回值 TypeScript 类型定义，消除前后端字段不一致隐患，联调自测正常。'
    ],
    study: [
      '调研服务端渲染 SSR 与静态生成 SSG 在首屏速度与 SEO 上的权衡，搭建原型 Demo 评估迁移成本。',
      '对比前后端数据按需查询与接口聚合开销，评估在多端矩阵项目中的适配度并沉淀笔记。',
      '学习基于 OAuth 2.1 与 OIDC 的单点登录协议流程，整理多端统一用户身份鉴权方案。',
      '调研轻量级 Serverless 函数在低频定时任务与 Webhook 处理中的落地可行性。'
    ]
  },
  designer: {
    actions: [
      '统一设计系统中的色彩语义化层级与排版比例标尺，整理公共组件库源文件与样式命名规范。',
      '清理过期项目 Figma 冗余图层与历史草稿，规范 AutoLayout 约束与切图标注导出规则。',
      '补充网络断开、权限受限、数据为空等极端边界状态下的高质感空态插图与友好文案设计。',
      '规范弹窗出现、页面转场与按钮点击的物理阻尼参数与过渡曲线，与前端工程师同步实现标准。',
      '走查生产环境各分辨率下的字号、间距与圆角还原细节，整理视觉优化走查清单同步研发。'
    ],
    study: [
      '研究 Figma Variables 高级变量与暗黑模式适配机制，搭建跨主题组件库变量架构。',
      '研究 Figma Token 插件与前端 CSS Variables 自动化同步工作流，提高跨团队交付效率。',
      '学习 WCAG 2.1 颜色对比度与可访问性标准，评估现有产品在高对比度下的视觉可识别度。',
      '探索利用 AI 工具快速生成灵感 Moodboard、矢量图标与插画的标准化工作流。'
    ]
  },
  tester: {
    actions: [
      '调优 UI 自动化测试脚本中的等待与元素定位策略，降低网络抖动导致的误报率，批量执行稳定通过。',
      '重置并维护测试数据库初始基准数据，清理脏数据并规范各角色权限测试账号与用例关联。',
      '梳理并更新高频主流程冒烟测试清单，归纳近期易漏测边界条件并整理为测试卡片。',
      '统计分析上期版本线上问题与提测 Bug 分布，梳理质量薄弱模块及针对性回归防范策略。',
      '配置接口 500、超时、极端空数据返回的 Mock 场景，验证前端容错及重试提示表现。'
    ],
    study: [
      '学习并发压测线程模型、TPS 吞吐量与 P99 响应延迟分析方法，整理性能测试方案模板。',
      '学习 Playwright 多端并行执行与自动等待特性，对比现有框架并搭建 Demo 验证可行性。',
      '学习 SQL 注入、XSS 与越权访问等常见 Web 安全漏洞排查要点，整理常规业务安全测试检查项。',
      '调研基于契约测试的前后端解耦测试方案，评估在接口频繁变更时减少联调阻塞的收益。'
    ]
  },
  pm: {
    actions: [
      '分析近期功能上线后的用户留存、点击转化与流失环节，产出核心功能数据分析简报。',
      '收集整理业务端、客服与用户社群的高频反馈，归纳需求分类并评估下期排期优先级。',
      '更新线上已发布模块的正式业务规则说明书，沉淀业务术语词典与状态流转拓扑图。',
      '结合团队研发资源与业务指标目标，梳理各业务阶段里程碑与关键交付节点排期表。',
      '体验对标竞品最新版本的交互链路与引导策略，提炼可参考的体验亮点与差异化分析。'
    ],
    study: [
      '研究 LLM 对话交互与生成式 UI 交互模式，分析如何降低用户输入门槛与提升意图识别率。',
      '学习产品驱动增长 (PLG) 模型与策略，梳理新用户自服务引导与转化留存优化点。',
      '学习数字化产品北极星指标体系设计，制定科学严谨的 A/B 测试对照评估方案与上线标准。',
      '学习标准化用户深度访谈提纲设计与画像归类方法，绘制用户旅程图并提炼核心痛点。'
    ]
  },
  devops: {
    actions: [
      '巡检各服务器节点磁盘使用率与大日志占用，清理悬空无用 Docker 镜像与系统缓存。',
      '调优 Prometheus 高频抖动告警规则，合并重复告警通知，优化 Grafana 核心监控大盘展示。',
      '排查已知系统安全漏洞，加固 SSH 端口访问策略与非必要外网端口安全组防火墙规则。',
      '抽检数据库定时备份文件完整性，在测试节点验证异地恢复与数据校验流程，演练正常。',
      '优化 Docker 镜像分层缓存与国内依赖代理源，缩短持续集成自动化构建分发耗时。'
    ],
    study: [
      '学习服务网格微服务流量调度策略与零停机灰度发布方案，整理实操笔记与部署架构图。',
      '研究使用 Terraform 声明式编排云服务器与网络资源，评估团队基础设施自动化改造收益。',
      '学习 Linux 内核级探针在网络排障、性能分析与安全防御中的应用场景与落地案例。',
      '学习声明式集群状态管理与配置漂移自愈机制，整理团队 CD 持续交付升级方案。'
    ]
  },
  generic: {
    actions: [
      '归纳整理近期项目业务文档与常用操作指引，规范团队公共知识库目录结构与权限。',
      '梳理已完成事项的后续跟进状态，清理过期待办并核对跨部门遗漏协作信息。',
      '优化日常高频操作的快捷脚本与模板配置，精简重复性事务流转成本与沟通步骤。',
      '跟进上下游协作事项的处理进展，解答日常业务咨询并同步关键进度里程碑节点。',
      '对照阶段目标回顾交付质量与推进节奏，总结实施阻碍并整理后续改善措施。'
    ],
    study: [
      '阅读行业前沿分析报告与专业最佳实践指南，提炼可落地的思维方法并做笔记归档。',
      '学习高效团队在跨部门协作与质量把控方面的标准作业流程，沉淀优化建议。',
      '探索利用 AI 工具快速提取信息、整理结构化文档与数据校验的实操技巧与提示词。',
      '学习金字塔原理在技术方案与工作总结中的应用，提升跨团队沟通交付效率。'
    ]
  }
};

const JOB_TITLES: Record<string, { random: string[]; study: string[] }> = {
  backend: {
    random: [
      '核心数据接口开发与联调', '慢SQL排查与索引优化', '业务状态机与并发边界处理',
      '用户鉴权与拦截中间件加固', 'Redis缓存策略与防击穿优化', '服务层DTO解耦与代码重构',
      '消息队列消费与幂等性保障', '全局异常拦截与状态码规范', '数据库连接池调优与监控'
    ],
    study: [
      '分布式锁续期与容灾预研', '微服务RPC序列化性能调研', 'MySQL锁与事务机制复盘',
      '云原生可观测性最佳实践', '分布式消息管道与背压预研'
    ]
  },
  frontend: {
    random: [
      '业务页面交互与响应式适配', '大表单复杂校验与状态联动', '新接口数据对接与异常兜底',
      '提测缺陷排查与交互细节修复', '列表多条件组合筛选联动', '公共业务组件封装与代码清理',
      '长列表滚动加载与防抖节流', '首屏资源加载与图片懒加载', '控制台报错治理与容错加固'
    ],
    study: [
      'React/Vue 状态管理与 Hooks 实践', '前端打包构建与分包加载优化', 'TypeScript 类型规范与泛型工具',
      '前端弱网与异常边界自测方法', '响应式与无障碍组件设计规范'
    ]
  },
  fullstack: {
    random: [
      '全栈业务功能闭环与接口联调', '数据表结构设计与管理后台开发', '网关跨域与认证Token加固',
      'Docker镜像构建分层与依赖优化', '全栈类型定义统一与接口对齐'
    ],
    study: [
      '现代SSR/SSG渲染架构对比', 'REST与GraphQL聚合查询选型', '基于OAuth2.1单点登录调研',
      '轻量Serverless任务落地预研'
    ]
  },
  designer: {
    random: [
      '设计系统色彩与字阶规范整理', 'Figma图层规范化与组件库维护', '极端边界缺省页与插画设计',
      '核心微交互动效阻尼参数标定', '线上页面视觉还原走查与跟进'
    ],
    study: [
      'Figma Variables多主题变量搭建', 'Design Tokens跨端同步工作流', '无障碍色彩对比度与可访问性',
      'AI辅助设计工具与资产生成'
    ]
  },
  tester: {
    random: [
      '自动化测试脚本稳定性与断言调优', '测试环境初始数据与账号池维护', '核心业务主流程冒烟用例维护',
      '历史缺陷复盘与漏测归因分析', '接口异常桩与弱网Mock规则配置'
    ],
    study: [
      'K6/JMeter并发压测指标分析', 'Playwright现代化UI自动化调研', 'Web常见安全漏洞渗透测试要点',
      '基于契约测试的前后端解耦测试'
    ]
  },
  pm: {
    random: [
      '核心功能转化漏斗与埋点复盘', '用户与客服反馈需求池分类归档', '已发布模块业务规则PRD补全',
      '迭代路线图与交付里程碑排期', '竞品最新版本交互细节深度走查'
    ],
    study: [
      'AI原生应用对话与GUI交互调研', 'PLG产品驱动增长策略学习', '北极星指标体系设计与拆解',
      '定性用户深度访谈提纲设计'
    ]
  },
  devops: {
    random: [
      '服务器资源巡检与镜像日志清理', 'Prometheus告警降噪与监控调优', '系统安全漏洞排查与防火墙加固',
      '数据库定时冷备份有效性演练', 'CI/CD自动化构建缓存与依赖加速'
    ],
    study: [
      'Service Mesh微服务流量治理学习', 'Terraform基础设施即代码实践', 'Linux内核级诊断与eBPF调研',
      'GitOps持续部署与配置漂移自愈'
    ]
  },
  generic: {
    random: [
      '近期业务文档整理与知识沉淀', '待办事项核对与历史流程归档', '个人工作流自动化与效率调优',
      '跨部门协作进展跟进与答疑', '阶段重点事项交付复盘自查'
    ],
    study: [
      '岗位专业技能与行业前沿学习', '敏捷协作与质量把控流程学习', 'AI辅助生产力工具实操探索',
      '金字塔原理与结构化表达提升'
    ]
  }
};

// 3. 扩写关键字匹配规则
interface KeywordRule {
  title: string;
  descriptions: string[];
  cooperation: boolean;
  difficulty: boolean;
}

const UNIVERSAL_KEYWORD_MAPS: Record<string, KeywordRule> = {
  // 后端/通用技术
  'sql': {
    title: '数据库查询优化与索引排查',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '排查了相关数据表的慢查询记录，分析了执行计划并优化了索引命中。',
      '重构了多表关联查询的逻辑，拆分了长 SQL 并减少了不必要的数据字段返回。',
      '补充了复合索引并进行了本地执行效率对比，查询耗时显著降低。'
    ]
  },
  'redis': {
    title: '缓存策略与性能优化',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '优化了 Redis 缓存的存取逻辑，增加了随机过期时间以防止缓存雪崩。',
      '排查了热点数据缓存击穿的场景，补充了空值占位与分布式锁互斥加载。',
      '清理了 Redis 中过期的冗余键值，核对了生产环境的内存占用指标。'
    ]
  },
  '接口': {
    title: 'API接口对接与联调',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '跟协作方对了一下接口，调通了核心数据，规范了入参校验与错误码返回。',
      '处理了接口加载超时和断网报错时的兜底逻辑，保证了异常时交互平稳。',
      '合并了页面中重复触发的冗余请求，减少了网络与服务端开销。'
    ]
  },
  '联调': {
    title: '前后端业务接口联调',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '和协作端一块联调了几个业务核心接口，核对了数据格式和边界返回值。',
      '本地用 Mock 数据和 Postman 跑了几组边界用例，自测流程基本通过。',
      '优化了数据加载顺序与异步请求编排，整体交互与流转更流畅。'
    ]
  },
  '登录': {
    title: '用户登录与权限鉴权模块开发',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '完善了用户登录认证与 Token 存储管理逻辑，处理了拦截器统一携带。',
      '处理了登录态过期自动拦截、无感刷新及跳转回登录页的边界流程。',
      '补充了账号密码输入时的格式校验与防重提交限制，提升了安全性。'
    ]
  },
  '页面': {
    title: '业务页面开发与多端适配',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '推进了核心业务页面的布局与交互开发，完善了响应式断点适配。',
      '将页面拆分为多个解耦的高复用子组件，统一了状态管理与传参。',
      '优化了复杂表格与列表的展示，修复了极端长文本下的布局换行问题。'
    ]
  },
  'bug': {
    title: '缺陷排查与边界修复',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '定位并修复了反馈的几个偶发缺陷，增加了严密的空值校验与异常捕获。',
      '排查了特定数据或特定分辨率下逻辑异常的问题，调整了计算与流转逻辑。',
      '对近期积累的历史小缺陷进行了集中清理，并在本地环境完成了全流程回归。'
    ]
  },
  '优化': {
    title: '系统性能与工程体验优化',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '分析了系统当前的瓶颈点，优化了打包体积与高频数据加载耗时。',
      '对核心耗时逻辑进行了异步解耦与防抖处理，降低了不必要的性能损耗。',
      '清理了代码中未使用的依赖和冗余配置，提升了本地开发与运行稳定性。'
    ]
  },
  '重构': {
    title: '核心业务逻辑代码重构',
    cooperation: false,
    difficulty: true,
    descriptions: [
      '梳理了历史遗留的臃肿逻辑，将数据层与业务表现层做了清晰解耦。',
      '提取了多个通用工具方法与中间件，消除了重复冗余代码。',
      '补充了关键逻辑的单元测试边界断言，保障了重构后的稳定性。'
    ]
  },
  '测试': {
    title: '功能用例验证与回归',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '按测试清单对核心业务流程执行了全链路验证，核对了状态流转与提示。',
      '清理了测试环境的历史脏数据，准备了完整的异常边界测试用例。',
      '对已修复的缺陷逐项进行了回归验证，确认未引入次生问题。'
    ]
  },
  '设计': {
    title: '高保真视觉设计与规范整理',
    cooperation: false,
    difficulty: false,
    descriptions: [
      '完成了核心页面的高保真视觉稿设计，梳理了信息层级与交互动效。',
      '细化了按钮悬浮、激活及异常空状态等全套组件状态规范。',
      '整理了设计交付切图与标注规范，并与开发同事完成了对接。'
    ]
  },
  '部署': {
    title: '服务部署与运维配置加固',
    cooperation: true,
    difficulty: false,
    descriptions: [
      '更新了服务容器化打包与部署配置，优化了基础镜像体积与环境变量隔离。',
      '检查了生产环境的运行日志与端口映射，验证了服务的健康检查探针。',
      '排查了网络代理与域名转发规则，确认服务平稳上线无异常。'
    ]
  }
};


function resolveJobKey(job: string, customJobName: string = ''): string {
  if (JOB_TEMPLATES[job]) return job;
  const custom = (customJobName || '').toLowerCase();
  if (custom.includes('后端') || custom.includes('java') || custom.includes('go') || custom.includes('python') || custom.includes('php') || custom.includes('c++') || custom.includes('c#') || custom.includes('node') || custom.includes('服务端')) {
    return 'backend';
  }
  if (custom.includes('全栈')) return 'fullstack';
  if (custom.includes('设计') || custom.includes('ui') || custom.includes('ux') || custom.includes('视觉')) return 'designer';
  if (custom.includes('测试') || custom.includes('qa')) return 'tester';
  if (custom.includes('产品') || custom.includes('pm')) return 'pm';
  if (custom.includes('运维') || custom.includes('sre') || custom.includes('devops')) return 'devops';
  if (custom.includes('前端') || custom.includes('web') || custom.includes('h5') || custom.includes('小程序')) return 'frontend';
  return 'generic';
}

export function getJobDisplayName(job: string = 'frontend', customJobName: string = ''): string {
  if (job === 'backend') return '后端开发工程师';
  if (job === 'frontend') return '前端开发工程师';
  if (job === 'fullstack') return '全栈开发工程师';
  if (job === 'designer') return 'UI/UX 视觉设计师';
  if (job === 'tester') return '测试工程师';
  if (job === 'pm') return '产品经理';
  if (job === 'devops') return '运维与SRE工程师';
  if (job === 'custom') return customJobName.trim() || '自定义岗位';
  return '软件开发工程师';
}

export interface GeneratedLogResult {
  title: string;
  hours: number;
  cooperation: boolean;
  difficulty: boolean;
  content: string;
}

function getRandomElement<T>(arr: T[]): T {
  if (!arr || arr.length === 0) return '' as any;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 1. 核心生成逻辑：针对无任务的随机生成 (多岗位、真实具体、单句闭环)
 */
export function generateRandomDaily(
  _seed: string,
  isStudy: boolean = false,
  job: string = 'frontend',
  customJobName: string = ''
): GeneratedLogResult {
  const jobKey = resolveJobKey(job, customJobName);
  const template = JOB_TEMPLATES[jobKey] || JOB_TEMPLATES.generic;
  const titles = JOB_TITLES[jobKey] || JOB_TITLES.generic;
  const jobName = getJobDisplayName(job, customJobName);

  let title: string;
  let content: string;

  if (isStudy) {
    title = getRandomElement(titles.study) || `${jobName}技术预研与学习`;
    const studyPool = template.study || [];
    content = getRandomElement(studyPool) || '阅读了岗位相关技术文档，梳理了业务可复用的架构方案与自检卡片。';
  } else {
    title = getRandomElement(titles.random) || `${jobName}日常工作推进`;
    const actionPool = template.actions || [];
    content = getRandomElement(actionPool) || '推进系统日常功能优化与异常排查，本地回归自测流程正常。';
  }

  if (job === 'custom' && customJobName.trim()) {
    title = `${customJobName.trim().substring(0, 10)}日常推进`;
  }

  return {
    title,
    hours: 8,
    cooperation: false,
    difficulty: false,
    content
  };
}

// 兼容老调用名
export const generateRandomFrontendDaily = generateRandomDaily;

/**
 * 2. 核心生成逻辑：根据用户输入进行智能扩写
 * 核心原则：保留用户输入的原始词汇（模块名、接口名、技术名等），自然连贯成句
 */

const LEAD_SENTENCE_PATTERNS: Array<(task: string, desc: string) => string> = [
  (task, desc) => `推进${task}相关逻辑开发与联调，${desc}`,
  (task, desc) => `排查并处理${task}中的关键细节，${desc}`,
  (task, desc) => `完成${task}的业务实现与联调对接，${desc}`,
  (task, desc) => `跟进${task}的开发与测试验证，${desc}`
];

const GENERAL_DETAIL_PHRASES = [
  '核对业务流程与接口数据映射，补充关键异常兜底',
  '梳理核心流转逻辑与入参约束，优化交互与边界处理',
  '排查处理相关调用链路与字段细节，消除潜在阻塞风险',
  '理清业务状态流转，完善边界判断与错误提示'
];

const FOLLOW_TASK_PREFIXES = ['同步推进', '并跟进处理', '兼顾完成', '同时联调'];

const VERIFY_ENDINGS = [
  '本地多场景回归自测正常。',
  '经测试环境验证，流程流转稳定。',
  '本地跑通多组边界用例，结果符合预期。',
  '测试环境验证通过，主流程无阻塞。'
];

export function expandUserInput(
  userInput: string,
  job: string = 'frontend',
  customJobName: string = ''
): GeneratedLogResult {
  const trimmed = userInput.trim();
  if (!trimmed) {
    const randomSeed = new Date().toISOString() + Math.random().toString();
    return generateRandomDaily(randomSeed, false, job, customJobName);
  }

  const jobName = getJobDisplayName(job, customJobName);
  const tasks = trimmed
    .split(/[,，;；\n]+/)
    .map(t => t.trim())
    .filter(Boolean);

  let finalTitle = '';
  let finalCooperation = false;
  let finalDifficulty = false;

  const parts: string[] = [];

  tasks.forEach((task, index) => {
    let matchedRule: KeywordRule | null = null;
    let matchedDesc = '';

    for (const key in UNIVERSAL_KEYWORD_MAPS) {
      if (task.toLowerCase().includes(key.toLowerCase())) {
        matchedRule = UNIVERSAL_KEYWORD_MAPS[key];
        matchedDesc = getRandomElement(matchedRule.descriptions).replace(/。$/, '');
        break;
      }
    }

    if (matchedRule) {
      if (matchedRule.cooperation) finalCooperation = true;
      if (matchedRule.difficulty) finalDifficulty = true;
      if (!finalTitle) finalTitle = matchedRule.title;
    }

    if (index === 0) {
      if (matchedDesc) {
        const pattern = LEAD_SENTENCE_PATTERNS[Math.floor(Math.random() * LEAD_SENTENCE_PATTERNS.length)];
        parts.push(pattern(task, matchedDesc));
      } else {
        const detail = getRandomElement(GENERAL_DETAIL_PHRASES);
        parts.push(`推进${task}相关工作，${detail}`);
      }
    } else {
      const prefix = FOLLOW_TASK_PREFIXES[(index - 1) % FOLLOW_TASK_PREFIXES.length];
      if (matchedDesc) {
        parts.push(`${prefix}${task}，${matchedDesc}`);
      } else {
        parts.push(`${prefix}${task}`);
      }
    }
  });

  const verify = getRandomElement(VERIFY_ENDINGS);
  let content: string;
  if (tasks.length === 1) {
    content = `${parts[0]}，${verify}`;
  } else {
    content = `${parts.join('；')}，${verify}`;
  }

  // 标题生成
  if (!finalTitle) {
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      finalTitle = firstTask.length <= 12
        ? `${firstTask}推进与自测`
        : `${firstTask.substring(0, 12)}事项推进`;
    } else {
      finalTitle = `${jobName.substring(0, 8)}日常推进`;
    }
  }

  if (finalTitle.length > 30) {
    finalTitle = finalTitle.substring(0, 27) + '...';
  }

  return {
    title: finalTitle.replace(/[，,。.\n]/g, '').trim(),
    hours: 8,
    cooperation: finalCooperation,
    difficulty: finalDifficulty,
    content
  };
}

/**
 * 3. 核心查重算法：N-gram 分词集合与 Levenshtein 混合加权查重
 * 彻底防御“调换语序抄袭”以及“固定自测模板导致的虚高误报”
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const clean = (s: string) => (s || '').toLowerCase().replace(/[\s\d.、,，.。;；?？!！:：\-[\]()（）"“”'‘’/\\_]/g, '');
  const s1 = clean(str1);
  const s2 = clean(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;

  // 1. 计算 2-gram / 3-gram 词袋集合相似度 (Dice's coefficient) - 免疫语序调换
  const getGrams = (str: string, n: number = 2): Map<string, number> => {
    const map = new Map<string, number>();
    if (str.length < n) {
      map.set(str, 1);
      return map;
    }
    for (let i = 0; i <= str.length - n; i++) {
      const gram = str.substring(i, i + n);
      map.set(gram, (map.get(gram) || 0) + 1);
    }
    return map;
  };

  const grams1 = getGrams(s1, 2);
  const grams2 = getGrams(s2, 2);

  let intersection = 0;
  let total1 = 0;
  let total2 = 0;

  grams1.forEach((count, gram) => {
    total1 += count;
    if (grams2.has(gram)) {
      intersection += Math.min(count, grams2.get(gram)!);
    }
  });
  grams2.forEach((count) => {
    total2 += count;
  });

  const ngramSimilarity = total1 + total2 > 0 ? (2 * intersection) / (total1 + total2) * 100 : 0;

  // 2. 计算 Levenshtein 编辑距离
  // 只保留滚动的前后两行（结果与完整二维矩阵完全一致），
  // 空间由 O(len1 × len2) 降为 O(len2)，同时避免每次比对分配 len1+1 个数组。
  const len1 = s1.length;
  const len2 = s2.length;

  let prevRow = new Uint32Array(len2 + 1);
  let currRow = new Uint32Array(len2 + 1);

  for (let j = 0; j <= len2; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    const code1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= len2; j++) {
      const cost = code1 === s2.charCodeAt(j - 1) ? 0 : 1;
      const deletion = prevRow[j] + 1;
      const insertion = currRow[j - 1] + 1;
      const substitution = prevRow[j - 1] + cost;
      let min = deletion;
      if (insertion < min) min = insertion;
      if (substitution < min) min = substitution;
      currRow[j] = min;
    }
    const swap = prevRow;
    prevRow = currRow;
    currRow = swap;
  }

  const distance = prevRow[len2];
  const maxLength = Math.max(len1, len2);
  const levSimilarity = (1 - distance / maxLength) * 100;

  // 3. 混合加权评估：若词袋重合度很高（如调换句子顺序），取较高值防御作弊；平时平滑加权
  let finalSim: number;
  if (ngramSimilarity >= 60) {
    // 语序重排或高度重合
    finalSim = Math.max(levSimilarity, ngramSimilarity);
  } else {
    finalSim = levSimilarity * 0.4 + ngramSimilarity * 0.6;
  }

  return Math.min(100, Math.max(0, Math.round(finalSim)));
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
    return { level: 'safe', color: '#10B981', text: '规范度优（与历史归档高度独立）' };
  } else if (similarity < threshold) {
    return { level: 'warning', color: '#F59E0B', text: '结构适中（可追加本次具体排查细节）' };
  } else {
    return { level: 'danger', color: '#EF4444', text: '一致性过高（建议微调表述或补充细节）' };
  }
}

/**
 * 5. 核心大模型 Prompt 生成器 (豆包/通用大模型)
 */
export function generateAIPrompt(
  userInput: string,
  job: string = 'frontend',
  customJobName: string = '',
  tone: string = 'professional'
): string {
  const jobName = getJobDisplayName(job, customJobName);
  const templateKey = resolveJobKey(job, customJobName);
  const randomTaskSeed = getRandomElement((JOB_TEMPLATES[templateKey] || JOB_TEMPLATES.generic).actions);
  const defaultTaskText = `“日常工作推进：${randomTaskSeed}，核对关键流程与细节无误”`;
  
  const tasksText = userInput.trim()
    ? `【${userInput.trim()}】`
    : defaultTaskText;

  const toneHint = tone === 'daily'
    ? '语气可以更像真实研发日常流水账，具体、可信，不要过度口语到像聊天。'
    : '语气保持专业严谨，突出执行细节与验证结果，杜绝官腔大词与夸大成果。';

  return `你是一个资深 ${jobName}，擅长把当天真实工作记录整理成平实、具体、有执行细节与验证结果的公司内部日报。请根据下面的工作记录，帮我写一份日常工作日志。

今日工作记录：${tasksText}

核心要求：
1. ${toneHint}
2. 绝对不要分点列出（严禁出现 1. 2. 3. 等数字序号或顿号列表）！请写成连贯自然、平实可信的一段话（约 60 到 100 字）。
3. 包含今天处理的核心事情、处理过程与自测状态，看起来像本人真实随手打出来的。
4. 标题简明明确（8 到 14 个字）。

请严格按以下格式直接输出（不要有任何多余的 Markdown 代码块或前后缀解释说明）：
标题：[精准事项标题]
内容：[连贯自然的一段话，不分点]`;
}
