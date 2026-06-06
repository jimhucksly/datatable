import { Prop, Vue, Watch } from 'vue-property-decorator';
import { ITableColumn } from '@/types/column';
import { Keys } from '@/types/keys';
import { IRowContext } from '@/types/row-context';

export default class DataTableBodyCellComponent extends Vue {
  @Prop() column: ITableColumn;
  @Prop() rowContext: IRowContext;
  @Prop() tabIndex: string;
  @Prop() renderTracking: boolean;
  @Prop() displayCheck: (row: Record<string, unknown>, column?: ITableColumn, value?: unknown) => boolean;
  @Prop() showContextMenu: boolean;

  sanitizedValue: string = null;
  value: unknown = null;
  isFocused = false;

  @Watch('rowContext.row', { deep: true, immediate: true }) onRowChanged() {
    this.checkValueUpdates();
  }

  @Watch('column.prop') onColumnChanged() {
    this.checkValueUpdates();
  }

  created() {
    if (this.renderTracking) {
      this.$emit('cell-created', this.column);
    }
  }

  beforeUpdate() {
    if (this.renderTracking) {
      this.$emit('cell-updated', this.column);
    }
  }

  mounted() {
    if (this.isCheckboxable && this.rowContext.isChecked) {
      this.$emit('check');
    }
  }

  onContextMenu(e: PointerEvent) {
    if (this.showContextMenu) {
      e.preventDefault();
      this.$emit('context-menu', e);
    }
  }

  checkValueUpdates() {
    let value = '';

    if (!this.rowContext || !this.column) {
      value = '';
    } else {
      value = this.column.$$valueGetter(this.rowContext.row, this.column.prop) as string;
    }
    if (this.value !== value) {
      this.value = value;
      // eslint-disable-next-line no-undefined
      this.sanitizedValue = value !== null && value !== undefined ? this.stripHtml(value) : value;
    }
  }

  stripHtml(html: string): string {
    if (!html.replace) {
      return html;
    }
    return html.replace(/<\/?[^>]+(>|$)/g, '');
  }

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
  }

  onClick(event: MouseEvent) {
    this.$emit('activate', {
      type: 'click',
      event,
      row: this.rowContext.row,
      rowHeight: this.rowContext.rowHeight,
      column: this.column,
      cellElement: this.$el,
      value: this.value,
      group: this.rowContext.group,
    });
  }

  onDblClick(event: MouseEvent) {
    this.$emit('activate', {
      type: 'dblclick',
      event,
      row: this.rowContext.row,
      rowHeight: this.rowContext.rowHeight,
      column: this.column,
      cellElement: this.$el,
      value: this.value,
      group: this.rowContext.group,
    });
  }

  onKeyDown(event: KeyboardEvent) {
    const keyCode = event.keyCode;
    const isTargetCell = event.target === this.$el;
    const isAction = [Keys.return, Keys.down, Keys.up, Keys.left, Keys.right, Keys.pageUp, Keys.pageDown].includes(
      keyCode
    );

    if (isAction && isTargetCell) {
      event.preventDefault();
      event.stopPropagation();

      this.$emit('activate', {
        type: 'keydown',
        event,
        row: this.rowContext.row,
        rowIndex: this.rowContext.rowIndex,
        rowHeight: this.rowContext.rowHeight,
        column: this.column,
        cellElement: this.$el,
        value: this.value,
        group: this.rowContext.group,
      });
    }
  }

  onCheckboxChange(event: MouseEvent) {
    this.$emit('activate', {
      type: 'checkbox',
      event,
      row: this.rowContext.row,
      rowHeight: this.rowContext.rowHeight,
      column: this.column,
      cellElement: this.$el,
      treeStatus: this.rowContext.treeStatus,
      value: this.value,
      group: this.rowContext.group,
    });
  }

  onTreeAction(event: MouseEvent) {
    this.$emit('tree-action', { event, row: this.rowContext.row });
  }

  onMouseEnter(event: MouseEvent) {
    this.$emit('mouseenter', { event, row: this.rowContext.row });
  }

  cellHeight(rowHeight: number): string | number {
    const height = rowHeight;
    if (isNaN(height)) {
      return height;
    }
    return `${height}px`;
  }

  calcLeftMargin(column: ITableColumn, row: Record<string, unknown>): number {
    const levelIndent = column.treeLevelIndent ? column.treeLevelIndent : 50;
    return column.isTreeColumn ? (row.level as number) * levelIndent : 0;
  }

  get cssClasses(): Record<string, boolean> {
    if (!this.rowContext) {
      return null;
    }
    const result: Record<string, boolean> = {};
    let func: (data: Record<string, unknown>) => string | Record<string, unknown>;
    if (this.column.cellClass) {
      let cssClass = this.column.cellClass;
      if (!Array.isArray(cssClass)) {
        cssClass = [cssClass];
      }
      (cssClass as Array<(data: Record<string, unknown>) => string | Record<string, unknown>>).forEach(value => {
        func = null;
        if (typeof value === 'string') {
          result[value] = true;
        } else if (Array.isArray(value)) {
          (value as Array<string>).forEach(val => {
            result[val] = true;
          });
        } else if (typeof value === 'function') {
          func = value;
        }
        if (func) {
          const res = func({
            row: this.rowContext?.row,
            group: this.rowContext?.group,
            column: this.column,
            value: this.value,
            rowHeight: this.rowContext?.rowHeight,
          });

          if (typeof res === 'string') {
            result[res] = true;
          } else if (typeof res === 'object') {
            const keys = Object.keys(res);
            for (const k of keys) {
              if (res[k] === true) {
                result[` ${k}`] = true;
              }
            }
          }
        }
      });
    }
    result['active'] = this.isFocused;
    return result;
  }

  get styles(): Record<string, string | number> {
    if (!this.rowContext) {
      return {};
    }
    return {
      width: `${this.column.width}px`,
      // eslint-disable-next-line no-undefined
      minWidth: this.column.minWidth ? `${this.column.minWidth}px` : undefined,
      // eslint-disable-next-line no-undefined
      maxWidth: this.column.maxWidth ? `${this.column.maxWidth}px` : undefined,
      height: this.rowContext.rowHeight === 'auto' ? this.rowContext.rowHeight : `${this.rowContext.rowHeight}px`,
    };
  }

  get isCheckboxable(): boolean {
    return (
      this.column.checkboxable &&
      (!this.displayCheck || this.displayCheck(this.rowContext.row, this.column, this.value))
    );
  }

  get isEnumerable(): boolean {
    return this.column.enumerable;
  }
}
