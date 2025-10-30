import { ShapeFlags } from "@vue/shared";

export function createRenderer(renderOptions) {
  // core重不关心如何渲染
  // 解构renderOptions，重命名是为了避免冲突
  const {
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    createText: hostCreateText,
    patchProp: hostPatchProp,
    setText: hostSetText,
  } = renderOptions;

  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      patch(null, children[i], el);
    }
  };

  const mountElement = (vnode, container) => {
    const { props, children, type, shapeFlag } = vnode;
    // 第一次渲染的时候，让虚拟节点和真实的dom，创建关联， vnode.el = 真实dom
    // 第二次vnode，可以和上一次的vnode做比对，之后更新对应的el元素
    const el = hostCreateElement(type);
    vnode.el = el;

    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 与运算时 如果大于0，说明包含这个值
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };

  // 渲染和更新
  const patch = (n1, n2, container) => {
    if (n1 === n2) return; // 渲染同一个元素直接跳过
    if (n1 === null) {
      // n1 是 null, 进行初始化
      mountElement(n2, container);
    }
  };

  const umount = (vnode) => {
    hostRemove(vnode.el);
  };

  // 多次调用 render，会根据存储虚拟节点进行比较，再进行更新
  const render = (vnode, container) => {
    if (vnode === null) {
      // 移除当前容器中的dom元素
      if (container._vnode) {
        umount(container._vnode);
      }
    }
    // 将虚拟节点变成真实节点进行渲染
    patch(container._value || null, vnode, container);

    // 将vnode 存起来
    container._vnode = vnode;
    console.info(vnode);
  };
  return {
    render,
  };
}
