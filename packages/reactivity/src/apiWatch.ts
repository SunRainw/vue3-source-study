import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";
import { isRef } from "./ref";

export function watch(source, cb, options = {} as any) {
  return doWatch(source, cb, options);
}

const traverse = (source, depth, currentDepth = 0, seen = new Set()) => {
  if (!isObject(source)) return source;
  if (depth) {
    if (currentDepth >= depth) return source;
    currentDepth++;
  }
  if (!seen.has(source)) {
    seen.add(source);
    for (const key in source) {
      traverse(source[key], depth, currentDepth, seen);
    }
  }
  return source;
};

function doWatch(source, cb, { deep, immediate }) {
  // 将 source 转换为 getter
  const reactiveGetter = (source) => traverse(source, !deep ? 1 : deep);

  // 产生一个可以给 ReactiveEffect 来使用的getter，需要对这个对象进行取值操作，会关联当前的 reactiveEffect
  let getter;
  if (isReactive(source)) {
    getter = () => reactiveGetter(source);
  } else if (isRef(source)) {
    getter = () => source.value;
  } else if (isFunction(source)) {
    getter = source;
  }

  let oldValue;
  let clean;
  const onCleanup = (fn) => {
    // 实际是利用闭包，将fn保存起来，下一次执行时，之前的内容变化，从而实现阻止上一次的操作
    clean = () => {
      fn();
      clean = undefined;
    };
  };
  const job = () => {
    if (cb) {
      const newValue = effect.run();
      if (clean) {
        // 将上一次的结果清理掉，再做新的监听
        clean();
      }
      cb(newValue, oldValue, onCleanup);
      oldValue = newValue;
    } else {
      // watchEffect
      effect.run();
    }
  };
  const effect = new ReactiveEffect(getter, job);
  if (cb) {
    if (immediate) {
      // 先执行一次用户的回调，传递新值和老值
      job();
    } else {
      oldValue = effect.run();
    }
  } else {
    effect.run();
  }
  // 停止监听
  const unwatch = () => effect.stop();
  return unwatch;
}

export function watchEffect(getter, options = {} as any) {
  return doWatch(getter, null, options);
}
