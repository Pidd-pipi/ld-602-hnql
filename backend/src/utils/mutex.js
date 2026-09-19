/**
 * 进程内互斥锁（Promise 链）。
 * 所有会改变库存的操作（入库/申领/放行）都在锁内串行执行，
 * 保证并发申领同一批次时“检查 + 扣减”是原子的：只能成功一单，
 * 失败方在锁内重新校验时必然看到最新库存，不会改变库存。
 */
export function createMutex() {
  let tail = Promise.resolve();
  return {
    runExclusive(fn) {
      const result = tail.then(fn);
      // 失败也继续后续排队任务
      tail = result.catch(() => {});
      return result;
    },
  };
}
