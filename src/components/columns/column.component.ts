import { Options, Prop, Vue, Watch } from 'vue-property-decorator';
import { ITableColumn, TComparator } from '@/types/column';

@Options({
  template: `
    <div>
      <slot name="header" v-bind="{column: column}">
        <!-- default content -->
        {{ name }}
      </slot>
      <!-- default slot for cell -->
      <slot> </slot>
    </div>
  `,
})
export default class DataTableColumnComponent extends Vue {
  @Prop() name: string;
  @Prop() prop: string | number;
  @Prop() frozenLeft: boolean;
  @Prop() frozenRight: boolean;
  @Prop() flexGrow: number;
  @Prop() resizeable: boolean;
  @Prop() comparator: TComparator;
  @Prop() sortable: boolean;
  @Prop() draggable: boolean;
  @Prop({ default: true }) canAutoResize: boolean;
  @Prop() minWidth: number;
  @Prop() width: number;
  @Prop() maxWidth: number;
  @Prop() checkboxable: boolean;
  @Prop() headerClass: string | ((data: { column: ITableColumn }) => string | Record<string, unknown>);
  @Prop() cellClass:
    | string
    | Array<string>
    | ((data: Record<string, unknown>) => string | Record<string, unknown>)
    | Array<string | Array<string> | ((data: Record<string, unknown>) => string | Record<string, unknown>)>;
  @Prop() isTreeColumn: boolean;
  @Prop() treeLevelIndent: number;
  @Prop() summaryFunc: (cells: unknown[]) => string;
  @Prop({ default: true }) visible: boolean;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  @Prop() formatter: (value: any) => any;

  column: ITableColumn = {};

  @Watch('visible') onVisibleChanged(newVal: boolean) {
    this.column.visible = newVal;
    (this.$parent as unknown as { onColumnChangeVisible: (value: ITableColumn) => void }).onColumnChangeVisible(
      this.column
    );
  }

  @Watch('frozenLeft') onFrozenLeftChanged(newVal: boolean) {
    this.column.frozenLeft = newVal;
  }

  @Watch('frozenRight') onFrozenRightChanged(newVal: boolean) {
    this.column.frozenRight = newVal;
  }

  @Watch('flexGrow') onFlexGrowChanged(newVal: number) {
    this.column.flexGrow = newVal;
  }

  @Watch('resizeable') onResizeableChanged(newVal: boolean) {
    this.column.resizeable = newVal;
  }

  @Watch('sortable') onSortableChanged(newVal: boolean) {
    this.column.sortable = newVal;
  }

  @Watch('draggable') onDraggableChanged(newVal: boolean) {
    this.column.draggable = newVal;
  }

  @Watch('checkboxable') onCheckboxableChanged(newVal: boolean) {
    this.column.checkboxable = newVal;
  }

  @Watch('width') onWidthChanged(newVal: number) {
    this.column.width = newVal;
  }

  @Watch('prop') onPropChanged(newVal: number) {
    this.column.prop = newVal;
  }

  mounted() {
    this.column.name = this.name;
    this.column.prop = this.prop;
    this.column.frozenLeft = this.frozenLeft;
    this.column.frozenRight = this.frozenRight;
    this.column.flexGrow = this.flexGrow;
    this.column.resizeable = this.resizeable;
    this.column.comparator = this.comparator;
    this.column.sortable = this.sortable;
    this.column.draggable = this.draggable;
    this.column.canAutoResize = this.canAutoResize;
    this.column.minWidth = this.minWidth;
    this.column.width = this.width;
    this.column.checkboxable = this.checkboxable;
    this.column.formatter = this.formatter;
    let headerClasses = [];
    if (Array.isArray(this.headerClass)) {
      headerClasses = [...this.headerClass];
    } else if (typeof this.headerClass === 'string') {
      headerClasses.push(this.headerClass);
    } else if (typeof this.headerClass === 'function') {
      const res = this.headerClass({
        column: this.column,
      });
      if (typeof res === 'string') {
        headerClasses.push(res);
      } else if (typeof res === 'object') {
        const keys = Object.keys(res);
        for (const key of keys) {
          if (res[key] === true) {
            headerClasses.push(key);
          }
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.$el.classList.length; i++) {
      const value = this.$el.classList[0];
      headerClasses.push(value);
    }
    this.column.headerClass = headerClasses as unknown as string | ((data: unknown) => string);

    let cellClasses = [];
    if (Array.isArray(this.cellClass)) {
      cellClasses = [...this.cellClass];
    } else if (typeof this.cellClass === 'string') {
      cellClasses.push(this.cellClass);
    } else if (typeof this.cellClass === 'function') {
      cellClasses.push(this.cellClass);
    }
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < this.$el.classList.length; i++) {
      const value = this.$el.classList[0];
      cellClasses.push(value);
    }
    this.column.cellClass = cellClasses;
    this.column.isTreeColumn = this.isTreeColumn;
    this.column.treeLevelIndent = this.treeLevelIndent;
    this.column.summaryFunc = this.summaryFunc;
    // this.column.headerTemplate = this.$scopedSlots.header;
    // this.column.headerAppendTemplate = this.$scopedSlots.headerAppend || this.$scopedSlots['header-append'];
    // this.column.cellTemplate = this.$slots.default ? this.$slots.default() : null;
    // this.column.summaryTemplate = this.$scopedSlots.summary;
    this.column.visible = this.visible;
    (this.$parent as unknown as { onColumnInsert: (value: ITableColumn) => void }).onColumnInsert(this.column);
  }
}
