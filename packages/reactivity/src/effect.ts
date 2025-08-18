export function effect(fn) {
  // 创建一个响应式 effect 数据变化后可以重新执行
  // 创建一个 effect，只要依赖的属性变化了就要执行回调
  const _effect = new ReactiveEffect(fn, () => {
    // 调度器
    _effect.run();
  });
  _effect.run();
  return _effect;
}

export let activeEffect = null;

class ReactiveEffect {
  public active = true; // 创建的 effect 是响应式的，也就是是否做依赖收集
  deps = []; // 当前 effect 有哪些dep
  _trackId = 0; // 用于记录当前 effect 执行了几次
  _depsLength = 0; // deps的长度
  // fn 用户编写的函数
  // 如果fn中依赖的数据发生变化后，需要重新调用 run()
  constructor(public fn, public scheduler) {}
  run() {
    if (!this.active) {
      return this.fn();
    }
    // 这里需要保存上一次的 effect， 由于lastEffect 是在执行栈中，在每个run函数中都会被保存，直到fn执行完毕
    let lastEffect = activeEffect;
    try {
      activeEffect = this;
      return this.fn();
    } finally {
      // fn执行完毕后，将activeEffect 还原为上一次的 effect
      activeEffect = lastEffect;
    }
  }
}

export function trackEffect(effect, dep) {
  // 在收集器中，收集effect
  dep.set(effect, effect._trackId);
  // 将effect 和 dep 关联，暂时无用
  effect.deps[effect._depsLength++] = dep;
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    }
  }
}
