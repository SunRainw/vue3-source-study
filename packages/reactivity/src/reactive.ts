import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";

const reactiveMap = new WeakMap(); // 用于存放已经被代理过的对象

export function reactive(target) {
  return createReactiveObject(target);
}

export function toReactive(value) {
  return isObject(value) ? reactive(value) : value;
}

function createReactiveObject(target) {
  if (!isObject(target)) {
    return target;
  }
  // 判断该对象是否是代理过的对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 取缓存
  if (reactiveMap.has(target)) {
    return reactiveMap.get(target);
  }
  const proxy = new Proxy(target, mutableHandlers);

  // 缓存
  reactiveMap.set(target, proxy);
  return proxy;
}

export function isReactive(value) {
  return !!value?.[ReactiveFlags.IS_REACTIVE];
}