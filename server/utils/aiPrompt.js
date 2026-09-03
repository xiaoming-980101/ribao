export function getJobDisplayName(job, customJobName = '') {
  if (job === 'backend') return '后端开发工程师';
  if (job === 'frontend') return '前端开发工程师';
  if (job === 'fullstack') return '全栈开发工程师';
  if (job === 'designer') return 'UI/UX 视觉设计师';
  if (job === 'tester') return '测试工程师';
  if (job === 'pm') return '产品经理';
  if (job === 'devops') return '运维与SRE工程师';
  if (job === 'custom') return String(customJobName || '').trim() || '自定义岗位';
  return '软件开发工程师';
}

export const JOB_SCENARIO_POOLS = {
  frontend: {
    task: [
      '"业务开发：开发业务页面交互与响应式表单，封装通用业务组件，配合后端联调接口数据并完成本地自测"',
      '"页面构建：调整页面展示样式，调试看板数据渲染逻辑，处理部分页面显示小问题"',
      '"流程联调：对接后端新接口，核对字段映射并完善请求异常兜底，自测主流程流转正常"',
      '"组件开发：把页面里几处重复度比较高的操作弹窗提取成了公用组件，清理部分无用样式"'
    ],
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
    task: [
      '"业务研发：编写核心数据接口与业务状态机转换逻辑，核对入参校验与枚举定义，本地通过单元测试并与前端完成联调"',
      '"接口开发：实现批量数据查询与聚合统计接口，优化分页查询与索引命中，配合客户端联调接口字段"',
      '"服务联调：联调用户认证与权限校验中间件，补充 Token 刷新与异常拦截处理，验证边界状态码返回"',
      '"模块推进：推进订单结算流转及状态持久化开发，梳理事务回滚机制，在本地环境跑通正反向测试用例"',
      '"数据流转：对接第三方 Webhook 消息通知与异步验签机制，补齐重试队列消费逻辑并自测异常兜底"'
    ],
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
    task: [
      '"全栈推进：完成前后端数据通道与管理后台全链路开发，联调权限校验与动态表单，自测核心流转闭环"',
      '"功能闭环：设计数据表结构并实现对应 RESTful 接口，同步完成前端可视化表格展示与批量操作功能"'
    ],
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
    task: [
      '"设计开发：细化核心页面高保真视觉稿、核对产品线框流程、整理切图交付并走查开发还原效果"',
      '"视觉产出：设计新功能模块的交互组件态与异常空状态，输出规范化矢量图标与跨分辨率设计交付物"'
    ],
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
    task: [
      '"测试验证：执行提测功能用例、复测历史缺陷、补充异常场景和复现步骤，并整理回归测试结果"',
      '"质量把控：围绕本期迭代核心流程执行端到端功能测试，验证接口边界值与弱网环境下的异常容错表现"'
    ],
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
    task: [
      '"需求推进：梳理下阶段产品业务流程与功能清单，产出原型线框图，与研发、设计团队组织需求评审与答疑"',
      '"项目跟进：跟进当前迭代各研发模块提测进度，协调跨部门资源排期，走查已提测功能的交互逻辑一致性"'
    ],
    idle: [
      { id: 'pm_funnel', title: '核心转化漏斗与用户埋点数据复盘', summary: '分析近期功能上线后的留存、点击转化与流失环节，产出核心功能数据分析简报', tag: '数据复盘' },
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
    task: [
      '"运维推进：更新持续集成 CI/CD 构建流水线，优化自动化打包分发脚本，核对生产环境配置变更清单"',
      '"集群部署：配置服务容器化扩缩容策略与健康检查探针，联调日志收集与监控告警通道，验证高可用切换"'
    ],
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
    task: [
      '"工作推进：按排期推进今日重点事项处理，核对关键业务细节，整理协作过程记录，确认后续跟进节点"'
    ],
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

function getRandomItem(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getJobKey(job, customJobName = '') {
  if (job && job !== 'custom' && JOB_SCENARIO_POOLS[job]) {
    return job;
  }
  if (job === 'custom') {
    const custom = (customJobName || '').toLowerCase();
    if (custom.includes('前端') || custom.includes('web') || custom.includes('h5') || custom.includes('小程序')) {
      return 'frontend';
    } else if (custom.includes('后端') || custom.includes('java') || custom.includes('go') || custom.includes('python') || custom.includes('php') || custom.includes('c++') || custom.includes('c#') || custom.includes('node') || custom.includes('服务端')) {
      return 'backend';
    } else if (custom.includes('全栈')) {
      return 'fullstack';
    } else if (custom.includes('设计') || custom.includes('ui') || custom.includes('ux') || custom.includes('视觉')) {
      return 'designer';
    } else if (custom.includes('测试') || custom.includes('qa')) {
      return 'tester';
    } else if (custom.includes('产品') || custom.includes('pm')) {
      return 'pm';
    } else if (custom.includes('运维') || custom.includes('sre') || custom.includes('devops')) {
      return 'devops';
    }
  }
  return 'generic';
}

export function buildTaskSeed(userInput, job, mode, customJobName = '') {
  const currentMode = mode === 'idle' || mode === 'study' ? mode : 'task';
  const explicitInput = typeof userInput === 'string' ? userInput.trim() : '';

  if (currentMode === 'task' && explicitInput) {
    return `【${explicitInput}】`;
  }

  const jobKey = getJobKey(job, customJobName);
  const pool = JOB_SCENARIO_POOLS[jobKey]?.[currentMode] || JOB_SCENARIO_POOLS.generic[currentMode];
  
  if (Array.isArray(pool) && pool.length > 0) {
    const item = getRandomItem(pool);
    if (typeof item === 'string') return item;
    if (item && item.title) return `"${item.title}：${item.summary}"`;
  }
  return `"推进当天${getJobDisplayName(job, customJobName)}相关事项，核对细节并完成自测自查"`;
}

export function buildDirectionsPrompt({
  job = 'frontend',
  customJobName = '',
  mode = 'idle',
  platform = '',
  recentLogs = []
}) {
  const jobName = getJobDisplayName(job, customJobName);
  const modeLabels = { idle: '系统维护/日常优化', study: '架构预研/技术学习' };
  const modeLabel = modeLabels[mode] || '日常';
  const cleanPlatform = typeof platform === 'string' ? platform.trim() : '';

  let historyContext = '';
  if (Array.isArray(recentLogs) && recentLogs.length > 0) {
    const historySnippets = recentLogs
      .slice(0, 8)
      .map((log, i) => `  - 历史${i + 1}: ${log.title ? '[' + log.title + '] ' : ''}${(log.content || '').slice(0, 60)}`)
      .join('\n');
    historyContext = `\n近期已完成的事项（避免推荐完全相同的方向）：\n${historySnippets}\n`;
  }

  const platformInstruction = cleanPlatform
    ? `\n【重要：用户当前负责/维护的系统或平台】: 【${cleanPlatform}】\n请务必紧密围绕【${cleanPlatform}】这一系统的真实业务特性与当前 ${jobName} 的一线职责进行发挥发散，5 个切入点必须带有该系统的业务场景或直接出现该系统名称（例如涉及该系统的表单交互、数据接口、缓存、数据库查询、定时任务或状态流转等），严禁给出与该系统完全脱节的空泛建议！\n`
    : '';

  const systemPrompt = `你是一名在企业一线工作的资深 ${jobName}。你熟知互联网真实各业务系统（如中台、支付、后台、商城、数据大盘等）的研发、维护、联调与调优实践，绝不堆砌空洞虚假的概念大词。`;

  const userPrompt = `作为一名 ${jobName}，今天需要在【${cleanPlatform ? cleanPlatform + ' - ' : ''}${modeLabel}】状态下，整理 5 个真实接地气、供用户自由勾选的工作切入点。${platformInstruction}${historyContext}\n\n核心要求：\n1. 5 个方向必须高度接地气、真实可信${cleanPlatform ? `且贴合【${cleanPlatform}】业务` : ''}，绝不能出现"深度赋能"、"全链路闭环"等假大空八股文。\n2. 每个方向包含：\n   - 简明精准的标题（8 到 14 个字${cleanPlatform ? '，可带有系统名称' : ''}）\n   - 具体的实施要点摘要（20 到 35 个字，包含具体动作）\n   - 一个精炼的标签 tag（2 到 4 个字）\n3. 严格按 JSON 数组格式直接输出：\n[\n  { "id": "dir_1", "title": "...", "summary": "...", "tag": "..." },\n  { "id": "dir_2", "title": "...", "summary": "...", "tag": "..." },\n  { "id": "dir_3", "title": "...", "summary": "...", "tag": "..." },\n  { "id": "dir_4", "title": "...", "summary": "...", "tag": "..." },\n  { "id": "dir_5", "title": "...", "summary": "...", "tag": "..." }\n]`;

  return { systemPrompt, userPrompt };
}

export function parseDirections(rawText, job, mode, customJobName = '', platform = '') {
  const cleanPlatform = typeof platform === 'string' ? platform.trim() : '';

  if (rawText && typeof rawText === 'string' && rawText.trim()) {
    try {
      const cleaned = rawText
        .replace(/^[\s\S]*?\[/, '[')
        .replace(/\][\s\S]*$/, ']')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.slice(0, 5).map((item, idx) => ({
          id: item.id || `dir_${idx + 1}`,
          title: String(item.title || `工作方向 ${idx + 1}`).replace(/^[0-9]+[、.\s]*/, '').trim(),
          summary: String(item.summary || '').trim(),
          tag: String(item.tag || '日常维护').trim()
        }));
      }
    } catch (e) {
      console.warn('解析方向建议 JSON 失败，回退到内置智能种子库:', e.message || e);
    }
  }

  const jobKey = getJobKey(job, customJobName);
  const currentMode = mode === 'study' ? 'study' : 'idle';
  const pool = JOB_SCENARIO_POOLS[jobKey]?.[currentMode] || JOB_SCENARIO_POOLS.generic[currentMode];
  
  if (Array.isArray(pool) && pool.length > 0) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5).map((item, idx) => {
      if (typeof item === 'object') {
        const title = cleanPlatform ? `${cleanPlatform}${item.title}` : item.title;
        const summary = cleanPlatform ? `针对${cleanPlatform}，${item.summary}` : item.summary;
        return {
          ...item,
          id: `local_dir_${idx + 1}`,
          title: title.length > 18 ? title.slice(0, 17) : title,
          summary
        };
      }
      return {
        id: `local_dir_${idx + 1}`,
        title: cleanPlatform ? `${cleanPlatform}维护事项 ${idx + 1}` : `工作方向 ${idx + 1}`,
        summary: cleanPlatform ? `针对${cleanPlatform}：${item}` : item,
        tag: currentMode === 'study' ? '技术预研' : '日常维护'
      };
    });
  }

  return [];
}

export function buildPrompts({
  userInput,
  job = 'frontend',
  customJobName = '',
  tone = 'professional',
  mode = 'task',
  currentTitle = '',
  currentContent = '',
  recentLogs = []
}) {
  const jobName = getJobDisplayName(job, customJobName);
  const isDoubaoPromptMode = mode === 'doubao_prompt';
  const isTweakMode = mode === 'tweak';

  const promptTaskMode = isDoubaoPromptMode ? 'idle' : mode;
  const tasksText = (isTweakMode || isDoubaoPromptMode)
    ? ''
    : buildTaskSeed(userInput, job, promptTaskMode, customJobName);
  const doubaoTasksText = buildTaskSeed(userInput, job, userInput && String(userInput).trim() ? 'task' : 'idle', customJobName);

  let antiRepetitionNotice = '';
  if (Array.isArray(recentLogs) && recentLogs.length > 0) {
    const historySnippets = recentLogs
      .slice(0, 8)
      .map((log, i) => `  - 历史${i + 1}: ${log.title ? '[' + log.title + '] ' : ''}${(log.content || '').slice(0, 60)}`)
      .join('\n');
    antiRepetitionNotice = `\n近期历史记录（避免重复）：\n${historySnippets}\n`;
  }

  const systemPrompt = `你是一名严谨高效的资深 ${jobName}。你擅长把研发工作提炼为简明、客观、干练的工作事项记录，坚决杜绝日记式流水账（严禁出现"今天我花了时间"、"刚刚发现"、"挺省事的"等主观口语），字句精简有力。`;

  let userPrompt = '';

  if (isDoubaoPromptMode) {
    userPrompt = `请生成一段简明提示词模板，帮我把研发任务提炼成客观精练的工作记录。\n事项输入：${doubaoTasksText}\n要求：不要分序号，写成简练干练的一两句话（约 35 到 60 字），包含核心动作与自测状态，非日记体。\n仅输出提示词内容，无代码块。`;
  } else if (isTweakMode) {
    userPrompt = `请对下面这段工作事项做精简优化，去除冗余废话和日记口吻，提炼为客观干练的事项记录：\n原标题：${String(currentTitle || '').trim() || '未填写'}\n原内容：${String(currentContent || '').trim()}\n\n要求：\n1. 语言客观干练、简明扼要，严禁写成日记流水账（严禁出现"今天我..."、"发现..."、"挺好"等口语）。\n2. 严禁分点（不带 1. 2. 3. 序号），写成连贯精炼的一两句话（控制在 35 到 65 个字左右）。\n3. 包含"核心处理动作 + 处理要点 + 自测/联调正常"。\n\n请严格按以下格式输出（不要有 Markdown 代码块）：\n标题：[8到14字事项名称]\n内容：[简明扼要的一两句话，35到65字左右]`;
  } else {
    userPrompt = `请把以下工作任务，提炼为一份简明、干练、客观的标准工作事项记录：\n\n今日输入：${tasksText}\n\n核心规范：\n1. 【简明干练，拒绝日记体】：严禁写成"今天我做了什么"、"先做A再做B"等日记流水账！请使用客观干练的职场书面语（例如："配合后端联调订单结算接口，修复优惠券计算显示逻辑，自测下单流程正常。"）。\n2. 【长度适中，禁止分点】：不要分点列出（不带 1. 2. 序号），写成连贯精简的一两句话，字数严格控制在 40 到 80 个中文字左右。\n3. 【结构清晰】：客观表述"主要处理事项 + 关键细节/修复点 + 验证自测正常"。\n4. 【标题提炼】：提炼精准简洁的事项名称（8 到 14 个字）。\n5. 【必须保留具体名词】：用户输入中出现的模块名、接口名、功能名、技术名词等具体词汇，必须原样出现在输出中，严禁将用户写的具体词汇（如"用户中台登录接口"、"Redis缓存击穿"）泛化成"相关接口"、"缓存问题"等模糊表述，输出必须体现用户输入的核心具体词汇。\n${antiRepetitionNotice}\n请严格按以下格式输出（严禁包含代码块标记或额外说明）：\n标题：[精准事项标题]\n内容：[简明客观的一两句话，40到80字]`;
  }

  return { systemPrompt, userPrompt };
};

export function parseGeneratedLog(rawText, defaultTitle = '', defaultContent = '') {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    return {
      title: defaultTitle || '日常开发与维护推进',
      content: defaultContent || '推进前端页面交互与逻辑优化，排查局部细节并完成自测。'
    };
  }

  let text = rawText
    .replace(/```[a-zA-Z]*\n?/g, '')
    .replace(/```/g, '')
    .trim();

  let title = '';
  let extractedContent = '';

  const titleMatch = text.match(/(?:^|\n)\s*(?:\*\*|__)?(?:标题|事项名称|主题|Title)(?:\*\*|__)?\s*[:：]\s*(.+?)(?=\n|$)/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim().replace(/^["'*#\s\[\]]+|["'*#\s\[\]]+$/g, '');
  }

  const contentMatch = text.match(/(?:^|\n)\s*(?:\*\*|__)?(?:内容|工作内容|事项内容|流水|Content)(?:\*\*|__)?\s*[:：]\s*([\s\S]+)/i);
  if (contentMatch && contentMatch[1]) {
    extractedContent = contentMatch[1].trim();
  } else if (titleMatch) {
    const titleIndex = text.indexOf(titleMatch[0]);
    const afterTitle = text.slice(titleIndex + titleMatch[0].length).trim();
    if (afterTitle && afterTitle.length > 5) {
      extractedContent = afterTitle;
    }
  }

  if (!extractedContent && !titleMatch) {
    extractedContent = text;
  }

  extractedContent = extractedContent
    .replace(/^(?:标题|事项名称|主题)[:：].*$/gm, '')
    .replace(/^[0-9]+[、.\s]+/gm, '')
    .replace(/\n+/g, '')
    .replace(/^[""]|[""]$/g, '')
    .trim();

  if (!extractedContent || extractedContent.length < 5) {
    extractedContent = defaultContent || '推进前端页面交互与逻辑优化，排查局部细节并完成自测。';
  }

  if (!title) {
    title = defaultTitle || extractedContent.slice(0, 14) || '前端开发与优化';
  }

  title = title.replace(/^["'*#\s\[\]]+|["'*#\s\[\]]+$/g, '').trim();

  return { title, content: extractedContent };
}
