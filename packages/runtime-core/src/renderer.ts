import { ShapeFlags } from "@vue/shared";
import { isSameVNode } from "./createVNode";

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
      patch(null, children[i], el, null);
    }
  };

  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor);
  };

  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      // 初始化 n2
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2, container);
    }
  };

  const patchProps = (oldProps, newProps, el) => {
    // 新的全部生效
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 旧的有的，新的没有，要移除
    for (const key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  };
  const unmount = (vnode) => hostRemove(vnode.el);
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };
  const patchKeyedChildren = (c1, c2, el) => {
    // 比较两个儿子的差异，来更新dom元素
    // 1. 减少比对范围，先从头开始比，再从尾开始比，确定不一样的范围
    // 2. 从头比对再从尾比对，如果有多余的就删除，有新增的，就挂载

    // [a, b, c]
    // [a, b, d, e]
    let i = 0; // 开始比对的索引
    let e1 = c1.length - 1; // 老的结束索引
    let e2 = c2.length - 1; // 新的结束索引
    // 1. 从头开始比对
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el); // 递归比较子节点，更新当前节点的属性
      } else {
        break;
      }
      i++;
    }
    // 2. 从尾开始比对
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // 处理增加和删除的特殊情况 [a, b, c] => [a, b] |  [d, a, b, c] => [a, b, c]
    if (i > e1 && i <= e2) {
      // 新的比老的多
      // 通过 e2+1 判断是否有下一个元素
      const nextPos = e2 + 1;
      let anchor = c2?.[nextPos]?.el;
      while (i <= e2) {
        patch(null, c2[i++], el, anchor);
      }
    } else if (i <= e1 && i > e2) {
      // 老的比新的多
      while (i <= e1) {
        unmount(c1[i++]);
      }
    } else {
      // 以上确认不变化的节点，并且对插入和移除做了特殊处理
      // 3. 对比中间的内容
      let s1 = i;
      let s2 = i;

      // 做一个映射表，用于快速查找老的是否在新的中有无，没有就删除，有就更新
      const keyToNewIndexMap = new Map();
      for (let i = s2; i <= e2; i++) {
        const vnode = c2[i];
        keyToNewIndexMap.set(vnode.key, i);
      }

      for (let i = s1; i <= e1; i++) {
        const oldVNode = c1[i];
        const newIndex = keyToNewIndexMap.get(oldVNode.key);
        if (newIndex === undefined) {
          unmount(oldVNode);
        } else {
          // 比较前后节点的差异，更新属性和子节点
          patch(oldVNode, c2[newIndex], el);
        }
      }
      // 调整顺序，以新的为准
      // 按照新的队列，倒序插入 insertBefore
      for (let i = e2; i >= s2; i--) {
        const anchor = c2[i + 1]?.el; // 对应元素的索引，找他下一个元素为参照物，进行插入
        let vnode = c2[i];
        if (!vnode.el) {
          // 新列表中新增的元素
          patch(null, vnode, el, anchor); // 创建 h 插入
        } else {
          hostInsert(vnode.el, el, anchor); // 直接倒序插入
        }
      }
    }
  };
  const patchChildren = (n1, n2, el) => {
    const { children: c1, shapeFlag: prevShapeFlag } = n1;
    const { children: c2, shapeFlag: nextShapeFlag } = n2;
    // 1. 新的是文本，老的是数组，移除老的
    // 2. 新的是文本，老的也是文本，内容不相同，替换
    // 3. 老的是数组，新的是数组，全量diff
    // 4. 老的是数组，新的不是数组，移除老的子节点
    // 5. 老的是文本，新的是空
    // 6. 老的是文本，新的是数组

    // 新的是文本
    if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1); // 移除老的
      }
      // 老的是文本，内容不相同，替换
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的也是数组 全量diff
          patchKeyedChildren(c1, c2, el);
        } else {
          // 新的不是数组，移除老的子节点
          unmountChildren(c1);
        }
      } else {
        // 老的不是数组
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 老的是文本，新的是空
          hostSetElementText(el, "");
        }
        // 新的是数组，挂载新的子节点
        if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1, n2, container) => {
    // 1. 比较元素的差异，复用dom元素
    let el = (n2.el = n1.el);
    // 2. 比较属性和元素的子节点
    const { props: n1Props = {}, children: n1Children } = n1;
    const { props: n2Props = {}, children: n2Children } = n2;
    // 比较属性
    patchProps(n1Props, n2Props, el);
    // 比较子节点
    patchChildren(n1, n2, el);
  };

  // 渲染和更新
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return; // 渲染同一个元素直接跳过
    // 如果不是是相同
    if (n1 && !isSameVNode(n1, n2)) {
      unmount(n1);
      n1 = null; // 将 n1 置为null，就会执行后面 n2 的初始化
    }
    processElement(n1, n2, container, anchor); // 对元素处理
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
