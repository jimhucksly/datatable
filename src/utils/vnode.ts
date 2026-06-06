import { Comment, Fragment, Text, VNode } from 'vue';

export function isVNodeEmpty(vnode: VNode | VNode[] | undefined | null) {
  return (
    !vnode ||
    asArray(vnode).every(
      vnodeitem =>
        vnodeitem.type === Comment ||
        (vnodeitem.type === Text && !vnodeitem.children?.length) ||
        (vnodeitem.type === Fragment && !vnodeitem.children?.length)
    )
  );
}

function asArray<T>(arg: T | T[] | null) {
  return Array.isArray(arg) ? arg : arg !== null ? [arg] : [];
}
