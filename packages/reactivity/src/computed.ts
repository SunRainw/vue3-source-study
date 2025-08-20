// computed 执行完以后是一个不可变的ref
// computed 里面的依赖没有变化，多次访问这个值，不会重新执行

import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

// 1. 计算属性维护了一个 dirty 属性，默认值是 true，稍后运行过一次后，会将dirty 变成 false，并且稍后依赖的值变化后再次让dirty 变为 true
// 2. 计算属性也是一个 effect，依赖的属性会收集这个计算属性，当前值变化后，会让 computedEffect 里面的dirty 变为 true
// 3. 计算属性具备收集能力，可以收集对应的 effect，依赖的值变化后触发 effect 重新执行

class ComputedRefImpl {
  public dep;
  _value;
  _effect;
  constructor(public getter, public setter) {
    this._effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        // 计算属性依赖变化了，我们需要触发渲染
        triggerRefValue(this);
      }
    );
  }
  get value() {
    if (this._effect.dirty) {
      this._value = this._effect.run();
      trackRefValue(this);
    }

    return this._value;
  }
  set value(newVal) {
    this.setter(newVal);
  }
}

export function computed(getterOrOptions) {
  let getter;
  let setter;
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {};
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
