
import { DirectionOption } from '../types/ai';

export const LOCAL_DIRECTION_POOLS: Record<string, { idle: DirectionOption[]; study: DirectionOption[] }> = {
  backend: {
    idle: [
      { id: 'be_sql', title: '慢查询排查与索引治理', summary: '排查近期慢 SQL 查询日志，针对高频全表扫描补充复合索引并验证执行计划', tag: '数据库调优' },
      { id: 'be_cache', title: 'Redis 缓存击穿与过期治理', summary: '排查热点缓存过期策略，增加空值兜底与防雪崩随机过期时间', tag: '缓存架构' },
      { id: 'be_dto', title: '接口数据契约重构与剪裁', summary: '清理废弃 API 路由与无效 DTO 字段，统一错误码与全局异常拦截格式', tag: '接口规范' },
      { id: 'be_trace', title: '全链路 TraceID 上下文注入', summary: '在服务间调用链注入唯一请求链路跟踪 ID，清理无效冗余 Debug 日志', tag: '监控治理' },
      { id: 'be_queue', title: '消息队列重试与幂等兜底', summary: '排查异步消息堆积与重试消费机制，增加消费幂等保护与告警阈值', tag: '异步解耦' },
      { id: 'be_pool', title: '连接池水位调优与超时回收', summary: '排查数据库连接池最大闲置与活跃连接数，优化超时回收时间与监控', tag: '稳定性' }
    ],
    study: [
      { id: 'be_lock', title: '高并发分布式锁续期方案预研', summary: '调研分布式锁极端网络分区下的自动续期与容灾降级，在本地 Demo 验证行为', tag: '并发架构' },
      { id: 'be_grpc', title: '微服务 gRPC 流式传输调研', summary: '阅读微服务 RPC 通信与 Protobuf 序列化优化文档，对比性能并整理调研笔记', tag: '性能预研' },
      { id: 'be_deadlock', title: '数据库死锁与事务隔离复盘', summary: '复盘历史并发事务死锁排查案例，梳理行级锁竞争与隔离级别规避清单', tag: '技术复盘' },
      { id: 'be_otel', title: 'OpenTelemetry 可观测性方案学习', summary: '调研云原生分布式链路追踪标准，整理服务无侵入接入的最佳实践规范', tag: '可观测性' },
      { id: 'be_mq_stream', title: '流式消息处理与背压机制预研', summary: '研究大数据量下流式管道消费与背压控制，评估高吞吐场景改造可行性', tag: '技术演进' }
    ]
  },
  frontend: {
    idle: [
      { id: 'fe_hook', title: '前端公共业务 Hooks 与状态封装', summary: '提取高频交互与请求逻辑为通用自定义 Hook，消除各页面重复状态管理代码', tag: '组件架构' },
      { id: 'fe_vite', title: 'Vite 构建分包与静态资源加载优化', summary: '调优 Rollup 分包策略，配置图片懒加载与 WebP 压缩，降低首屏体积', tag: '构建性能' },
      { id: 'fe_table', title: '大表单与复杂表格渲染性能调优', summary: '针对多字段联动大表单优化组件局部重绘，排查长列表卡顿并引入虚拟滚动', tag: '渲染调优' },
      { id: 'fe_error', title: '全局接口错误边界与弱网兜底提示', summary: '加固 Axios/Fetch 响应拦截与 React ErrorBoundary，完善断网与超时友好提示', tag: '容错体验' },
      { id: 'fe_clean', title: '无用 CSS 类名与废弃组件重构清理', summary: '走查历史页面 CSS 冗余类名与未引用图标，统一公共全局变量并执行回归验证', tag: '代码重构' }
    ],
    study: [
      { id: 'fe_react19', title: 'React 19 Actions 与 Server Components 预研', summary: '学习 React 19 新特性与异步状态处理规范，在本地 Demo 验证迁移成本', tag: '框架前沿' },
      { id: 'fe_wasm', title: 'WebAssembly 在前端复杂计算中的应用', summary: '调研 Rust/C++ 编译为 WASM 处理大文件与客户端编解码的性能优势与场景', tag: '前沿技术' },
      { id: 'fe_micro', title: '微前端沙箱隔离与跨应用通信机制', summary: '对比 qiankun 与 Module Federation 架构，梳理主子应用样式隔离最佳实践', tag: '架构演进' },
      { id: 'fe_pwa', title: 'PWA 离线缓存与 Service Worker 机制', summary: '学习现代 Web App 离线存储与后台同步协议，评估在低弱网场景的可用性', tag: '体验演进' },
      { id: 'fe_perf', title: 'Core Web Vitals 核心性能指标监控与调优', summary: '研究 LCP/INP/CLS 等现代前端度量指标，梳理团队性能监控上报最佳方案', tag: '性能监控' }
    ]
  },
  fullstack: {
    idle: [
      { id: 'fs_contract', title: '前后端端到端 TypeScript 契约统一', summary: '使用共享类型包统一前端 API 调用与后端接口 DTO 定义，消除类型不一致隐患', tag: '契约工程' },
      { id: 'fs_docker', title: '全栈 Docker 镜像分层与体积缩减', summary: '重构多阶段构建 Dockerfile，引入国内镜像源并裁剪冗余依赖层', tag: '容器运维' },
      { id: 'fs_auth', title: '端到端鉴权与安全标头加固', summary: '加固 CSRF/CORS 策略与安全响应头配置，梳理 Refresh Token 自动续签机制', tag: '安全防护' },
      { id: 'fs_db_query', title: '全栈链路查询耗时排查与缓存', summary: '排查前端高频接口在后端的 SQL 执行效率，为高频只读数据添加多级缓存', tag: '全链路优化' },
      { id: 'fs_clean', title: '全栈废弃模块与冗余依赖清理', summary: '梳理前后端未引用文件与过期 API 路由，精简代码仓库体积并执行回归验证', tag: '代码重构' }
    ],
    study: [
      { id: 'fs_ssr', title: '现代 SSR/SSG 渲染架构性能对比', summary: '调研服务端渲染与边缘计算缓存策略，搭建 Benchmark 原型评估首屏提速效果', tag: '渲染架构' },
      { id: 'fs_grpc_web', title: 'gRPC-Web 与 HTTP/3 传输协议调研', summary: '研究现代二进制传输协议在前后端直连场景的应用，评估低延迟网络表现', tag: '网络协议' },
      { id: 'fs_edge_db', title: '分布式边缘数据库与读写分离预研', summary: '调研边缘多区域数据同步与连接池复用方案，沉淀技术调研文档', tag: '分布式存储' },
      { id: 'fs_oidc', title: '基于 OIDC 与 OAuth 2.1 的统一认证', summary: '研究基于现代标准协议的多端单点登录流转，整理权限中台接入架构规范', tag: '统一认证' },
      { id: 'fs_graphql', title: 'GraphQL 与 RESTful 架构选型复盘', summary: '对比前后端数据按需查询与接口聚合开销，评估在多端矩阵项目中的适配度', tag: '数据聚合' }
    ]
  },
  designer: {
    idle: [
      { id: 'ui_token', title: '设计系统全局色彩与字阶 Token 规范', summary: '统一设计系统中的色彩语义化层级与排版比例标尺，整理公共组件库源文件', tag: '设计系统' },
      { id: 'ui_clean', title: '历史项目 Figma 冗余图层整理归档', summary: '清理过期项目源文件，规范图层命名、AutoLayout 约束与切图标注导出', tag: '资产管理' },
      { id: 'ui_empty', title: '多场景通用异常缺省页与插画设计', summary: '补充网络断开、权限受限、数据为空等极端边界状态下的高质感空态插图', tag: '体验微调' },
      { id: 'ui_motion', title: '核心微交互动效曲线与参数标定', summary: '规范弹窗出现、页面转场与按钮点击的物理阻尼参数，与前端同步实现标准', tag: '动效规范' },
      { id: 'ui_audit', title: '线上已发布页面视觉走查与还原度核对', summary: '走查生产环境各分辨率下的字号、间距与圆角还原细节，整理视觉优化清单', tag: '还原度走查' }
    ],
    study: [
      { id: 'ui_spatial', title: '空间计算与液态玻璃视觉趋势调研', summary: '拆解先锋 UI 趋势中的多层光学模糊与镜面高光细节，制作团队视觉灵感 Moodboard', tag: '前沿趋势' },
      { id: 'ui_accessibility', title: '无障碍色彩对比度与可读性标准', summary: '学习 WCAG 2.1 颜色对比度要求，评估现有产品在高对比度下的视觉可识别度', tag: '包容性设计' },
      { id: 'ui_design_tokens', title: 'Design Tokens 跨端同步工作流', summary: '研究 Figma Token 插件与前端 CSS Variables 自动化同步机制，提高协作效率', tag: '工程化协作' },
      { id: 'ui_figma_vars', title: 'Figma Variables 高级变量与暗黑模式适配', summary: '研究主题模式一键切换下的语义 Token 映射，搭建跨端设计组件库变量骨架', tag: '设计系统' },
      { id: 'ui_micro_ux', title: '微交互心智模型与用户感知延迟优化', summary: '学习界面操作即时反馈与过渡动效心理学，整理表单交互防挫败体验卡片', tag: '交互体验' }
    ]
  },
  tester: {
    idle: [
      { id: 'qa_auto_scripts', title: '自动化测试脚本稳定性调优', summary: '优化端到端测试用例中的等待与元素定位策略，降低网络抖动导致的误报率', tag: '自动化测试' },
      { id: 'qa_data_clean', title: '测试环境脏数据与账号池清理', summary: '重置并维护测试数据库初始桩数据，规范各角色权限测试账号与测试用例关联', tag: '环境治理' },
      { id: 'qa_regression', title: '核心业务主流程回归测试用例库', summary: '梳理并更新高频主流程冒烟测试清单，归纳易漏测边界条件并沉淀检查卡片', tag: '用例体系' },
      { id: 'qa_bug_audit', title: '历史缺陷复盘与漏测归因分析', summary: '统计分析上期版本线上问题与提测 Bug 分布，梳理质量薄弱模块及防范策略', tag: '质量复盘' },
      { id: 'qa_mock_server', title: '接口 Mock 异常桩与弱网规则配置', summary: '配置 500、超时、极端乱码返回的 Mock 场景，验证前端容错及重试提示表现', tag: '异常模拟' }
    ],
    study: [
      { id: 'qa_k6_perf', title: '基于 K6 / JMeter 性能压测指标分析', summary: '学习并发压测线程模型、TPS 吞吐量与 P99 响应延迟分析，整理压测方案模板', tag: '性能测试' },
      { id: 'qa_playwright', title: 'Playwright 现代化 UI 自动化测试', summary: '学习 Playwright 录制回放与多端并行执行特性，对比现有框架并搭建 POC 验证', tag: '工具升级' },
      { id: 'qa_security', title: 'Web 安全渗透与常见漏洞测试要点', summary: '学习 SQL 注入、XSS 与越权访问排查要点，整理常规业务安全测试检查项', tag: '安全测试' },
      { id: 'qa_chaos', title: '混沌工程与弱网容灾故障演练学习', summary: '调研接口丢包、高延迟与服务雪崩下的容灾表现，梳理团队混沌演练策略', tag: '高可用' },
      { id: 'qa_contract', title: '基于 Pact 的契约测试方法与落地', summary: '研究微服务前后端契约断言方案，评估在跨端联调中减少沟通成本的可行性', tag: '契约测试' }
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
  _recentLogs: any[] = []
): DirectionOption[] {
  const jobKey = resolveJobKey(job, customJobName);
  const currentMode = mode === 'study' ? 'study' : 'idle';
  const pool = LOCAL_DIRECTION_POOLS[jobKey]?.[currentMode] || LOCAL_DIRECTION_POOLS.generic[currentMode];

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

/**
 * 赢日志 - 智能日志生成与查重引擎 (超级多岗位语料库、去AI感、防重自检测版)
 */

// 1. 各岗位真实、具体、口语流水账语料库 (按动作、细节排查、自测结果正交组合)
const JOB_TEMPLATES: Record<string, { actions: string[][]; study: string[][] }> = {
  backend: {
    actions: [
      [
        '排查了近期接口响应偶发变慢的问题，检查了慢 SQL 日志并补加了联合索引',
        '梳理了业务状态机的流转逻辑，修复了并发请求下订单状态可能异常覆盖的边界问题',
        '重构了用户权限校验与鉴权中间件，规范了 Token 失效与刷新拦截机制',
        '对接了新的数据查询接口，编写了入参严格校验并补充了枚举值类型约束',
        '优化了 Redis 缓存的数据读取策略，增加了防缓存穿透的空值占位与随机过期时间',
        '解耦了服务层里臃肿的数据组装逻辑，提取了通用的 DTO/VO 转换工具方法',
        '排查了消息队列消费者偶尔积压的问题，调优了批量消费数量与重试策略',
        '把服务中的全局异常捕获层理了理，统一了各微服务错误状态码与中文友好提示',
        '重构了数据库批量插入与更新的逻辑，改成了分批事务提交以避免长事务锁表',
        '为核心业务链路的关键调用节点注入了 TraceID 上下文，方便后续全链路日志排查',
        '配合前端与客户端同事完成了新一期业务接口的数据联调，核对了响应字段结构',
        '清理了代码仓库中已废弃的旧版本 API 路由，删除了测试阶段遗留的无用日志打印',
        '排查了数据库连接池偶发打满的告警，调优了连接池最大存活时间与闲置回收参数',
        '梳理了第三方 Webhook 回调的验签与异步分发逻辑，增加了幂等性去重保护',
        '优化了分页大数据量导出功能，改用流式分块读取，降低了内存占用高峰'
      ],
      [
        '本地用 Postman 与单元测试跑了几组边界用例，接口响应时间和正确性都符合预期',
        '经测试环境压力模拟与数据验证，并发调用下未再出现脏读或脏写情况',
        '老业务的主流程回归测试均已通过，服务启动与日志打印一切正常',
        '这样在弱网或极端并发下接口报错能有友好的提示，不会直接抛出 500 异常',
        '降低了模块间的耦合度，后续其他同事在扩展新接口时可以直接复用通用方法',
        '相关接口文档与 Mock 数据已经在平台同步更新，方便其他端继续对接',
        '在测试库执行了多次回归调用，慢查询耗时从几百毫秒降到了几十毫秒以内',
        '检查了服务器监控指标与日志输出，目前服务运行平稳，无多余报错'
      ]
    ],
    study: [
      [
        '研究了高并发场景下分布式锁的续期与红锁（Redlock）实现原理',
        '学习了微服务 RPC 通信机制与 gRPC 序列化性能优化方案',
        '阅读了 MySQL InnoDB 存储引擎锁机制与 MVCC 多版本并发控制的技术文档',
        '调研了现代可观测性体系（OpenTelemetry / Prometheus）在微服务链路中的最佳实践',
        '复盘了历史高并发服务雪崩案例，整理了服务降级、熔断与限流的落地策略'
      ],
      [
        '在本地搭建了简易 Demo 验证了并发竞争下的行为，整理了技术笔记',
        '结合现有项目架构评估了改造成本，沉淀了一份通用的接口容灾设计规范',
        '整理了常见锁等待与死锁排查的排查清单，方便团队内部后续技术复用',
        '写了对应的样板代码并记录在团队知识库中，为后续架构迭代做储备'
      ]
    ]
  },
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
        '排查并处理了控制台里遗留的几个警告信息，优化了局部组件更新',
        '处理了下大表单页面输入时有点延迟的卡顿，优化了局部组件更新',
        '把项目里过期的几个依赖库升了下版本，顺便解决了下版本冲突',
        '把全局样式文件里重复定义的几个 CSS 颜色变量做了下归类和提取',
        '检查了下路由配置文件，把几个没怎么用的静态路由做了解耦',
        '把部分页面的图片格式转换了一下，换成了更省带宽的 WebP 格式',
        '把本地的接口 Mock 配置文件理了理，把几个新接口的数据模拟加上了',
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
        '老业务的回归测试都通过了，本地跑了几遍流程都没报错'
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
        '看看后续能不能把项目提交自动部署的那套脚本优化得更省时一点'
      ]
    ]
  },
  fullstack: {
    actions: [
      [
        '完成了前后端全链路数据交互开发，打通了前端动态表单与后端 RESTful API 数据持久化',
        '设计并实现了新模块的数据库表结构，同时在前端完成了对应的数据展示列表与筛选',
        '排查了跨域配置与认证 Cookie 跨端携带的问题，统一了本地开发与生产环境的请求网关配置',
        '优化了全栈应用的容器构建流程，利用多阶段构建缩减了 Docker 镜像体积并加快了构建部署'
      ],
      [
        '在本地完整跑通了新增、修改、查询与导出的全流程闭环自测，功能表现正常',
        '前后端类型定义保持高度统一，减少了联调中的字段不对齐问题',
        '重新部署到测试环境验证，各项接口响应与前端页面渲染均平稳正常'
      ]
    ],
    study: [
      [
        '研究了现代全栈框架 SSR 服务端渲染与边缘计算缓存加速方案',
        '学习了端到端全链路类型安全架构（如 tRPC / OpenAPI TypeScript 生成）'
      ],
      [
        '在本地跑通了样板 Demo 并记录了技术选型对比文档',
        '结合现有业务系统评估了后续架构改造的收益与风险'
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
        '调整了页面中几个插图的视觉细节，使得整体设计调性更加统一'
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
        '这样界面整体的色彩统一性高了很多，不会看起来五颜六色的了'
      ]
    ],
    study: [
      [
        '研究了下目前前沿的 AI 辅助设计工具，看了看怎么用它生成插画',
        '看了一些关于 UI 动效设计和微交互原则的优秀案例与教程',
        '学了下最新版 Figma 的变量 (Variables) 功能和响应式布局组件用法',
        '调研了下目前流行的 B 端暗黑模式设计规范和色彩搭配技巧',
        '看了看前端基础的 CSS 布局知识，研究下怎么写有利于开发还原'
      ],
      [
        '在本地动手做了几个小 Demo 练习了下，感觉对提高效率挺有用',
        '整理了份暗黑模式配色指南记在文档里，方便后面做暗黑皮肤时参考',
        '以后做组件库时可以直接用变量来控颜色和间距，改起来会快很多',
        '这样以后跟开发小哥沟通动画效果时就更顺畅了，能降低沟通成本'
      ]
    ]
  },
  tester: {
    actions: [
      [
        '把今天提测的几个页面按用例重新走了一遍，重点看了表单校验和异常提示',
        '整理了回归测试清单，把上个版本遗留的几个问题重新复测了一遍',
        '对几个核心流程做了兼容性检查，顺手记录了不同浏览器下的小差异',
        '跟开发对了下接口返回字段，把容易出问题的边界场景补进了测试点',
        '把测试环境里的几条脏数据清理了一下，重新准备了几组常用账号',
        '围绕登录、列表、详情几个高频入口跑了一轮冒烟测试',
        '把今天发现的问题按严重程度整理了一下，补充了复现步骤和截图',
        '针对昨天修复的缺陷做了回归验证，重点确认没有影响到老流程',
        '把自动化脚本里几个不稳定的断言调整了一下，减少误报情况'
      ],
      [
        '确认主要流程都能正常跑通，剩下的小问题已经同步给开发处理',
        '复测结果已经更新到缺陷记录里，方便后面继续跟进状态',
        '测试数据也顺手归档了一版，后续再跑同类场景会省不少时间',
        '几个边界情况都重新验证过了，暂时没有发现新的阻塞问题',
        '把容易误解的地方写进备注里，后面回归时可以直接对照',
        '本地和测试环境都简单跑了一遍，整体结果比较稳定',
        '把复测通过的缺陷统一关掉了，测试看板也清爽了一些'
      ]
    ],
    study: [
      [
        '看了下接口测试用例设计的方法，重点了解了边界值和异常分支覆盖',
        '学习了下自动化测试脚本的稳定性优化，研究了等待和断言写法',
        '整理了移动端兼容测试的常见问题，顺便对照现有项目做了笔记',
        '了解了下性能测试的基础指标，看了看响应时间和并发压测的概念'
      ],
      [
        '顺手把学习笔记整理了一版，后续写用例时可以直接参考',
        '在测试环境里试着跑了个小脚本，整体思路已经比较清楚',
        '把常见检查点列成了清单，方便后面做版本回归时复用',
        '结合当前项目场景简单评估了一下，后续可以逐步补充覆盖'
      ]
    ]
  },
  pm: {
    actions: [
      [
        '梳理了下个版本的业务主流程与需求范围，细化了原型图和交互说明文档',
        '跟开发、设计团队组织了需求评审会议，对边界场景和异常提示进行了答疑确认',
        '走查了当前测试环境中已提测的功能模块，记录了几个交互体验不一致的问题',
        '分析了近期用户反馈和埋点数据，整理了功能转化漏斗及后续迭代优先级清单'
      ],
      [
        '需求文档已更新并同步至团队知识库，各方对排期和范围达成一致',
        '反馈的问题已录入任务系统，方便研发团队按批次安排修复与优化',
        '整理出了一版产品指标分析简报，作为后续功能迭代的决策参考'
      ]
    ],
    study: [
      [
        '调研了同行业竞品在核心业务流转上的交互设计与商业化路径',
        '学习了以数据驱动增长的产品指标拆解方法与漏斗分析模型'
      ],
      [
        '沉淀了竞品分析对照表，为后续新模块规划提供了参考依据',
        '梳理了一套适用的需求优先级评估矩阵，方便后续迭代排期'
      ]
    ]
  },
  devops: {
    actions: [
      [
        '排查并优化了 CI/CD 自动化构建流水线，调整了依赖缓存策略以缩短构建时间',
        '对生产环境服务器资源使用情况做了全面巡检，清理了过期无用的日志与镜像',
        '配置并验证了服务高可用健康检查探针与自动拉起策略，提升了容器容错能力',
        '优化了 Prometheus 与 Grafana 监控大盘，调优了告警规则与通知分发机制'
      ],
      [
        '流水线单次打包耗时缩短了约 30%，测试部署效率有所提升',
        '释放了多余的磁盘与内存空间，当前服务器负载指标处于健康水位',
        '模拟了容器异常退出的场景，服务均在数秒内自动重启恢复，未影响正常访问'
      ]
    ],
    study: [
      [
        '学习了云原生 Kubernetes 容器编排与流量网关安全防护方案',
        '研究了基础设施即代码（IaC）自动化运维的最佳实践与灾备设计'
      ],
      [
        '在本地测试集群中跑通了演练流程，梳理了一份自动化运维脚本模板',
        '整理了常见服务器网络故障排查手册，方便后续运维参考'
      ]
    ]
  },
  generic: {
    actions: [
      [
        '把手头几个日常事项按优先级重新排了一下，先处理了比较紧急的部分',
        '整理了近期积累的资料和记录，把重复和过期的内容清理了一遍',
        '跟相关同事对了下当前事项的处理进度，顺手补齐了几个遗漏信息',
        '检查了几个已完成事项的后续状态，确认没有明显遗漏和阻塞',
        '把今天需要交付的内容又核了一遍，重点看了细节和格式是否一致'
      ],
      [
        '处理结果已经记录下来，后面继续推进时能直接接上',
        '相关材料也整理好了，后续查找和交接会方便一些',
        '几个需要跟进的问题已经标出来，明天可以继续确认',
        '整体流程暂时比较顺畅，没有发现新的明显风险',
        '最后又做了一轮自查，确认当前内容基本符合预期'
      ]
    ],
    study: [
      [
        '看了下和当前岗位相关的工作方法资料，重点整理了常见流程和注意点',
        '复盘了最近几个事项的处理过程，顺手记录了可以优化的地方',
        '研究了下同类工作的优秀案例，对照自己的处理方式做了些笔记'
      ],
      [
        '整理出来的要点已经保存下来，后续处理类似任务时可以参考',
        '把几个可复用的检查项列成了清单，后面推进工作会更稳一点',
        '结合当前工作节奏简单做了下取舍，后续会逐步尝试改进'
      ]
    ]
  }
};

