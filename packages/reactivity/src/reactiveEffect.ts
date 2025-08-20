import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 用于存储每个对象的每个属性依赖的 effect
const targetMap = new WeakMap();

export function createDep(cleanup, key) {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.key = key;
  return dep;
}

export function track(target, key) {
  // 有 activeEffect 说明是在 effect 中访问，否则说明在 effect 外访问
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
      // 给每个dep 传入 cleanup，方便在后续 effect 重新执行时，清除不一样的 dep
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)));
    }
    trackEffect(activeEffect, dep);
  }
}

export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
