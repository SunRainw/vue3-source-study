import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { createDep } from "./reactiveEffect";
import { toReactive } from "./reactive";

export function ref(value) {
  return createRef(value);
}

function createRef(value) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true; // 增加 ref 标识
  public dep; // 用于收集 ref 的依赖
  public _value; // 存储值
  constructor(public rawValue) {
    this._value = toReactive(rawValue);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    if (newVal !== this.rawValue) {
      this.rawValue = newVal;
      this._value = toReactive(newVal);
      triggerRefValue(this);
    }
  }
}

export function trackRefValue(ref) {
  if (activeEffect) {
    if (!ref.dep) ref.dep = createDep(() => (ref.dep = undefined), "undefined");
    trackEffect(activeEffect, ref.dep);
  }
}

export function triggerRefValue(ref) {
  const dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}

class ObjectRefImpl {
  constructor(public _object, public key) {}
  get value() {
    return this._object[this.key];
  }
  set value(newVal) {
    this._object[this.key] = newVal;
  }
}

// toRef
export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

// toRefs
export function toRefs(target) {
  const res = {};
  for (const key in target) {
    res[key] = toRef(target, key);
  }
  return res;
}

// proxyRefs 一般在模板中使用，自动脱 ref
export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r.__v_isRef ? r.value : r; // 自动脱ref
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];

      if (oldValue.__v_isRef) {
        // 如果是 ref，则设置 ref 的 value
        oldValue.value = value;
        return true;
      } else {
        // 如果不是 ref
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}

export function isRef(value) {
  return !!value?.__v_isRef;
}