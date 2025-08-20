import { DirtyLevels } from "./constants";

export function effect(fn, options?) {
  // 创建一个响应式 effect 数据变化后可以重新执行
  // 创建一个 effect，只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // 调度器
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export let activeEffect = null;

// 清理 effect
function preCleanEffect(effect) {
  effect._depsLength = 0;
  effect._trackId++; // 每次执行id 都是+1，如果当前同一个effect执行，id就是相同的
}

function postCleanEffect(effect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanDepEffect(effect.deps[i], effect); // 删除映射表中多余的 effect
    }
    effect.deps.length = effect._depsLength; // 更新依赖列表长度
  }
}

export class ReactiveEffect {
  public active = true; // 创建的 effect 是响应式的，也就是是否做依赖收集
  deps = []; // 当前 effect 有哪些dep
  _trackId = 0; // 用于记录当前 effect 执行了几次
  _depsLength = 0; // deps的长度
  _running = 0; // 当前 effect 是否正在执行
  _dirtyLevel = DirtyLevels.Dirty;
  // fn 用户编写的函数
  // 如果fn中依赖的数据发生变化后，需要重新调用 run()
  constructor(public fn, public scheduler) {}

  get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  set dirty(value) {
    this._dirtyLevel = value ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    // 这里需要保存上一次的 effect， 由于lastEffect 是在执行栈中，在每个run函数中都会被保存，直到fn执行完毕
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      // 每次收集前，需要将之前的 effect 中的收集清理掉，避免变化后收集到无用的 state
      preCleanEffect(this);
      this._running++;
      this._dirtyLevel = DirtyLevels.NoDirty;
      return this.fn();
    } finally {
      this._running--;
      // 当前effect 执行完毕以后，需要删除多余的 effect
      postCleanEffect(this);
      // fn执行完毕后，将activeEffect 还原为上一次的 effect
      activeEffect = lastEffect;
    }
  }
}

function cleanDepEffect(dep, effect) {
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup(); // 如果 map 空了，就把它移除了
  }
}

// 1. _trackId 记录当前 effect 执行的次数，如果是同一个effect，_trackId 是相同的
//    对于每个 key 来说，就只会记录一次 这个 effect，不会重复记录
// 2. 拿到上一次的相同位置的 dep，和当前的 dep 进行比较，如果相同就直接复用
//    如果不同就要把旧的删了，加入新的

export function trackEffect(effect, dep) {
  // 判断当前的effect中是否已经收集了该属性
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId); // 更新id
    const oldDep = effect.deps[effect._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        // 清除旧的 dep
        cleanDepEffect(oldDep, effect);
      }
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }
  }
}

export function triggerEffects(dep) {
  for (const effect of dep.keys()) {
    // 触发set后，将dirty 变为 true
    if (!effect.dirty) {
      effect.dirty = true;
    }
    // 如果 _running 为 0，说明当前 effect 没有在执行，可以执行 scheduler
    if (effect.scheduler && !effect._running) {
      effect.scheduler();
    }
  }
}
