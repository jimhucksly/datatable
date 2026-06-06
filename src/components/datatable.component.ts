import { nextTick } from 'vue';
import { Options, Prop, Provide, Vue, Watch } from 'vue-property-decorator';
import { CheckMode } from '@/types/check';
import { IColumnsByPinRecord, IColumnsWidth, ITableColumn } from '@/types/column';
import { ColumnMode } from '@/types/column-mode';
import { ContextmenuType } from '@/types/contextmenu';
import { IDragndrop } from '@/types/dragndrop';
import { IEventProvider } from '@/types/events';
import { IGroup, IGroupedRows, IKeyDescription } from '@/types/group';
import { RowColorize, RowIdentity, RowSize } from '@/types/row';
import { IRowDefault } from '@/types/row-context';
import { SelectionType } from '@/types/selection';
import { SortType } from '@/types/sort';
import { ISortEvent, ISortPropDir } from '@/types/sort-prop-dir';
import { TreeStatus } from '@/types/tree-status';
import { columnGroupWidths, columnsByPin, columnsByPinArr } from '@/utils/column';
import { setColumnDefaults, setColumnsDefaults } from '@/utils/column-helper';
import { deepValueGetter } from '@/utils/column-prop-getters';
import { isArrayEqual } from '@/utils/equal.array';
import { adjustColumnWidths, forceFillColumnWidths } from '@/utils/math';
import { sortRows } from '@/utils/sort';
import { groupRowsByParents, optionalGetterForProp } from '@/utils/tree';
import { directiveOptions as directiveOptionsVO } from '../directives/visibility.directive';
import { DimensionsHelper } from '../services/dimensions-helper.service';
import { ScrollbarHelper } from '../services/scrollbar-helper.service';
import DataTableBody from './body/body.vue';
import ProgressBar from './body/progress-bar.component';
import DataTableFooter from './footer/footer.vue';
import DataTableHeader from './header/header.vue';

interface IHeaderController extends Vue {
  onCheckedAll: (event: boolean) => void;
}

interface IBodyController extends Vue {
  onCheckedAll: (event: boolean) => void;
}

class EventProvider implements IEventProvider {
  events: Map<string, (data: unknown) => void> = new Map();

  emit(event: string, data: unknown): void {
    if (this.events.has(event)) {
      const cb = this.events.get(event);
      if (cb instanceof Function) {
        cb(data);
      }
    }
  }

  on(event: string, cb: (data: unknown) => void): void {
    this.events.set(event, cb);
  }

  flush() {
    this.events.clear();
  }
}

