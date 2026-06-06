import { Inject, Options, Prop, Vue, Watch } from 'vue-property-decorator';
import { directiveOptions as directiveOptionsD } from '@/directives/draggable.directive';
import { directiveOptions as directiveOptionsLP } from '@/directives/long-press.directive';
import { directiveOptions as directiveOptionsR } from '@/directives/resizeable.directive';
import { IColumnsByPinRecord, IColumnsWidth, ITableColumn } from '@/types/column';
import { IEventProvider } from '@/types/events';
import { SelectionType } from '@/types/selection';
import { SortType } from '@/types/sort';
import { SortDirection } from '@/types/sort-direction';
import { ISortEvent, ISortPropDir } from '@/types/sort-prop-dir';
import { translateXY } from '@/utils/translate';
import DataTableHeaderCellComponent from './header-cell.vue';

interface IDragPosition {
  left: number;
  right: number;
  index: number;
  element: HTMLElement;
}

@Options({
  components: {
    'datatable-header-cell': DataTableHeaderCellComponent,
  },
  directives: {
    'long-press': directiveOptionsLP,
    resizeable: directiveOptionsR,
    dragndrop: directiveOptionsD,
  },
})
export default class DataTableHeaderComponent extends Vue {
  @Prop() scrollbarWidth: number;
  @Prop() scrollbarH: boolean;
  @Prop() dealsWithGroup: boolean;
  @Prop() innerWidth: number;
  @Prop() sorts: ISortPropDir[];
  @Prop() sortType: SortType;
  @Prop() selectionType: SelectionType;
  @Prop() reorderable: boolean;
  @Prop() headerHeight: string | number;
  @Prop({ type: Array, default: (): Array<ITableColumn> => [] }) columns: Array<ITableColumn>;
  @Prop() columnGroupWidths: IColumnsWidth;
  @Prop({ default: (): IColumnsByPinRecord[] => [] }) columnsByPin: IColumnsByPinRecord[];

  myHeaderHeight = 'auto';
  myHeaderWidth = 0;
  styleByGroup = {
    left: {},
    center: {},
    right: {},
  };
  dragEvent: MouseEvent = null;
  dragging = false;
  positions: Record<string, IDragPosition> = {};
  offsetX = 0;

  checkedAll = false;

  // non-reactive props
  lastDraggingIndex: number;
  draggables: Array<{ dragModel: ITableColumn; element: HTMLElement }>;
  dragElement: ITableColumn = null;

  @Inject({ from: 'eventProvider', default: null }) eventProvider: IEventProvider;

  @Watch('innerWidth', { immediate: true }) onChangedInnerWidth() {
    if (Array.isArray(this.columns)) {
      this.setStylesByGroup();
    }
  }

  @Watch('headerHeight', { immediate: true }) onHeaderHeightChanged() {
    if (this.headerHeight === 'auto') {
      this.myHeaderHeight = this.headerHeight;
    } else {
      this.myHeaderHeight = this.headerHeight ? `${this.headerHeight}px` : 'auto';
    }
  }

  @Watch('columns', { immediate: true }) onColumnsChanged() {
    this.setStylesByGroup();
  }

  @Watch('offsetX') onOffsetXChanged() {
    // this.setStylesByGroup();
  }

  @Watch('columnGroupWidths') onColumnGroupWidthsChanged() {
    this.setStylesByGroup();
  }

  @Watch('dragging') onDraggingCells(value: boolean) {
    if (!value) {
      this.dragElement = null;
    }
  }

  created() {
    if (this.eventProvider) {
      this.eventProvider.on('offsetX', (data: unknown) => {
        this.offsetX = data as number;
        this.setStylesByGroup();
      });
    }
  }

  onCheckedAll(flag: boolean) {
    this.checkedAll = flag;
  }

  onLongPressStart({ event, model }: { event: MouseEvent; model: { dragging: boolean } }) {
    model.dragging = true;
    this.dragEvent = event;
  }

