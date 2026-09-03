/**
 * 赢日志 - 核心新特性全链路自动化端到端测试 (E2E Feature Test Suite)
 * 验证：
 * 1. 用户鉴权与 JWT 生成
 * 2. 日志修改版本快照追溯 (Log Revision History Snapshot)
 * 3. 软删除进入回收站 (Soft-delete to Trash)
 * 4. 从回收站恢复日志 (Restore Log from Trash)
 * 5. 永久清空回收站 (Clear Trash)
 * 6. 周报持久化存储与归档 (Weekly Report Persistence)
 * 7. AI 启发式工作方向智能推荐 (Direction Suggestions)
 */

import http from 'http';
import app from '../server/index.js';

let server;
const TEST_PORT = 3899;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runE2ETests() {
  console.log('====================================================');
  console.log('🚀 开始执行核心新特性端到端 (E2E) 自动化测试流水线');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, message) {
    totalCount++;
    if (!condition) {
      console.error(`❌ [FAIL] ${message}`);
      throw new Error(`断言失败: ${message}`);
    } else {
      passedCount++;
      console.log(`✅ [PASS] ${message}`);
    }
  }

  try {
    // 1. 登录
    console.log('👉 [测试 1] 用户鉴权与 Token 生成');
    const loginRes = await request('POST', '/api/login', {}, {
      username: 'admin',
      password: 'admin123'
    });
    assert(loginRes.status === 200, '管理员账号登录成功 (HTTP 200)');
    assert(typeof loginRes.body.token === 'string' && loginRes.body.token.length > 20, '返回合法 JWT Token');
    const token = loginRes.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. 写入第一版日志
    console.log('\n👉 [测试 2] 创建新工作日志');
    const testDate = '2026-09-02';
    const logV1 = {
      date: testDate,
      title: '排查慢查询与索引治理 - 版本1',
      hours: 8,
      cooperation: false,
      difficulty: false,
      content: '版本1：梳理了近期慢 SQL 查询日志，正在分析全表扫描原因。',
      job: 'backend',
      tone: 'professional'
    };
    const createRes = await request('POST', '/api/logs', authHeaders, logV1);
    assert(createRes.status === 200 && createRes.body.success, '首个版本日志保存成功');
    assert(Array.isArray(createRes.body.log.history) && createRes.body.log.history.length === 0, '初始创建时 history 为空数组');

    // 3. 修改日志 -> 生成历史版本快照
    console.log('\n👉 [测试 3] 修改日志并触发历史快照留存 (Log Revision History)');
    const logV2 = {
      date: testDate,
      title: '排查慢查询与索引治理 - 版本2 (加了复合索引)',
      hours: 8,
      cooperation: true,
      difficulty: true,
      content: '版本2：针对高频全表扫描补充了联合索引，并在测试环境进行了压测验证。',
      job: 'backend',
      tone: 'professional'
    };
    const updateRes1 = await request('POST', '/api/logs', authHeaders, logV2);
    assert(updateRes1.status === 200 && updateRes1.body.success, '第 2 次修改保存成功');
    assert(updateRes1.body.log.history.length === 1, '历史快照记录数增加到 1');
    assert(updateRes1.body.log.history[0].title === '排查慢查询与索引治理 - 版本1', '历史快照正确捕获了版本 1 的标题');
    assert(updateRes1.body.log.history[0].content.includes('版本1'), '历史快照正确捕获了版本 1 的正文');
    assert(typeof updateRes1.body.log.history[0].versionAt === 'string', '历史快照包含精确版本时间戳 versionAt');

    // 再改一次 -> 历史版本数应为 2
    const logV3 = {
      date: testDate,
      title: '排查慢查询与索引治理 - 版本3 (上线验证完成)',
      hours: 8,
      cooperation: true,
      difficulty: false,
      content: '版本3：慢查询耗时从 380ms 降至 18ms，生产环境回归测试通过。',
      job: 'backend',
      tone: 'professional'
    };
    const updateRes2 = await request('POST', '/api/logs', authHeaders, logV3);
    assert(updateRes2.body.log.history.length === 2, '历史快照记录数累加至 2 条');
    assert(updateRes2.body.log.history[1].title.includes('版本2'), '第 2 条快照记录正确存入版本 2');

    // 4. 软删除 -> 进入回收站
    console.log('\n👉 [测试 4] 软删除日志并移入回收站 (Trash Soft-Delete)');
    const deleteRes = await request('DELETE', `/api/logs/${testDate}`, authHeaders);
    assert(deleteRes.status === 200 && deleteRes.body.success, '删除日志成功 (HTTP 200)');

    const fetchAfterDelete = await request('GET', '/api/data', authHeaders);
    assert(!fetchAfterDelete.body.logs[testDate], '当前 active logs 中已不再包含该日期的日志');
    assert(fetchAfterDelete.body.trash && fetchAfterDelete.body.trash[testDate], '回收站 trash 容器中成功留存了被软删除的日志');
    assert(typeof fetchAfterDelete.body.trash[testDate].deletedAt === 'string', '回收站日志标记了删除时间戳 deletedAt');
    assert(fetchAfterDelete.body.trash[testDate].history.length === 2, '回收站日志完整保留了此前的修改历史快照链');

    // 5. 从回收站恢复日志
    console.log('\n👉 [测试 5] 从回收站恢复日志 (Restore Log)');
    const restoreRes = await request('POST', `/api/logs/${testDate}/restore`, authHeaders);
    assert(restoreRes.status === 200 && restoreRes.body.success, '恢复日志成功 (HTTP 200)');

    const fetchAfterRestore = await request('GET', '/api/data', authHeaders);
    assert(fetchAfterRestore.body.logs[testDate], '日志已成功恢复至 active logs');
    assert(!fetchAfterRestore.body.trash[testDate], '回收站 trash 中已移除已恢复的条目');
    assert(fetchAfterRestore.body.logs[testDate].title.includes('版本3'), '恢复后的日志内容保持最新状态完整无损');

    // 6. 再次删除并清空回收站 (物理清除)
    console.log('\n👉 [测试 6] 彻底物理清空回收站 (Clear Trash)');
    await request('DELETE', `/api/logs/${testDate}`, authHeaders);
    const clearTrashRes = await request('POST', '/api/trash/clear', authHeaders);
    assert(clearTrashRes.status === 200 && clearTrashRes.body.success, '清空回收站接口调用成功');

    const fetchAfterClear = await request('GET', '/api/data', authHeaders);
    assert(Object.keys(fetchAfterClear.body.trash || {}).length === 0, '回收站 trash 容器已彻底清空');

    // 7. 周报持久化存储
    console.log('\n👉 [测试 7] 周报持久化存储与归档 (Weekly Reports)');
    const testWeekKey = '2026-W36';
    const weeklyContent = '### 一、本周重点交付\n1. 完成慢 SQL 调优与索引治理\n2. 增加回收站与历史快照\n\n### 二、下周规划\n1. 继续提升离线同步性能';
    const saveReportRes = await request('POST', `/api/reports/${testWeekKey}`, authHeaders, {
      content: weeklyContent
    });
    assert(saveReportRes.status === 200 && saveReportRes.body.success, '周报保存成功 (HTTP 200)');

    const fetchAfterReport = await request('GET', '/api/data', authHeaders);
    assert(fetchAfterReport.body.reports && fetchAfterReport.body.reports[testWeekKey] === weeklyContent, '周报成功持久化保存并能在数据总览中拉取回看');

    // 8. 方向罗盘推荐切入点
    console.log('\n👉 [测试 8] 智能工作方向启发式推荐 (Directions Engine)');
    const dirResFrontend = await request('POST', '/api/directions', authHeaders, {
      job: 'frontend',
      mode: 'idle'
    });
    assert(dirResFrontend.status === 200 && dirResFrontend.body.success, '前端方向推荐返回成功');
    assert(Array.isArray(dirResFrontend.body.directions) && dirResFrontend.body.directions.length === 5, '稳定返回 5 个高质量切入点');
    assert(dirResFrontend.body.directions[0].title && dirResFrontend.body.directions[0].summary, '切入点包含 title 与 summary');

    const dirResBackendStudy = await request('POST', '/api/directions', authHeaders, {
      job: 'backend',
      mode: 'study'
    });
    assert(dirResBackendStudy.status === 200 && dirResBackendStudy.body.directions.length === 5, '后端学习模式稳定返回 5 个切入点');

    console.log('\n====================================================');
    console.log(`🎉 全部 E2E 功能测试完成：${passedCount}/${totalCount} 项全量通过！`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n💥 E2E 测试过程中发生未捕获异常:', err);
    process.exit(1);
  }
}

// 启动测试 HTTP 服务器并运行用例
server = app.listen(TEST_PORT, () => {
  runE2ETests();
});
