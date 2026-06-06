import { App, DirectiveBinding, VNode } from 'vue';

// eslint-disable-next-line @typescript-eslint/naming-convention
let _id = 0;

class ResizeableDirectiveController {
  resizeEnabled = true;
  minWidth = 0;
  maxWidth = 0;
  resizing = false;
  element: HTMLElement = null;
  initialWidth: number = null;
  mouseDownScreenX: number = null;
  handleUp: (event: MouseEvent) => void = null;
  handleDown: (event: MouseEvent) => void = null;
  handleMove: (event: MouseEvent) => void = null;
  vnode: VNode = null;
  id = 0;

  constructor(id: number, vNode: VNode, el: HTMLElement) {
    this.id = id;
    this.vnode = vNode;
    this.element = el;
    this.initialWidth = null;
    this.mouseDownScreenX = null;
    this.handleDown = this.onMouseDown.bind(this) as (event: MouseEvent) => void;
    this.handleUp = this.onMouseUp.bind(this) as (event: MouseEvent) => void;
  }

  private onMouseUp() {
    document.removeEventListener('mousemove', this.handleMove);
    this.element.classList.remove('resize-progress');
    if (this.resizing) {
      this.resizing = false;
      this.emit('onResize', this.element.clientWidth);
    }
  }

  private onMouseDown(event: MouseEvent) {
    const isHandle = (<HTMLElement>event.target).classList.contains('resize-handle');
    this.initialWidth = this.element.clientWidth;
    this.mouseDownScreenX = event.screenX;

    if (isHandle) {
      event.stopPropagation();
      this.resizing = true;
      this.element.classList.add('resize-progress');
      this.handleMove = this.move.bind(this);
      document.addEventListener('mousemove', this.handleMove);
    }
  }

  private move(event: MouseEvent) {
    if (!this.resizing) {
      return;
    }
    const movementX = event.screenX - this.mouseDownScreenX;
    const newWidth = this.initialWidth + movementX;

    const overMinWidth = !this.minWidth || newWidth >= this.minWidth;
    const underMaxWidth = !this.maxWidth || newWidth <= this.maxWidth;

    if (overMinWidth && underMaxWidth) {
      this.element.style.width = `${newWidth}px`;
    }
  }

  private emit(name: string, data: unknown) {
    const handler = this.vnode.props[name];
    if (handler) {
      handler(data);
    }
  }
}

interface IDirValue {
  resizeEnabled: boolean;
  initialWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export interface IHasResizeableDirectiveController extends HTMLElement {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __resizeable__: ResizeableDirectiveController;
}

export const directiveOptions = {
  resizing: false,
  beforeMount(el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const ctrl = new ResizeableDirectiveController(_id++, vnode, el);
    const value = binding.value as IDirValue;
    if (value) {
      // eslint-disable-next-line no-undefined
      if (value.resizeEnabled !== undefined && value.resizeEnabled !== null) {
        ctrl.resizeEnabled = value.resizeEnabled;
      }
      ctrl.minWidth = value.minWidth;
      ctrl.maxWidth = value.maxWidth;
      el.style.width = `${value.initialWidth}px`;
    }
    (el as IHasResizeableDirectiveController).__resizeable__ = ctrl;
    document.addEventListener('mouseup', ctrl.handleUp);
    el.addEventListener('mousedown', ctrl.handleDown);
  },
  unmounted(el: HTMLElement) {
    if (!el) {
      return;
    }
    const ctrl = (el as IHasResizeableDirectiveController).__resizeable__;
    document.removeEventListener('mouseup', ctrl.handleUp);
    el.removeEventListener('mousedown', ctrl.handleDown);
  },
  mounted(el: HTMLElement) {
    const node = document.createElement('span');
    const ctrl = (el as IHasResizeableDirectiveController).__resizeable__;
    if (ctrl && ctrl.resizeEnabled) {
      node.classList.add('resize-handle');
    }
    // else {
    //   node.classList.add('resize-handle--not-resizable');
    // }
    el.appendChild(node);
  },
};

function resizeableDirective(app: App) {
  app.directive('resizeable', directiveOptions);
}

export default resizeableDirective;
