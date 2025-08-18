import { activeEffect, trackEffect, triggerEffects } from "./effect";

// 用于存储每个对象的每个属性依赖的 effect
const targetMap = new WeakMap();

function createDep(cleanup) {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
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
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key))));
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