  onLongPressEnd({ event, model }: { event: MouseEvent; model: ITableColumn }) {
    this.dragEvent = event;

    // delay resetting so sort can be
    // prevented if we were dragging
    setTimeout(() => {
      // datatable component creates copies from columns on reorder
      // set dragging to false on new objects
      const column = this.columns.find(c => c.$$id === model.$$id);
      if (column) {
        column.dragging = false;
      }
    }, 5);
  }

  get headerWidth(): string {
    if (this.scrollbarH) {
      return `${this.innerWidth}px`;
    }
    return '100%';
  }

  isEnableDragX(column: ITableColumn): boolean {
    return this.reorderable && column.draggable && column.dragging;
  }

  onColumnResized(width: number, column: ITableColumn) {
    if (width <= column.minWidth) {
      width = column.minWidth;
    } else if (width >= column.maxWidth) {
      width = column.maxWidth;
    }

    this.$emit('resize', {
      column,
      prevValue: column.width,
      newValue: width,
    });
  }

  onColumnVisibleChanged(column: ITableColumn) {
    this.$emit('column-visible-changed', column);
  }

  getColumn(index: number): ITableColumn {
    const leftColumnCount = this.columnsByPin[0].columns.length;
    if (index < leftColumnCount) {
      return this.columnsByPin[0].columns[index];
    }

    const centerColumnCount = this.columnsByPin[1].columns.length;
    if (index < leftColumnCount + centerColumnCount) {
      return this.columnsByPin[1].columns[index - leftColumnCount];
    }

    return this.columnsByPin[2].columns[index - leftColumnCount - centerColumnCount];
  }

  onSort({ column, prevValue, newValue }: { column: ITableColumn; prevValue: SortDirection; newValue: SortDirection }) {
    if (column.dragging) {
      return;
    }

    const sorts = this.calcNewSorts(column, prevValue, newValue);
    const event: ISortEvent = {
      sorts,
      column,
      prevValue,
      newValue,
    };
    this.$emit('sort', event);
  }

  onSelect(event: boolean) {
    this.$emit('select', event);
  }

  calcNewSorts(column: ITableColumn, prevValue: SortDirection, newValue: SortDirection): ISortPropDir[] {
    let idx = 0;

    const sorts = (this.sorts ?? []).map((s, i) => {
      s = { ...s };
      if (s.prop === column.prop) {
        idx = i;
      }
      return s;
    });

    if (!newValue) {
      sorts.splice(idx, 1);
    } else if (prevValue) {
      sorts[idx].dir = newValue;
    } else {
      if (this.sortType === SortType.single) {
        sorts.splice(0, sorts.length);
      }

      sorts.push({ dir: newValue, prop: column.prop });
    }

    return sorts;
  }

  setStylesByGroup() {
    if (!this.columnsByPin || !this.columnsByPin.length) {
      return;
    }
    this.styleByGroup = this.calcStylesByGroup();
  }

  calcStylesByGroup(): Record<'left' | 'center' | 'right', Record<string, string>> {
    if (!this.columnGroupWidths) {
      return null;
    }

    const result: Record<string, Record<string, string>> = {};

    if (this.columnsByPin[0].columns.length) {
      result.left = {};
    }
    if (this.columnsByPin[1].columns.length) {
      result.center = {};
    }
    if (this.columnsByPin[2].columns.length) {
      result.right = {};
    }

    for (const key of ['left', 'center', 'right']) {
      if (!result[key]) {
        continue;
      }
      const styles = {
        // width: `${this.columnGroupWidths[key as keyof IColumnsWidth]}px`,
      };
      switch (key) {
        case 'center':
          translateXY(styles, this.offsetX * -1, 0);
          break;
        case 'right':
          let totalDiff = 0;
          if (this.columnGroupWidths.total > this.innerWidth) {
            totalDiff = this.columnGroupWidths.total - this.innerWidth;
          }
          let offset = totalDiff * -1;
          if (this.scrollbarWidth) {
            offset -= this.scrollbarWidth;
          }
          translateXY(styles, offset, 0);
          break;
      }
      result[key] = styles;
    }

    return result;
  }

