import { Options, Prop, Vue } from 'vue-property-decorator';
import { IColumnsByPinRecord, IColumnsWidth, ITableColumn } from '@/types/column';
import { Keys } from '@/types/keys';
import { IRowContext } from '@/types/row-context';
import { TreeStatus } from '@/types/tree-status';
import DataTableBodyCellComponent from './body-cell.component.vue';

@Options({
  components: {
    'datatable-body-cell': DataTableBodyCellComponent,
  },
})
export default class DataTableBodyRowComponent extends Vue {
  @Prop() row: Record<string, unknown>;
  @Prop() rowId: unknown;
  @Prop() rowContext: IRowContext;
  @Prop() columnsByPin: IColumnsByPinRecord[];
  @Prop() columnGroupWidths: IColumnsWidth;
  @Prop() groupStyles: (colGroup: 'left' | 'center' | 'right') => Record<string, string>;
  @Prop() rowClass: (row: Record<string, unknown>) => Array<string | Record<string, boolean>>;
  @Prop() displayCheck: (row: Record<string, unknown>, column?: ITableColumn, value?: unknown) => boolean;
  @Prop() renderTracking: boolean;
  @Prop() showContextMenu: boolean;

  counter = 0; // it's need to update cells after row's changing
  isFocused = false;

  created() {
    if (this.renderTracking) {
      this.$emit('row-created', this.row);
    }
  }

  updated() {
    if (this.renderTracking) {
      this.$emit('row-updated', this.row);
    }
    if (this.isFocused) {
      (this.$el as HTMLElement).focus();
    }
  }

  onCellRendered(column: ITableColumn) {
    this.$emit('row-updated', this.row);
  }

  onFocus() {
    this.isFocused = true;
  }

  onBlur() {
    this.isFocused = false;
  }

  onActivate(event: { cellIndex: number; rowElement: Element }, index: number) {
    event.cellIndex = index;
    event.rowElement = this.$el;
    this.$emit('activate', event);
  }

  onCheck() {
    this.$emit('check');
  }

  onKeyDown(event: KeyboardEvent) {
    const keyCode = event.keyCode;
    const isTargetRow = event.target === this.$el;

    const isAction = [Keys.return, Keys.down, Keys.up, Keys.pageUp, Keys.pageDown].includes(keyCode);

    if (isAction && isTargetRow) {
      event.preventDefault();
      event.stopPropagation();

      this.$emit('activate', {
        type: 'keydown',
        event,
        row: this.row,
        rowIndex: this.rowContext.rowIndex,
        rowElement: this.$el,
      });
    }
  }

  onMouseenter(event: MouseEvent) {
    this.$emit('activate', {
      type: 'mouseenter',
      event,
      row: this.row,
      rowElement: this.$el,
    });
  }

  onContextMenu(e: PointerEvent, col: ITableColumn, rowContext: IRowContext) {
    this.$emit('context-menu', {
      event: e,
      col,
      row: rowContext,
    });
  }

  onTreeAction(event: Event) {
    this.$emit('tree-action', event);
  }

  get styles(): Record<string, string> {
    if (this.rowContext) {
      return {
        width: `${this.columnGroupWidths?.total ?? 0}px`,
        height: this.rowContext.rowHeight === 'auto' ? this.rowContext.rowHeight : `${this.rowContext.rowHeight}px`,
      };
    }
    return {
      width: `${this.columnGroupWidths?.total ?? 0}px`,
    };
  }

  get cssClasses(): Array<string | Record<string, boolean>> {
    const cls: Array<string | Record<string, boolean>> = [];
    if (this.rowContext?.isSelected) {
      cls.push('active');
    }
    if (this.rowContext?.rowIndex % 2 !== 0) {
      cls.push('datatable-row-odd');
    } else {
      cls.push('datatable-row-even');
    }
    if (this.rowContext?.treeStatus) {
      cls.push('datatable-row-tree-node');
    }
    if (this.rowContext?.treeStatus === TreeStatus.Expanded) {
      cls.push('datatable-row-tree-node--expanded');
    }
    if (this.rowClass instanceof Function) {
      const res = this.rowClass(this.rowContext.row);
      cls.push(...res);
    }
    if (this.rowContext?.dragging) {
      cls.push('datatable-row-dragging');
    }
    if (this.rowContext?.dragover) {
      cls.push('datatable-row-dragover');
    }
    return cls;
  }
}
