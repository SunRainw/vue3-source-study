export function isObject(val: any) {
  return typeof val === "object" && val !== null;
}

export function isFunction(val: any) {
  return typeof val === "function";
}

export function isString(val: any) {
  return typeof val === "string";
}