  onHeaderCellMounted(column: ITableColumn, element: HTMLElement) {
    if (!this.draggables) {
      this.draggables = [];
    }
    this.draggables.push({ dragModel: column, element });
  }

  onDragStart(event: { model: ITableColumn }) {
    if (this.dragging) {
      return;
    }
    this.dragging = true;

    this.dragElement = event.model;

    this.positions = {};

    let i = 0;
    this.draggables.sort((a, b) => {
      const left = parseInt(a.element.offsetLeft.toString(), 10);
      const left1 = parseInt(b.element.offsetLeft.toString(), 10);
      return left - left1;
    });
    for (const dragger of this.draggables) {
      const elm = dragger.element;
      const left = parseInt(elm.offsetLeft.toString(), 10);
      const width = elm.offsetWidth;
      if (width) {
        this.positions[dragger.dragModel.prop] = {
          left,
          right: left + parseInt(width.toString(), 10),
          index: i++,
          element: elm,
        };
      }
    }
  }

  onDragging({ element, model, event }: { element: HTMLElement; model: ITableColumn; event: MouseEvent }) {
    const prevPos = this.positions[model.prop];
    const target = this.isTarget(model, event);

    if (target) {
      if (this.lastDraggingIndex !== target.i) {
        this.onTargetChanged({
          prevIndex: this.lastDraggingIndex,
          newIndex: target.i,
          initialIndex: prevPos.index,
        });
        this.lastDraggingIndex = target.i;
      }
    } else if (this.lastDraggingIndex !== prevPos.index) {
      this.onTargetChanged({
        prevIndex: this.lastDraggingIndex,
        initialIndex: prevPos.index,
      });
      this.lastDraggingIndex = prevPos.index;
    }
  }

  onDragEnd({ element, model, event }: { element: HTMLElement; model: ITableColumn; event: MouseEvent }) {
    this.dragging = false;
    const prevPos = this.columns.findIndex(col => col.prop === model.prop);

    const target = this.isTarget(model, event);
    this.positions = {};
    if (target) {
      this.onColumnReordered({
        prevIndex: prevPos,
        newIndex: this.columns.findIndex(col => col.prop === target.prop),
        model,
      });
    }
    // eslint-disable-next-line no-undefined
    this.lastDraggingIndex = undefined;
    element.style.left = 'auto';
  }

  onColumnReordered({ prevIndex, newIndex, model }: { prevIndex: number; newIndex: number; model: ITableColumn }) {
    const column = this.getColumn(newIndex);
    column.isTarget = false;
    this.$emit('reorder', {
      column: model,
      prevValue: prevIndex,
      newValue: newIndex,
    });
  }

  onTargetChanged({
    prevIndex,
    newIndex,
    initialIndex,
  }: {
    prevIndex: number;
    newIndex?: number;
    initialIndex: number;
  }) {
    if (prevIndex || prevIndex === 0) {
      const oldColumn = this.getColumn(prevIndex);
      oldColumn.isTarget = false;
    }
    if (newIndex || newIndex === 0) {
      const newColumn = this.getColumn(newIndex);
      newColumn.isTarget = true;
    }
  }

  isTarget(
    model: ITableColumn,
    event: MouseEvent
  ): {
    prop: string;
    pos: IDragPosition;
    i: number;
  } {
    let i = 0;
    const x = event.x || event.clientX;
    const y = event.y || event.clientY;
    const targets = document.elementsFromPoint(x, y);

    for (const prop in this.positions) {
      // current column position which throws event.
      const pos = this.positions[prop];
      // since we drag the inner span, we need to find it in the elements at the cursor
      if (model.prop !== prop && targets.find((el: HTMLElement) => el === pos.element)) {
        return {
          prop,
          pos,
          i,
        };
      }

      i++;
    }
  }

  get styleObject(): Record<string, string | number> {
    return {
      width: this.headerWidth ? this.headerWidth : `${this.columnGroupWidths.total}px`,
      height: this.myHeaderHeight,
    };
  }
}