@Options({
  components: {
    'datatable-progress': ProgressBar,
    'datatable-header': DataTableHeader,
    'datatable-body': DataTableBody,
    'datatable-footer': DataTableFooter,
  },
  directives: {
    'visibility-observer': directiveOptionsVO,
  },
})
export default class DatatableComponent extends Vue {
  /**
   * Rows that are displayed in the table.
   */
  @Prop() rows: Array<Record<string, unknown>>;
  /**
   * This attribute allows the user to set the names of the columns to group the data with
   */
  @Prop() groupRowsBy: Array<IGroup>;
  /**
   * State of default expansions for groups
   */
  @Prop() groupExpandedState: Record<string, boolean>;
  /**
   * The indicator for switching the expansions of groups
   * 0 - all groups are collapsed, 1 - all groups are expanded
   * The prop of groupExpansionDefault is priority
   */
  @Prop({ type: Number, default: -1 }) groupExpansion: number;
  /**
   * A boolean you can use to set the detault behaviour of rows and groups
   * whether they will start expanded or not. If ommited the default is NOT expanded.
   *
   */
  @Prop({ type: Boolean, default: false }) groupExpansionDefault: boolean;
  /**
   * Columns that are displayed in the table
   */
  @Prop() columns: ITableColumn[];
  /**
   * List of row objects that should be
   * represented as selected in the grid.
   * Default value: `[]`
   */
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) selected: Array<Record<string, unknown>>;
  /**
   * List of row objects that should be
   * represented as checked in the grid.
   * Default value: `[]`
   */
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) checked: Array<Record<string, unknown>>;
  /**
   * Enable vertical scrollbars
   */
  @Prop({ type: Boolean, default: false }) scrollbarV: boolean;
  /**
   * Enable horz scrollbars
   */
  @Prop({ type: Boolean, default: false }) scrollbarH: boolean;
  /**
   * Height of row by default
   */
  @Prop({ type: String, default: 's' }) size: RowSize;
  /**
   * Show cell borders
   */
  @Prop({ type: Boolean, default: false }) bordered: boolean;
  /**
   * The group header row styles
   */
  @Prop() groupHeaderStyles: Record<string, string | number>;
  /**
   * The group header row css classes
   */
  @Prop() groupHeaderClasses: string | Array<string>;
  /**
   * The detail row height
   */
  @Prop() rowDetailHeight: number | string;
  /**
   * Type of column width distribution formula.
   * Example: flex, force, standard
   */
  @Prop({ type: String, validator: (value: string) => ['standard', 'flex', 'force'].indexOf(value) !== -1 })
  columnMode: string;
  /**
   * If the table should use external paging
   * otherwise its assumed that all data is preloaded.
   */
  @Prop({ type: Boolean, default: false }) externalPaging: boolean;
  /**
   * If the table should use external sorting or
   * the built-in basic sorting.
   */
  @Prop({ type: Boolean, default: false }) externalSorting: boolean;
  /**
   * The page size to be shown.
   * Default value: `undefined`
   */
  @Prop() limit: number;
  /**
   * The total count of all rows.
   * Default value: `0`
   */
  @Prop({ type: Number, default: 0 }) count: number;
  /**
   * The current offset ( page - 1 ) shown.
   * Default value: `0`
   */
  @Prop({ type: Number, default: 0 }) offset: number;
  /**
   * Show the linear loading bar.
   * Default value: `false`
   */
  @Prop({ type: Boolean, default: false }) loadingIndicator: boolean;
  /**
   * Type of row selection. Options are:
   *
   *  - `single`
   *  - `multi`
   *  - `checkbox`
   *  - `multiClick`
   *  - `cell`
   *
   * For no selection pass a `false`.
   * Default value: `undefined`
   */
  @Prop() selectionType: SelectionType;
  /**
   * Type of row check type. Options are:
   *
   *  - `checkIsSelect`
   *  - `checkNoSelect`
   *
   * Default value: `checkIsSelect`
   */
  @Prop({ default: CheckMode.checkIsSelect }) checkMode: CheckMode;
  /**
   * Enable/Disable ability to re-order columns
   * by dragging them.
   */
  @Prop({ type: Boolean, default: true }) reorderable: boolean;
  /**
   * Swap columns on re-order columns or
   * move them.
   */
  @Prop({ type: Boolean, default: false }) swapColumns: boolean;
  /**
   * The type of sorting
   */
  @Prop({ type: String, validator: (value: string) => ['single', 'multi'].indexOf(value) !== -1 }) sortType: string;
  /**
   * Array of sorted columns by property and type.
   * Default value: `[]`
   */
  @Prop({ type: Array, default: (): Array<ISortPropDir> => [] }) sorts: ISortPropDir[];
  /**
   * Go to first page when sorting to see the newly sorted data
   * Default value: true
   */
  @Prop({ default: true }) goToFirstAfterSort: boolean;
  /**
   * Message overrides for localization
   *
   * emptyMessage     [default] = 'No data to display'
   * totalMessage     [default] = 'total'
   * selectedMessage  [default] = 'selected'
   */
  @Prop({
    type: Object,
    default: () => ({
      emptyMessage: 'No data to display',
      // Footer total message
      totalMessage: 'total',
      // Footer selected message
      selectedMessage: 'selected',
    }),
  })
  messages: Record<string, string>;
  /**
   * This will be used when displaying or selecting rows.
   * when tracking/comparing them, we'll use the value of this fn,
   *
   * (`fn(x) === fn(y)` instead of `x === y`)
   */
  @Prop({ type: Function, default: (x: IRowDefault) => (x && 'id' in x ? x.id : x) }) rowIdentity: RowIdentity;
  /**
   * Row specific classes.
   * Similar implementation to ngClass.
   *
   *  [rowClass]="'first second'"
   *  [rowClass]="{ 'first': true, 'second': true, 'third': false }"
   */
  @Prop() rowClass: (row: Record<string, unknown>) => string;
  /**
   * A boolean/function you can use to check whether you want
   * to select a particular row based on a criteria. Example:
   *
   *    (selection) => {
   *      return selection !== 'Ethel Price';
   *    }
   */
  @Prop() selectCheck: () => void;
  /**
   * A function you can use to check whether you want
   * to show the checkbox for a particular row based on a criteria. Example:
   *
   *    (row, column, value) => {
   *      return row.name !== 'Ethel Price';
   *    }
   */
  @Prop({ type: Function, default: null }) displayCheck: (
    row: Record<string, unknown>,
    column?: ITableColumn,
    value?: unknown
  ) => boolean;
  /**
   * Property to which you can use for custom tracking of rows.
   * Example: 'name'
   */
  @Prop() trackByProp: string;
  /**
   * A flag for row virtualization on / off
   */
  @Prop({ type: Boolean, default: true }) virtualization: boolean;
  /**
   * Tree from relation
   */
  @Prop() treeFromRelation: string;
  /**
   * Tree to relation
   */
  @Prop() treeToRelation: string;
  /**
   * Is the tree will be lazy loading
   */
  @Prop({ default: false }) lazyTree: boolean;
  /**
   * A flag for switching summary row on / off
   */
  @Prop({ type: Boolean, default: false }) summaryRow: boolean;
  /**
   * A height of summary row
   */
  @Prop({ default: 30 }) summaryHeight: number | string;
  /**
   * A property holds a summary row position: top/bottom
   */
  @Prop({ type: String, default: 'top' }) summaryPosition: string;
  /**
   * Before selection row check function. If return false selection will be cancel
   */
  @Prop() beforeSelectRowCheck: (
    newRow: Record<string, unknown>,
    oldSelected: Record<string, unknown>[]
  ) => boolean | Promise<boolean>;

  /**
   * Adding a first column with checkbox
   */
  @Prop({ default: false }) checkboxable: boolean;
  /**
   * Show a column with number of row
   */
  @Prop({ default: false }) enumerable: boolean;

  @Prop({
    default: {
      draggable: false,
      dragstart: (): unknown => null,
      drop: (): unknown => null,
    },
  })
  dragData: IDragndrop;
  /**
   * Colorize rows by rowIdentity
   */
  @Prop({ type: Function, default: (): RowColorize => null }) colorize: RowColorize;

  /**
   * Reference to the body component for manually
   * invoking functions on the body.
   */
  bodyComponent: IBodyController = null;
  /**
   * Reference to the header component for manually
   * invoking functions on the header.
   */
  headerComponent: IHeaderController = null;

  resizeHandler: () => void;
  resizeObserver?: ResizeObserver;

  groupedRows: IGroupedRows[] = null;

  innerWidth = 0;
  pageSize = 0;
  bodyHeight = 0;
  bodyWidth = 0;
  rowCount = 0;
  internalRows: Array<Record<string, unknown>> = null;
  initialRows: Array<Record<string, unknown>> = null;
  internalColumns: ITableColumn[] = null;
  myColumnMode: ColumnMode = ColumnMode.standard;
  mySortType: SortType = SortType.single;
  mySorts: Array<ISortPropDir> = [];
  innerOffset = 0; // page number after scrolling
  mySelected: Array<Record<string, unknown>> = [];
  myChecked: Array<Record<string, unknown>> = [];
  expandedGroups: Record<string, boolean> = {};
  renderTracking = false;
  isVisible = false;

  rowDetail = false;

  columnGroupWidths: IColumnsWidth = null;
  columnsByPinArray: IColumnsByPinRecord[] = [];

  private readonly scrollbarHelper: ScrollbarHelper = new ScrollbarHelper();
  private readonly dimensionsHelper: DimensionsHelper = new DimensionsHelper();
  private needToCalculateDims = true;
  private activeGroupRow: IGroupedRows = null;
  private recalculateColumnsTimer: number;

  @Provide() eventProvider = new EventProvider();

  @Watch('rows', { immediate: true, deep: true }) onRowsChanged(newVal: Array<Record<string, unknown>>) {
    if (!newVal) {
      newVal = [{ id: 1 }];
    }
    if (newVal) {
      this.internalRows = [...newVal];
    }
    const treeFrom = optionalGetterForProp(this.treeFromRelation);
    const treeTo = optionalGetterForProp(this.treeToRelation);
    if (treeFrom && treeTo) {
      // it's need to rebuild tree after sorting
      this.initialRows = this.internalRows;
    }
    this.innerSortRows();
    this.groupedRows = null;
    if (this.rows && this.groupRowsBy) {
      this.groupedRows = this.groupArrayBy(this.rows, this.groupRowsBy, 0);
      this.internalRows = this.processGroupedRows(this.groupedRows) as Array<Record<string, unknown>>;
      // auto sort on new updates
      if (!this.externalSorting) {
        this.sortInternalRows();
      }
    }

    // recalculate sizes/etc
    if (this.$el) {
      this.recalculate();
    }
  }

  @Watch('groupRowsBy') onGroupRowsByChanged(
    newVal: Array<IGroup | Array<IGroup>>,
    oldVal: Array<IGroup | Array<IGroup>>
  ) {
    if (isArrayEqual(newVal, oldVal)) {
      return;
    }
    this.expandedGroups = {};
    this.groupedRows = null;
    if (this.groupRowsBy) {
      this.groupedRows = this.groupArrayBy(this.rows, this.groupRowsBy, 0);
      this.internalRows = this.processGroupedRows(this.groupedRows) as Array<Record<string, unknown>>;
    } else {
      this.internalRows = this.rows;
    }
    // auto sort on new updates
    if (!this.externalSorting) {
      this.sortInternalRows();
    }
    this.recalculate();
  }

  /**
   * Columns to be displayed.
   */
  @Watch('columns', { immediate: true }) onColumnsChanged(newVal: ITableColumn[]) {
    if (!newVal) {
      newVal = [{ name: 'id' }];
    }
    if (newVal) {
      this.internalColumns = [...newVal];
      setColumnsDefaults(this.internalColumns, this.enumerable, this.checkboxable);
      nextTick(() => this.recalculateColumns());
    }
  }
  /**
   * The page size to be shown.
   * Default value: `undefined`
   */
  @Watch('limit') onLimitChanged() {
    // recalculate sizes/etc
    this.recalculate();
  }
  /**
   * The total count of all rows.
   * Default value: `0`
   */
  @Watch('count') onCountChanged() {
    this.recalculate();
  }

  @Watch('columnMode', { immediate: true }) onColumnModeChanged() {
    this.myColumnMode = ColumnMode[this.columnMode as keyof typeof ColumnMode] as ColumnMode;
  }

  @Watch('sortType', { immediate: true }) onSortTypeChanged() {
    if (SortType[this.sortType as keyof typeof SortType]) {
      this.mySortType = SortType[this.sortType as keyof typeof SortType] as SortType;
    }
  }

  @Watch('offset', { immediate: true }) onOffsetChanged() {
    if (this.innerOffset !== this.offset) {
      this.innerOffset = this.offset;
      if (this.pageSize && this.innerOffset >= 0) {
        this.onFooterPage({ page: this.innerOffset + 1 });
      }
    }
  }

  @Watch('pageSize') onPageSizeChanged() {
    if (this.pageSize && this.innerOffset >= 0) {
      nextTick(() => this.onFooterPage({ page: this.innerOffset + 1 }));
    }
  }

  @Watch('selected', { immediate: true }) onSelectedChanged() {
    this.mySelected = this.selected;
  }

  @Watch('checked', { immediate: true }) onCheckedChanged() {
    // this.myChecked = this.checked;
  }

  @Watch('sorts', { immediate: true }) onSortsChanged() {
    this.mySorts = this.sorts;
    if (!this.mySorts) {
      this.mySorts = [];
    }
  }

  @Watch('mySorts') onMySortsChanged() {
    this.innerSortRows();
  }

  @Watch('groupedRows') onGroupedRows(groups: Array<IGroupedRows>) {
    if (groups?.length > 0) {
      const isAllCollapsed = !groups.some(g => g.__expanded);
      let isAllExpanded = true;
      const isExpandGroup = (_groups: Array<IGroupedRows>) => {
        for (const gr of _groups) {
          if (!isAllExpanded) {
            break;
          }
          if (!gr.__expanded) {
            isAllExpanded = false;
          }
          if (gr.groups?.length) {
            isExpandGroup(gr.groups);
          }
        }
      };
      isExpandGroup(groups);
      if (isAllCollapsed) {
        this.$emit('update:groupExpansion', 0);
      }
      if (isAllExpanded) {
        this.$emit('update:groupExpansion', 1);
      }
    }
  }

  @Watch('groupExpansion') onGroupExpansionChanged(val: number) {
    if (val > 0) {
      this.expandAllGroups();
    }
    if (val === 0) {
      this.collapseAllGroups();
    }
  }

  onWindowResize() {
    this.recalculate();
  }

  created() {
    this.$emit('update:groupExpansion', -1);
  }

  beforeUnmount() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.$el);
    }
    this.eventProvider.flush();
  }

  /**
   * Lifecycle hook that is called after data-bound
   * properties of a directive are initialized.
   */
  mounted() {
    this.bodyComponent = this.$refs.datatableBody as IBodyController;
    this.headerComponent = this.$refs.datatableHeader as IHeaderController;

    if (!this.externalSorting) {
      this.sortInternalRows();
    }
    if ((window as Window).ResizeObserver) {
      this.needToCalculateDims = false;
      this.resizeObserver = new (window as Window).ResizeObserver(entries => {
        if (typeof window.requestAnimationFrame === 'undefined') {
          this.recalculate();
        } else {
          window.requestAnimationFrame(() => {
            if (!Array.isArray(entries) || !entries.length) {
              return null;
            }
            let height = 0;
            let width = 0;
            if (entries.length && entries[0].contentRect) {
              width = Math.round(entries[0].contentRect.width);
              height = Math.round(entries[0].contentRect.height);
            } else {
              height = this.$el.clientHeight;
              width = this.$el.clientWidth;
            }
            if (this.scrollbarV) {
              if (this.headerHeight) {
                height = height - this.headerHeight;
              }
              if (this.footerHeight) {
                height = height - this.footerHeight;
              }
            }
            if (this.innerWidth === width && this.bodyHeight === height) {
              return;
            }
            this.innerWidth = width;
            this.bodyHeight = height;
            this.recalculate();
          });
        }
      });
      this.resizeObserver.observe(this.$el);
    } else {
      this.resizeHandler = this.onWindowResize.bind(this) as () => void;
      window.addEventListener('resize', this.resizeHandler);
    }
    const init = () => {
      this.recalculate();
      // emit page for virtual server-side kickoff
      if (this.externalPaging && this.scrollbarV) {
        this.$emit('page', {
          count: this.count,
          pageSize: this.pageSize,
          limit: this.limit,
          offset: this.innerOffset,
        });
      }
    };
    if (typeof requestAnimationFrame === 'undefined') {
      init();
    } else {
      requestAnimationFrame(() => {
        init();
      });
    }
  }

  get myOffset(): number {
    if (this.rowCount) {
      return Math.max(Math.min(this.innerOffset, Math.ceil(this.rowCount / this.pageSize) - 1), 0);
    }
    return this.innerOffset;
  }

  /**
   * CSS class applied if the header height if fixed height.
   */
  get isFixedHeader(): boolean {
    const headerHeight: number | string = this.headerHeight;
    return typeof headerHeight === 'string' ? <string>headerHeight !== 'auto' : true;
  }

  /**
   * CSS class applied to the root element if
   * the row heights are fixed heights.
   */
  get isFixedRow(): boolean {
    return true;
  }

  /**
   * CSS class applied to root element if
   * vertical scrolling is enabled.
   */
  get isVertScroll(): boolean {
    return this.scrollbarV;
  }

  /**
   * CSS class applied to root element if
   * virtualization is enabled.
   */
  get isVirtualized(): boolean {
    return this.virtualization;
  }

  /**
   * CSS class applied to the root element
   * if the horziontal scrolling is enabled.
   */
  get isHorScroll(): boolean {
    return this.scrollbarH;
  }

  /**
   * CSS class applied to root element is selectable.
   */
  get isSelectable(): boolean {
    // eslint-disable-next-line no-undefined
    return this.selectionType !== undefined;
  }

  /**
   * CSS class applied to root is checkbox selection.
   */
  get isCheckboxSelection(): boolean {
    return this.selectionType === SelectionType.checkbox;
  }

  /**
   * CSS class applied to root if cell selection.
   */
  get isCellSelection(): boolean {
    return this.selectionType === SelectionType.cell;
  }

  /**
   * CSS class applied to root if single select.
   */
  get isSingleSelection(): boolean {
    return this.selectionType === SelectionType.single;
  }

  get isSingleFocusSelection(): boolean {
    return this.selectionType === SelectionType.singleFocus;
  }

  /**
   * CSS class added to root element if mulit select
   */
  get isMultiSelection(): boolean {
    return this.selectionType === SelectionType.multi;
  }

  /**
   * CSS class added to root element if mulit click select
   */
  get isMultiClickSelection(): boolean {
    return this.selectionType === SelectionType.multiClick;
  }

  get isBordered(): boolean {
    return this.bordered;
  }

  get classObject(): Record<string, unknown> {
    return {
      'fixed-header': this.isFixedHeader,
      'fixed-row': this.isFixedRow,
      'scroll-vertical': this.isVertScroll,
      virtualized: this.isVirtualized,
      'scroll-horz': this.isHorScroll,
      selectable: this.isSelectable,
      bordered: this.isBordered,
      'checkbox-selection': this.isCheckboxSelection,
      'cell-selection': this.isCellSelection,
      'single-selection': this.isSingleSelection,
      'multi-selection': this.isMultiSelection,
      'multi-click-selection': this.isMultiClickSelection,
    };
  }

  get scrollbarWidth(): number {
    return this.scrollbarHelper.width;
  }

  get rowHeight(): number {
    switch (this.size) {
      case 's':
        return 32;
      case 'm':
        return 52;
      case 'l':
        return 72;
    }
  }

  get groupRowHeight(): number {
    return 32;
  }

  get headerHeight(): number {
    return 32;
  }

  get footerHeight(): number {
    if (this.$slots?.footer) {
      return 32;
    }
    return 0;
  }

  get progressMarginTop(): string {
    return `${this.headerHeight}px`;
  }

  reset() {
    (this.bodyComponent as unknown as { reset: () => void }).reset();
  }

  adjust() {
    this.bodyHeight = -1;
    setTimeout(() => {
      this.recalculateDims();
    });
  }

  /**
   * Recalc's the sizes of the grid.
   *
   * Updated automatically on changes to:
   *
   *  - Columns
   *  - Rows
   *  - Paging related
   *
   * Also can be manually invoked or upon window resize.
   */
  recalculate() {
    if (this.needToCalculateDims) {
      // this.recalculatePages will be called in this.recalculateDims
      this.recalculateDims();
    } else {
      this.recalculatePages();
    }
    this.recalculateColumns();
  }

  /**
   * Recalulcates the column widths based on column width
   * distribution mode and scrollbar offsets.
   */
  recalculateColumns(
    columns: ITableColumn[] = this.internalColumns,
    forceIdx: number = -1,
    allowBleed: boolean = this.scrollbarH
  ): ITableColumn[] | null {
    if (!columns) {
      return null;
    }
    let width = this.innerWidth;
    if (this.scrollbarV || this.treeFromRelation) {
      width = width - this.scrollbarWidth;
    }
    this.calculateColumnsWidth(width, columns, forceIdx, allowBleed);
    nextTick(() => {
      const colsByPin = columnsByPin(columns);
      this.columnsByPinArray = columnsByPinArr(colsByPin);
      this.columnGroupWidths = columnGroupWidths(colsByPin, columns, width);
    });
    return columns;
  }

  calculateColumnsWidth(
    width: number,
    columns: ITableColumn[] = this.internalColumns,
    forceIdx: number = -1,
    allowBleed: boolean = this.scrollbarH
  ) {
    if (this.myColumnMode === ColumnMode.force) {
      forceFillColumnWidths(columns, width, forceIdx, allowBleed);
    } else if (this.myColumnMode === ColumnMode.flex) {
      adjustColumnWidths(columns, width);
    }
  }

  /**
   * Recalculates the dimensions of the table size.
   * Internally calls the page size and row count calcs too.
   *
   */
  recalculateDims() {
    const dims = this.dimensionsHelper.getDimensions(this.$el);
    this.innerWidth = Math.ceil(dims.width);

    if (this.scrollbarWidth) {
      this.innerWidth = this.innerWidth - this.scrollbarWidth;
    }

    if (this.scrollbarV) {
      let height = dims.height;
      if (this.headerHeight) {
        height = height - this.headerHeight;
      }
      if (this.footerHeight) {
        height = height - this.footerHeight;
      }
      this.bodyHeight = height;
    }
    this.recalculatePages();
  }

  /**
   * Recalculates the pages after a update.
   */
  recalculatePages() {
    this.pageSize = this.calcPageSize();
    this.rowCount = this.calcRowCount();
    this.$emit('row-count', this.rowCount);
  }

  /**
   * Body triggered a page event.
   */
  onBodyPage({ offset }: { offset: number }) {
    // Avoid pagination caming from body events like scroll when the table
    // has no virtualization and the external paging is enable.
    // This means, let's the developer handle pagination by my him(her) self
    if (this.externalPaging && !this.virtualization) {
      return;
    }
    if (this.innerOffset === offset) {
      return;
    }
    this.innerOffset = offset;
    this.$emit('page', {
      count: this.count,
      pageSize: this.pageSize,
      limit: this.limit,
      offset: this.innerOffset,
    });
  }

  /**
   * The body triggered a scroll event.
   */
  onBodyScroll(event: MouseEvent) {
    this.$emit('scroll', event);
  }

  /**
   * The footer triggered a page event.
   */
  onFooterPage(event: { page: number }) {
    this.innerOffset = event.page - 1;
    if (this.bodyComponent) {
      (
        this.bodyComponent as unknown as { updateOffsetY: (offset: number, fromPager: boolean) => number }
      ).updateOffsetY(this.innerOffset, true);
    }
    this.$emit('page', {
      count: this.count,
      pageSize: this.pageSize,
      limit: this.limit,
      offset: this.innerOffset,
    });
  }

  onVisible(visible: boolean) {
    if (this.isVisible !== visible) {
      this.isVisible = visible;
      if (this.isVisible) {
        this.recalculate();
      }
    }
  }

  /**
   * Recalculates the sizes of the page
   */
  calcPageSize(val: Array<Record<string, unknown>> = this.rows): number {
    // Keep the page size constant even if the row has been expanded.
    // This is because an expanded row is still considered to be a child of
    // the original row.  Hence calculation would use rowHeight only.
    if (this.scrollbarV && this.virtualization) {
      const size = Math.ceil(this.bodyHeight / this.rowHeight);
      return Math.max(size, 0);
    }

    // if limit is passed, we are paging
    // eslint-disable-next-line no-undefined
    if (this.limit !== undefined && this.limit !== null) {
      return Number(this.limit);
    }

    // otherwise use row length
    if (val) {
      return val.length;
    }

    return 0;
  }

  /**
   * Calculates the row count.
   */
  calcRowCount(val: Array<Record<string, unknown>> = this.rows): number {
    if (!this.externalPaging && !val) {
      return 0;
    }
    if (this.groupRowsBy) {
      return this.internalRows.length;
    }
    if (this.treeFromRelation !== null && this.treeToRelation !== null) {
      return this.internalRows.length;
    }

    return !this.externalPaging ? val.length : this.count;
  }

  /**
   * The header triggered a contextmenu event.
   */
  onColumnContextmenu({ event, column }: { event: MouseEvent; column: ITableColumn }) {
    this.$emit('tableContextmenu', { event, type: ContextmenuType.header, content: column });
  }

  /**
   * The body triggered a contextmenu event.
   */
  onRowContextmenu({ event, row }: { event: MouseEvent; row: Record<string, unknown> }) {
    this.$emit('tableContextmenu', { event, type: ContextmenuType.body, content: row });
  }

  /**
   * The header triggered a column resize event.
   */
  onColumnResize({ column, newValue }: { column: ITableColumn; newValue: number }) {
    /* Safari/iOS 10.2 workaround */
    // eslint-disable-next-line no-undefined
    if (column === undefined) {
      return;
    }

    let idx: number;
    this.internalColumns.map((c, i) => {
      if (c.$$id === column.$$id) {
        idx = i;
        c.width = newValue;
        c.canAutoResize = false;

        // set this so we can force the column
        // width distribution to be to this value
        c.$$oldWidth = newValue;
      }

      return c;
    });

    this.recalculateColumns(this.internalColumns, idx);

    this.$emit('resize', {
      column,
      newValue,
    });
  }

  /**
   * Force change order of columns
   * @param order Array<naumber> (index - new position of column; value - old position of column)
   */
  reorderColumns(order: Array<number>) {
    const oldColumnsOrder = new Map<number, ITableColumn>();
    this.internalColumns.forEach((c, i) => oldColumnsOrder.set(i, c));
    order.forEach((oldPos, newPos) => {
      this.internalColumns[newPos] = oldColumnsOrder.get(oldPos);
    });
    this.recalculateColumns();
  }

  /**
   * The header triggered a column re-order event.
   */
  onColumnReorder({ column, newValue, prevValue }: { column: ITableColumn; newValue: number; prevValue: number }) {
    let cols: Array<ITableColumn> = [];
    const checkCol = this.internalColumns.find(c => c.name === '__check__');
    if (checkCol) {
      cols = [checkCol, ...this.internalColumns.filter(c => c.name !== '__check__')];
      newValue = newValue === 0 ? 1 : newValue;
    } else {
      cols = [...this.internalColumns];
    }

    if (this.swapColumns) {
      const prevCol = cols[newValue];
      if (column.$$id === prevCol.$$id) {
        return;
      }
      cols[newValue] = column;
      cols[prevValue] = prevCol;
    } else if (newValue > prevValue) {
      const movedCol = cols[prevValue];
      for (let i = prevValue; i < newValue; i++) {
        cols[i] = cols[i + 1];
      }
      cols[newValue] = movedCol;
    } else {
      const movedCol = cols[prevValue];
      for (let i = prevValue; i > newValue; i--) {
        cols[i] = cols[i - 1];
      }
      cols[newValue] = movedCol;
    }

    this.internalColumns = cols;
    this.recalculateColumns();

    this.$emit('reorder', {
      column,
      newValue,
      prevValue,
    });
  }

  /**
   * The header triggered a column sort event.
   */
  onColumnSort(event: ISortEvent) {
    if (Array.isArray(this.mySorts) && Array.isArray(event.sorts)) {
      this.mySorts = [];
      event.sorts.forEach(item => this.mySorts.push(item));
      if (!this.mySorts.length) {
        this.internalRows = this.rows;
      }
    }

    // Go to first page when sorting to see the newly sorted data
    if (this.goToFirstAfterSort) {
      this.innerOffset = 0;
    }
    (this.bodyComponent as unknown as { updateOffsetY: (offset: number, fromPager: boolean) => number }).updateOffsetY(
      this.myOffset,
      true
    );
    this.$emit('sort', { ...event, sorts: event?.sorts?.filter(s => s.prop) });
  }

  /**
   * Toggle all row selection
   */
  onHeaderSelect(isChecked: boolean) {
    if (this.bodyComponent) {
      this.bodyComponent.onCheckedAll(isChecked);
    }
  }

  /**
   * A row was selected from body
   */
  onBodySelect(event: Event) {
    this.$emit('select', event);
  }

  /**
   * A row was checked from body
   */
  onBodyCheck(event: Event) {
    this.$emit('check', event);
  }

  onBodyCheckAll(flag: boolean) {
    if (this.headerComponent) {
      this.headerComponent.onCheckedAll(flag);
    }
  }

  onGroupToggle(event: { value: IGroupedRows | boolean }) {
    if (!event) {
      return;
    }
    if (typeof event.value !== 'boolean') {
      event.value.__expanded = !event.value.__expanded;
      this.expandedGroups[event.value.key] = event.value.__expanded;
      if (this.activeGroupRow) {
        this.activeGroupRow.active = false;
      }
      this.activeGroupRow = event.value;
      this.activeGroupRow.active = true;
    }
    this.internalRows = this.processGroupedRows(this.groupedRows) as Array<Record<string, unknown>>;
    this.recalculate();
    this.$emit('update:groupExpansion', -1);
    this.$emit('update:group-expanded-state', this.expandedGroups);
    this.$emit('group-toggle', Object.freeze(event));
  }

  /**
   * A row was expanded or collapsed for tree
   */
  onTreeAction(event: { row: Record<string, unknown> }) {
    const row = event.row;
    const treeTo = optionalGetterForProp(this.treeToRelation);
    const rowIndex = this.rows.findIndex(r => treeTo(r) === treeTo(event.row));
    const status = this.rows[rowIndex].treeStatus;
    if (status === TreeStatus.Collapsed) {
      this.rows[rowIndex].treeStatus = TreeStatus.Expanded;
    }
    if (status === TreeStatus.Expanded) {
      this.rows[rowIndex].treeStatus = TreeStatus.Collapsed;
    }
    this.onRowsChanged(this.rows);
    this.$emit('tree-action', { row, rowIndex });
  }

  onColumnInsert(column: ITableColumn) {
    setColumnDefaults(column);
    if (!this.internalColumns) {
      this.internalColumns = [column];
    } else {
      const key = `${column.prop}${column.name}`;
      const i = this.internalColumns.findIndex(c => `${c.prop}${c.name}` === key);
      if (i >= 0) {
        this.internalColumns[i] = column;
      }
      this.internalColumns.push(column);
    }
    this.onColumnChangeVisible();
  }

  onColumnRemoved(column: ITableColumn) {
    if (!column) {
      return;
    }
    const colIndex = this.internalColumns.findIndex(c => c.name === column.name);
    if (colIndex >= 0) {
      this.internalColumns.splice(colIndex, 1);
    }
    this.onColumnChangeVisible();
  }

  onColumnChangeVisible(column?: ITableColumn) {
    clearTimeout(this.recalculateColumnsTimer);
    this.recalculateColumnsTimer = setTimeout(() => {
      this.recalculateColumns();
    }, 100) as unknown as number;
  }

  /**
   * Toggle the expansion of the row
   */
  toggleExpandDetail(row: Record<string, unknown>) {
    (
      this.bodyComponent as unknown as { toggleExpandDetail: (row: Record<string, unknown>) => void }
    ).toggleExpandDetail(row);
    this.$emit('detail-toggle', {
      type: 'row',
      value: row,
    });
  }

  /**
   * Expand all the rows.
   */
  expandAllDetails() {
    (this.bodyComponent as unknown as { expandAllDetails: () => void }).expandAllDetails();
    this.$emit('detail-toggle', {
      type: 'all',
      value: true,
    });
  }

  /**
   * Collapse all the rows.
   */
  collapseAllDetails() {
    (this.bodyComponent as unknown as { collapseAllDetails: () => void }).collapseAllDetails();
    this.$emit('detail-toggle', {
      type: 'all',
      value: false,
    });
  }

  /**
   * Expand all the group rows.
   */
  expandAllGroups() {
    if (!Array.isArray(this.groupedRows)) {
      return;
    }
    this.groupedRows.forEach(row => {
      this.expandCollapseRow(row, true);
    });
    this.onGroupToggle({
      value: true,
    });
  }

  /**
   * Collapse all the rows.
   */
  collapseAllGroups() {
    if (!Array.isArray(this.groupedRows)) {
      return;
    }
    this.groupedRows.forEach(row => {
      this.expandCollapseRow(row, false);
    });
    this.onGroupToggle({
      value: false,
    });
  }

  /**
   * Is the row visible in the current page
   */
  isRowVisible(row: Record<string, unknown>): boolean {
    return (this.bodyComponent as unknown as { isRowVisible: (row: Record<string, unknown>) => boolean }).isRowVisible(
      row
    );
  }

  onSetHeaderWidth(width: number) {
    this.bodyWidth = width;
  }

  /**
   * Is the group row expanded
   */
  private isGroupExpanded(key: string): boolean {
    return this.expandedGroups[key] ?? true;
  }

  private innerSortRows() {
    const treeFrom = optionalGetterForProp(this.treeFromRelation);
    const treeTo = optionalGetterForProp(this.treeToRelation);
    if (treeFrom && treeTo) {
      // restore rows after tree sorting
      this.internalRows = this.initialRows;
    }
    if (this.externalSorting === false) {
      this.sortInternalRows();
    }
    // auto group by parent on new update
    this.internalRows = groupRowsByParents(
      this.internalRows as Array<{ level: number; treeStatus?: string }>,
      treeFrom,
      treeTo,
      this.internalColumns,
      this.mySorts,
      this.lazyTree
    );
  }

  /**
   * Creates a map with the data grouped by the user choice of grouping index
   *
   * @param originalArray the original array passed via parameter
   * @param groupByIndex  the index of the column to group the data by
   */
  private groupArrayBy(
    originalArray: Record<string, unknown>[],
    groupRowsBy: Array<IGroup>,
    level: number = 0
  ): IGroupedRows[] {
    const groupBy: IGroup = groupRowsBy[level];

    // create a map to hold groups with their corresponding results
    const map = new Map<string, Record<string, string>[]>();

    const getValue = (row: Record<string, string>, groupDescr: IGroup): string => {
      if (groupDescr.valueGetter instanceof Function) {
        return groupDescr.valueGetter(row);
      }
      return deepValueGetter(row, groupDescr.prop) as string;
    };

    const getKey = (row: Record<string, string>): string => {
      let index = 0;
      let key = '';
      while (index <= level) {
        const gr = groupRowsBy[index];
        const value = getValue(row, gr);
        key = [key, value].filter(Boolean).join('^^');
        index++;
      }
      return key;
    };

    const itemsToRemove: Record<string, string>[] = [];
    originalArray.forEach((item: Record<string, string>) => {
      const key = getKey(item);
      // eslint-disable-next-line no-undefined
      if (key !== undefined || key !== null) {
        itemsToRemove.push(item);
        if (!map.has(key)) {
          map.set(key, [item]);
        } else {
          map.get(key).push(item);
        }
      }
    });
    if (level > 0 && itemsToRemove.length) {
      itemsToRemove.forEach(item => {
        const i = originalArray.indexOf(item);
        if (i >= 0) {
          originalArray.splice(i, 1);
        }
      });
    }
    const keysDescr: IKeyDescription = { title: groupBy.title, prop: groupBy.prop };
    // convert map back to a simple array of objects
    const result = Array.from(map, x => this.addGroup(x[0], x[1], level, keysDescr));
    if (Array.isArray(groupRowsBy) && level < groupRowsBy.length - 1) {
      result.forEach(item => {
        item.groups = this.groupArrayBy(item.rows, groupRowsBy, level + 1);
      });
    }
    return result;
  }

  private addGroup(
    key: string,
    value: Record<string, unknown>[],
    level: number,
    keysDescr: IKeyDescription
  ): IGroupedRows {
    const keys = key ? key.toString().split('^^') : null;
    const keysObj: IKeyDescription = {
      title: keysDescr.title,
      prop: keysDescr.prop,
      value: keys?.[level] ?? '',
    };
    if (this.groupExpandedState) {
      const isDefined = this.groupExpandedState[key] === true || this.groupExpandedState[key] === false;
      if (isDefined) {
        this.expandedGroups[key] = this.groupExpandedState[key];
      }
    }
    return {
      key,
      rows: value,
      level,
      keys: keysObj,
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      __expanded: this.isGroupExpanded(key),
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      __checkboxable: this.checkboxable,
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      __isGroup: true,
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      __checkedAll: false,
    };
  }

  private sortInternalRows() {
    if (this.groupedRows) {
      this.groupedRows = this.sortGroupedRows(this.groupedRows);
      this.internalRows = this.processGroupedRows(this.groupedRows) as Array<Record<string, unknown>>;
    } else {
      this.internalRows = sortRows(this.internalRows, this.internalColumns, this.mySorts);
    }
  }

  private sortGroupedRows(groupedRows: IGroupedRows[]): IGroupedRows[] {
    const rows: Array<Record<string, unknown>> = [];
    groupedRows.forEach(gr => {
      /* eslint-disable-next-line @typescript-eslint/naming-convention */
      const row: Record<string, unknown> = { __group: gr };
      row[gr.keys.prop] = gr.keys.value;
      rows.push(row);
      if (gr.groups && gr.groups.length) {
        gr.groups = this.sortGroupedRows(gr.groups);
      }
      if (gr.rows && gr.rows) {
        gr.rows = sortRows(gr.rows, this.internalColumns, this.mySorts);
      }
    });
    const sortedRows = sortRows(rows, this.internalColumns, this.mySorts);
    const result = sortedRows.map(r => r.__group);
    return result as IGroupedRows[];
  }

  private expandCollapseRow(group: IGroupedRows, expand: boolean) {
    group.__expanded = expand;
    this.expandedGroups[group.key] = group.__expanded;
    if (Array.isArray(group.groups)) {
      group.groups.forEach(gr => {
        this.expandCollapseRow(gr, expand);
      });
    }
  }

  private addRow(group: IGroupedRows, rows: Array<IGroupedRows | Record<string, unknown>>) {
    rows.push(group);
    if (group.rows && group.__expanded) {
      group.rows.forEach(r => {
        rows.push(r);
      });
    }
    if (group.groups && group.__expanded) {
      group.groups.forEach(gr => {
        this.addRow(gr, rows);
      });
    }
  }

  private processGroupedRows(groupedRows: IGroupedRows[]): Array<IGroupedRows | Record<string, unknown>> {
    const rows: Array<IGroupedRows | Record<string, unknown>> = [];
    if (groupedRows && groupedRows.length) {
      groupedRows.forEach(g => {
        this.addRow(g, rows);
      });
    }
    return rows;
  }
}
