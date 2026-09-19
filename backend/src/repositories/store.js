import fs from 'node:fs';
import path from 'node:path';
import { buildSeedState, emptyState } from './seed.js';

/**
 * JSON 文件仓储：进程内持有全量状态，每次写操作后同步落盘（tmp + rename 原子替换）。
 * 页面刷新 / 服务重启后从同一文件恢复，保证“刷新后一致”。
 */
export function createStore({ file, seedState } = {}) {
  let state;
  if (file && fs.existsSync(file)) {
    state = JSON.parse(fs.readFileSync(file, 'utf8'));
  } else {
    state = seedState || buildSeedState();
    if (file) persist();
  }

  function persist() {
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, file);
  }

  function nextId(name) {
    state.seq[name] = (state.seq[name] || 0) + 1;
    return state.seq[name];
  }

  return {
    get state() {
      return state;
    },
    persist,
    nextId,
    emptyState,
  };
}
