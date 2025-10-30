export const nodeOps = {
  insert: (child, parent, anchor) => {
    // 将child插入到parent中，anchor为插入的位置
    parent.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent = child.parentNode;
    parent && parent.removeChild(child);
  },
  createElement: (tag) => document.createElement(tag),
  createText: (text) => document.createTextNode(text),
  setText: (node, text) => (node.nodeValue = text),
  setElementText: (node, text) => (node.textContent = text),
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
};