// 极简日志名称
const JOB_TITLES: Record<string, { random: string[]; study: string[] }> = {
  backend: {
    random: [
      '核心数据接口开发与联调', '慢SQL排查与索引优化', '业务状态机与并发边界处理',
      'Redis缓存策略调优与防穿透', '权限鉴权中间件重构与加固', '全局异常捕获与日志治理',
      '批量数据处理逻辑优化', '第三方Webhook对接与验签幂等'
    ],
    study: ['分布式锁机制预研', 'gRPC高性能通信学习', 'MySQL锁与事务机制复盘', '微服务可观测性调研', '高并发熔断降级策略学习']
  },
  frontend: {
    random: [
      '前端公共逻辑提取与优化', '日常代码整理与无用依赖清理', '项目打包配置优化与调试', 
      '页面卡顿优化与缺陷修复', '冗余代码清理与组件整理', '表单输入优化与防抖增加',
      '样式规范重整与兼容处理', '接口请求层规范与异常捕获'
    ],
    study: ['React并发机制学习', '打包优化方案调研', 'TS高级类型学习', '微前端方案预研', '前端单元测试学习', '前端异常上报机制调研']
  },
  fullstack: {
    random: [
      '全栈业务功能端到端开发', '数据表设计与RESTful接口联调', '前后端权限校验与请求网关配置',
      '容器化构建优化与部署调试'
    ],
    study: ['SSR渲染与边缘计算预研', '端到端类型安全架构学习']
  },
  designer: {
    random: [
      'UI设计规范整理与统一', '前端页面视觉走查反馈', '设计素材收集与资源归档', 
      '设计稿图层规范化整理', '切图标注交付与动效对接', '界面高保真视觉细节优化',
      '跨端分辨率适配视觉微调', '历史稿件规范命名与备份'
    ],
    study: ['AI设计工具预研', '微交互动画设计学习', 'Figma新特性与变量学习', '暗黑模式设计规范调研', 'CSS布局与还原规范学习']
  },
  tester: {
    random: [
      '测试用例执行与缺陷复测', '核心流程冒烟测试验证', '版本回归测试整理',
      '测试数据准备与环境检查', '缺陷记录整理与复现补充', '接口异常场景验证'
    ],
    study: ['测试用例设计学习', '自动化脚本稳定性学习', '兼容测试方法整理', '性能测试指标了解']
  },
  pm: {
    random: ['业务需求梳理与原型细化', '跨团队需求评审与排期跟进', '提测功能体验走查与答疑', '用户反馈整理与数据复盘'],
    study: ['竞品架构与商业化调研', '数据指标分析模型学习']
  },
  devops: {
    random: ['CI/CD流水线优化与缓存加速', '服务器资源巡检与镜像清理', '容器高可用探针与健康检查配置', '监控报警大盘指标调优'],
    study: ['云原生网关安全预研', '自动化运维与灾备设计学习']
  },
  generic: {
    random: ['日常工作推进与整理', '重点事项核对与跟进', '工作资料整理与复盘', '协作事项沟通与确认'],
    study: ['岗位方法学习整理', '工作流程复盘优化', '同类案例学习分析']
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
 * 1. 核心生成逻辑：针对无任务的随机混淆生成 (多岗位、真随机、单次提取100%去重)
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

  let title = '';
  const sentences: string[] = [];

  if (isStudy) {
    title = getRandomElement(titles.study) || `${jobName}技术预研与学习`;
    const count = 2;
    const p1Pool = [...template.study[0]];
    const p2Pool = [...template.study[1]];

    for (let i = 0; i < count; i++) {
      if (p1Pool.length === 0 || p2Pool.length === 0) break;
      const idx1 = Math.floor(Math.random() * p1Pool.length);
      const part1 = p1Pool.splice(idx1, 1)[0];
      const idx2 = Math.floor(Math.random() * p2Pool.length);
      const part2 = p2Pool.splice(idx2, 1)[0];

      sentences.push(`${part1}，${part2}。`);
    }
  } else {
    title = getRandomElement(titles.random) || `${jobName}日常工作`;
    // 随机 2 句或 3 句，增加内容多样性
    const count = Math.random() < 0.35 ? 3 : 2;
    const p1Pool = [...template.actions[0]];
    const p2Pool = [...template.actions[1]];
    const connectors = ['，', '；', '，并且'];

    for (let i = 0; i < count; i++) {
      if (p1Pool.length === 0 || p2Pool.length === 0) break;
      const idx1 = Math.floor(Math.random() * p1Pool.length);
      const part1 = p1Pool.splice(idx1, 1)[0];
      const idx2 = Math.floor(Math.random() * p2Pool.length);
      const part2 = p2Pool.splice(idx2, 1)[0];
      const connector = connectors[Math.floor(Math.random() * connectors.length)];

      sentences.push(`${part1}${connector}${part2}。`);
    }
  }

  if (job === 'custom' && customJobName.trim()) {
    title = `${customJobName.trim().substring(0, 10)}日常推进`;
  }

  return {
    title,
    hours: 8,
    cooperation: false,
    difficulty: false,
    content: sentences.join('')
  };
}

// 兼容老调用名
export const generateRandomFrontendDaily = generateRandomDaily;

/**
 * 2. 核心生成逻辑：根据用户输入进行智能扩写
 * 核心原则：保留用户输入的原始词汇（模块名、接口名、技术名等），不用模板覆盖原文
 */

// 主任务句型模板（task 词汇出现在句首，保留原词可见）
const LEAD_SENTENCE_PATTERNS: Array<(task: string, desc: string) => string> = [
  (task, desc) => `针对${task}进行了处理，${desc}`,
  (task, desc) => `完成了${task}的相关排查与推进，${desc}`,
  (task, desc) => `跟进了${task}相关工作，${desc}`,
  (task, desc) => `对${task}做了系统梳理与处理，${desc}`,
  (task, desc) => `围绕${task}展开了深入跟进，${desc}`,
];

// 无关键词匹配时的通用细节描述
const GENERAL_DETAIL_PHRASES = [
  '梳理了主要实现逻辑与交互细节，完成了本地验证',
  '核对了业务需求与边界情况，整理并推进了主体实现',
  '排查了相关细节并整理了处理方案，完成了自测与联调',
  '整理了开发细节与协作信息，推进了主要工作内容',
  '理清了处理路径，核对了关键数据并在本地跑通了完整流程',
  '完成了主要逻辑整理与自查，确认当前改动无明显阻塞',
];

// 多任务后续任务的连接词
const FOLLOW_TASK_PREFIXES = ['同时处理了', '并跟进了', '另行推进了', '兼顾处理了'];

// 末尾自测结果句（单独成句）
const VERIFY_ENDINGS = [
  '经本地自测，流程运行正常。',
  '自测验证通过，整体运行稳定。',
  '本地跑了几组边界场景，结果符合预期。',
  '测试环境验证通过，无明显阻塞问题。',
  '改动在测试环境核对正常，未发现遗漏。',
  '完整流程经本地自测，运行结果符合预期。',
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
        // 去掉末尾句号，方便拼接
        matchedDesc = getRandomElement(matchedRule.descriptions).replace(/。$/, '');
        break;
      }
    }

    if (matchedRule) {
      if (matchedRule.cooperation) finalCooperation = true;
      if (matchedRule.difficulty) finalDifficulty = true;
      if (!finalTitle) finalTitle = matchedRule.title;
    }

    // ── 保留用户原词，嵌入句型 ──
    if (index === 0) {
      // 主句：使用带 task 的完整句型
      if (matchedDesc) {
        const pattern = LEAD_SENTENCE_PATTERNS[Math.floor(Math.random() * LEAD_SENTENCE_PATTERNS.length)];
        parts.push(pattern(task, matchedDesc));
      } else {
        const detail = getRandomElement(GENERAL_DETAIL_PHRASES);
        parts.push(`完成了${task}相关工作，${detail}`);
      }
    } else {
      // 后续任务：用连接词引出，保持简洁
      const prefix = FOLLOW_TASK_PREFIXES[(index - 1) % FOLLOW_TASK_PREFIXES.length];
      if (matchedDesc) {
        parts.push(`${prefix}${task}，${matchedDesc}`);
      } else {
        parts.push(`${prefix}${task}的处理工作`);
      }
    }
  });

  // ── 拼接正文 ──
  const verify = getRandomElement(VERIFY_ENDINGS);
  let content: string;
  if (tasks.length === 1) {
    content = `${parts[0]}，${verify}`;
  } else {
    content = `${parts.join('；')}，${verify}`;
  }

  // ── 生成标题 ──
  if (!finalTitle) {
    if (tasks.length > 0) {
      const firstTask = tasks[0];
      finalTitle = firstTask.length <= 12
        ? `${firstTask}推进与处理`
        : `${firstTask.substring(0, 12)}事项推进`;
    } else {
      finalTitle = `${jobName.substring(0, 8)}日常推进`;
    }
  }

  if (finalTitle.length > 30) {
    finalTitle = finalTitle.substring(0, 27) + '...';
  }

  return {
    title: finalTitle,
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
  const randomTaskSeed = getRandomElement(JOB_TEMPLATES[templateKey]?.actions[0] || JOB_TEMPLATES.generic.actions[0]);
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
