import { isString, ShapeFlags } from "@vue/shared";

export function isVnode(value) {
  return !!value?.__v_isVNode;
}

export function createVNode(type, props?, children?) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props?.key, // diff算法需要的key
    el: null, // 虚拟节点，对应的真实节点
    shapeFlag: getShapeFlag(type),
  };
  if (children) {
    if (Array.isArray(children)) {
      vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    }
  }
  return vnode;
}

function getShapeFlag(type) {
  return isString(type) ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}
