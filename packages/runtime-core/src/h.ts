import { isObject } from "@vue/shared";
import { createVNode, isVnode } from "./index";

export function h(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject(propsOrChildren) && !Array.isArray(propsOrChildren)) {
      // 属性或者虚拟节点
      if (isVnode(propsOrChildren)) {
        // propsOrChildren 如果是虚拟节点
        return createVNode(type, null, [propsOrChildren]);
      }
      // 属性
      return createVNode(type, propsOrChildren);
    }
    // 数组就是虚拟节点数组,或者文本
    return createVNode(type, null, propsOrChildren);
  } else {
    if (l > 3) {
      // l > 3 就是有多个参数得虚拟节点或者数组
      children = Array.from(arguments).slice(2);
    }
    if (l === 3 && isVnode(children)) {
      // 如果是等于3，且是一个虚拟节点，就包装成数组
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
