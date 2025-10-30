import { nodeOps } from "./nodeOps";
import patchProp from "./patchProp";
// import
import { createRenderer } from "@vue/runtime-core";

const renderOptions = Object.assign(nodeOps, { patchProp });

// render方法采用domapi 进行渲染
export const render = (vnode, container) => {
  return createRenderer(renderOptions).render(vnode, container);
};

export { renderOptions };
export * from "@vue/runtime-core";
