import { App, DirectiveBinding, VNode } from 'vue';
import { ITableColumn } from '@/types/column';

let idCounter = 0;

interface IDraggableElement extends HTMLElement {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __draggable__: DraggableController;
}

class DraggableController {
  id = 0;
  vnode: VNode = null;
  element: HTMLElement = null;
  handleUp: (event: MouseEvent) => void = null;
  handleDown: (event: MouseEvent) => void = null;
  handleMove: (event: MouseEvent) => void = null;
  dragModel: ITableColumn;
  dragX = true;
  dragY = true;

  private _dragEvent: MouseEvent = null;
  private isDragging = false;
  private mouseDownPos: { x: number; y: number };

  constructor(id: number, vNode: VNode, el: HTMLElement, dragModel: ITableColumn, dragX: boolean, dragY: boolean) {
    this.id = id;
    this.vnode = vNode;
    this.element = el;
    this.dragModel = dragModel;
    this.dragX = dragX;
    this.dragY = dragY;
    this.handleUp = this.onMouseUp.bind(this) as (event: MouseEvent) => void;
    this.handleMove = this.onMouseMove.bind(this) as (event: MouseEvent) => void;
  }

  unsubscribe() {
    document.removeEventListener('mousemove', this.handleMove);
    document.removeEventListener('mouseup', this.handleUp);
  }

  set dragEvent(value: MouseEvent) {
    this._dragEvent = value;
    if (value) {
      this.onMouseDown(value);
    }
  }

  get dragEvent() {
    return this._dragEvent;
  }

  onMouseDown(event: MouseEvent) {
    // we only want to drag the inner header text
    const isDragElm = (<HTMLElement>event.target).classList.contains('draggable');

    if (isDragElm && (this.dragX || this.dragY)) {
      event.preventDefault();
      this.isDragging = true;

      this.mouseDownPos = { x: event.clientX, y: event.clientY };

      document.addEventListener('mouseup', this.handleUp);
      document.addEventListener('mousemove', this.handleMove);

      this.emit('onDragStart', {
        event,
        element: this.element,
        model: this.dragModel,
      });
    }
  }

  private onMouseUp(event: MouseEvent) {
    document.removeEventListener('mousemove', this.handleMove);
    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;
    this.element.classList.remove('dragging');

    this.unsubscribe();
    this.emit('onDragEnd', {
      event,
      element: this.element,
      model: this.dragModel,
    });
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.isDragging) {
      return;
    }

    const x = event.clientX - this.mouseDownPos.x;
    const y = event.clientY - this.mouseDownPos.y;

    if (this.dragX) {
      this.element.style.left = `${x}px`;
    }
    if (this.dragY) {
      this.element.style.top = `${y}px`;
    }

    this.element.classList.add('dragging');

    this.emit('onDragging', {
      event,
      element: this.element,
      model: this.dragModel,
    });
  }

  private emit(name: string, data: unknown) {
    const handler = this.vnode.props[name];
    if (handler) {
      handler(data);
    }
  }
}

export const directiveOptions = {
  beforeMount(el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const ctrl = new DraggableController(
      idCounter++,
      vnode,
      el,
      (binding as { value: { dragModel: ITableColumn } }).value.dragModel,
      (binding as { value: { dragX: boolean } }).value.dragX,
      (binding as { value: { dragY: boolean } }).value.dragY
    );
    (el as IDraggableElement).__draggable__ = ctrl;
  },
  updated(el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const ctrl: DraggableController = (el as IDraggableElement).__draggable__;
    if (!ctrl) {
      return;
    }
    ctrl.dragX = (binding as { value: { dragX: boolean } }).value.dragX;
    ctrl.dragEvent = (binding as { value: { dragEvent: MouseEvent } }).value.dragEvent;
  },
  unmounted(el: HTMLElement) {
    if (!el) {
      return;
    }
    const ctrl: DraggableController = (el as IDraggableElement).__draggable__;
    ctrl.unsubscribe();
  },
};

function draggableDirective(app: App) {
  app.directive('dragndrop', directiveOptions);
}

export default draggableDirective;
