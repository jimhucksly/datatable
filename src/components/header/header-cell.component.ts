import { Prop, Vue, Watch } from 'vue-property-decorator';
import { ITableColumn } from '@/types/column';
import { SelectionType } from '@/types/selection';
import { SortType } from '@/types/sort';
import { SortDirection } from '@/types/sort-direction';
import { ISortPropDir } from '@/types/sort-prop-dir';
import { nextSortDir } from '@/utils/sort';

export default class DataTableHeaderCellComponent extends Vue {
  @Prop() sortType: SortType;
  @Prop() isTarget: boolean;
  @Prop() selectionType: SelectionType;
  @Prop() column: ITableColumn;
  @Prop() sorts: Array<ISortPropDir>;
  @Prop() headerHeight: number;
  @Prop() checked: boolean;
  @Prop() dragElementId: string;

  sortFn = this.onSort.bind(this) as () => void;
  sortDir: SortDirection = null;
  sortOrder = '';

  myAllRowsSelected = false;
  onCheckboxChangeDisabled = false;

  cellContext = {
    column: null as ITableColumn,
    sortDir: this.sortDir,
    sortFn: this.sortFn,
  };

  resizeObserver?: ResizeObserver;

  hover = false;

  @Watch('column', { immediate: true }) onColumnChahged() {
    this.cellContext.column = this.column;
  }

  @Watch('column.visible') onColumnVisibleChahged() {
    this.$emit('column-visible-changed', this.column);
  }

  @Watch('column.frozenLeft') onColumnFrozenLeftChahged() {
    this.$emit('column-visible-changed', this.column);
  }

  @Watch('column.frozenRight') onColumnFrozenRightChahged() {
    this.$emit('column-visible-changed', this.column);
  }

  @Watch('column.width', { immediate: true }) onColumnWidthChanged(value: number) {
    if (!this.$el) {
      return;
    }
    if (this.$el.classList.contains('resize-progress')) {
      return;
    }
    this.$el.style.width = `${value}px`;
  }

  @Watch('sorts', { immediate: true, deep: true }) onSortsChanged() {
    const { dir, order } = this.calcSortDir(this.sorts);
    this.sortDir = dir;
    this.sortOrder = order;
    this.cellContext.sortDir = this.sortDir;
  }

  @Watch('checked') onChecked(value: boolean) {
    if (this.isCheckboxable) {
      this.onCheckboxChangeDisabled = true;
      setTimeout(() => {
        this.onCheckboxChangeDisabled = false;
      }, 200);
      this.myAllRowsSelected = value;
    }
  }

  created() {
    this.cellContext.column = this.column;
    this.$emit('header-cell-created', this.$el);
  }

  mounted() {
    this.column.element = this.$el;
    this.$emit('header-cell-mounted', this.$el);
    this.setResizeObserver();
  }

  beforeUpdate() {
    //
  }

  updated() {
    if (this.resizeObserver && this.column.element !== this.$el) {
      this.resizeObserver.unobserve(this.column.element);
    }
    this.column.element = this.$el;
    this.setResizeObserver();
  }

  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.$el);
      this.resizeObserver = null;
    }
    if (this.column) {
      this.column.element = null;
    }
  }

  onMouseEnter() {
    this.hover = true;
  }

  onMouseLeave() {
    this.hover = false;
  }

  onCheckboxChange() {
    if (this.onCheckboxChangeDisabled) {
      setTimeout(() => {
        this.onCheckboxChangeDisabled = false;
      }, 100);
    }
    this.$emit('select', this.myAllRowsSelected);
  }

  get classes(): Array<string | Record<string, boolean>> {
    const cls = ['datatable-header-cell'];
    if (this.column) {
      if (this.column.sortable) {
        cls.push('sortable');
      }
      if (this.column.resizeable) {
        cls.push('resizeable');
      }
      if (this.column.draggable) {
        cls.push('draggable');
      }
      if (this.dragElementId && this.dragElementId === this.column.$$id) {
        cls.push('dragging');
      }
      if (this.dragElementId && this.dragElementId !== this.column.$$id) {
        cls.push('droppable');
      }
      if (this.isTarget) {
        cls.push('drop-target');
      }
      if (typeof this.column.headerClass === 'string') {
        cls.push(this.column.headerClass);
      }
      if (Array.isArray(this.column.headerClass)) {
        cls.push(...this.column.headerClass);
      }
      if (typeof this.column.headerClass === 'function') {
        const res = this.column.headerClass({
          column: this.column,
        });
        cls.push(res);
      }
    }

    if (this.sortDir) {
      cls.push(...['sort-active', `sort-${this.sortDir}`]);
    }

    return cls;
  }

  get name(): string {
    return this.column.name;
  }

  get styles(): Record<string, string> {
    return {
      height: `${this.headerHeight}px`,
      'min-width': `${this.column.minWidth}px`,
      'max-width': `${this.column.maxWidth}px`,
    };
  }

  get isSortAsc(): boolean {
    return this.sortDir === SortDirection.asc;
  }

  get isSortDesc(): boolean {
    return this.sortDir === SortDirection.desc;
  }

  get isMultipleSort(): boolean {
    return this.sortType === SortType.multi;
  }

  get isCheckboxable(): boolean {
    return this.column.checkboxable;
  }

  get isEnumerable(): boolean {
    return this.column.enumerable;
  }

  onContextmenu($event: MouseEvent) {
    this.$emit('columnContextmenu', { event: $event, column: this.column });
  }

  onSort() {
    if (!this.column.sortable) {
      return;
    }

    const newValue = nextSortDir(this.sortType, this.sortDir);
    this.$emit('sort', {
      column: this.column,
      prevValue: this.sortDir,
      newValue,
    });
  }

  private calcSortDir(sorts: Array<ISortPropDir>): { dir: SortDirection; order: string } {
    const result: { dir: SortDirection; order: string } = {
      dir: null,
      order: '',
    };
    if (!sorts || !this.column) {
      return result;
    }
    const index = sorts.filter(s => Boolean(s.prop)).findIndex((s: ISortPropDir) => s.prop === this.column.prop);
    if (index > -1) {
      result.dir = sorts[index].dir;
    }
    if (this.sortType === SortType.multi) {
      result.order = String(index + 1);
    }
    return result;
  }

  private setResizeObserver() {
    if ((window as Window).ResizeObserver) {
      this.resizeObserver = new (window as Window).ResizeObserver(entries => {
        window.requestAnimationFrame(() => {
          if (!Array.isArray(entries) || !entries.length) {
            return null;
          }
          if (!this.column) {
            return;
          }
          if (entries.length && entries[0].contentRect) {
            this.column.realWidth = Math.max(this.$el.clientWidth, entries[0].contentRect.width);
          } else {
            this.column.realWidth = this.$el.clientWidth;
          }
        });
      });
      this.resizeObserver.observe(this.$el);
    } else {
      this.column.realWidth = null;
    }
  }
}
