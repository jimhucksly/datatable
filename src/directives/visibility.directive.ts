import { App, DirectiveBinding, VNode } from 'vue';

class VisibilityController {
  _isVisible = false;
  timeout: number;
  vnode: VNode = null;
  element: HTMLElement = null;

  constructor(vNode: VNode, el: HTMLElement) {
    this.vnode = vNode;
    this.element = el;
  }

  set isVisible(value: boolean) {
    this._isVisible = value;
    if (value) {
      this.element.classList.add('visible');
    } else {
      this.element.classList.remove('visible');
    }
  }

  get isVisible(): boolean {
    return this._isVisible;
  }

  stopCheck() {
    clearTimeout(this.timeout);
  }

  onVisibilityChange(visible: boolean) {
    if (this.isVisible !== visible) {
      this.isVisible = visible;
      this.emit('onVisible', visible);
    }
  }

  runCheck(timeout: number) {
    const check = () => {
      clearTimeout(this.timeout);
      const { offsetHeight, offsetWidth } = this.element;

      if (offsetHeight && offsetWidth) {
        this.onVisibilityChange(true);
      } else {
        this.onVisibilityChange(false);
      }
      this.timeout = setTimeout(() => check(), timeout) as unknown as number;
    };
    this.timeout = setTimeout(() => check()) as unknown as number;
  }

  private emit(name: string, data: unknown) {
    const handler = this.vnode.props[name];
    if (handler) {
      handler(data);
    }
  }
}

export const directiveOptions = {
  resizing: false,
  beforeMount(el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const ctrl = new VisibilityController(vnode, el);
    /* eslint-disable-next-line @typescript-eslint/naming-convention */
    (el as unknown as { __visibility__: VisibilityController }).__visibility__ = ctrl;
    const b = binding as { value: { on: boolean; timeout: number } };
    if (b?.value?.on) {
      ctrl.runCheck(b?.value?.timeout ?? 1000);
    }
  },
  unmounted(el: HTMLElement) {
    if (!el) {
      return;
    }
    /* eslint-disable-next-line @typescript-eslint/naming-convention */
    const ctrl = (el as unknown as { __visibility__: VisibilityController }).__visibility__;
    ctrl.stopCheck();
  },
};

function visibilityObserverDirective(app: App) {
  app.directive('visibility-observer', directiveOptions);
}

export default visibilityObserverDirective;
