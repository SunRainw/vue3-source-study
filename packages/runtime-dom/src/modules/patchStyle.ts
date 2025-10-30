export function patchStyle(el, prevValue, nextValue) {
  const style = el.style;
  for (let key in nextValue) {
    style[key] = nextValue[key]; // 新样式直接生效
  }
  if (prevValue) {
    for (let key in prevValue) {
      if (nextValue[key] === undefined) {
        // 判断以前的属性有没有，没有就删除
        style[key] = null;
      }
    }
  }
}
