export enum ShapeFlags { // 对元素形状的判断
  ELEMENT = 1, // 1， 元素
  FUNCTIONAL_COMPONENT = 1 << 1, // 2， 函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 4， 状态组件
  TEXT_CHILDREN = 1 << 3, // 8， 文本子节点
  ARRAY_CHILDREN = 1 << 4,
  SLOTS_CHILDREN = 1 << 5,
  TELEPORT = 1 << 6,
  SUSPENSE = 1 << 7,
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  COMPONENT_KEPT_ALIVE = 1 << 9,
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}

// 使用时会使用值来做或运算，生成新的值，然后进行判断
// 例如 1 | 8 = 9, 说明是一个文本元素