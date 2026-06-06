import { nextTick } from 'vue';
import { Options, Prop, Vue, Watch } from 'vue-property-decorator';
import { CheckMode } from '@/types/check';
import { IColumnsByPinRecord, IColumnsWidth, ITableColumn } from '@/types/column';
import { IDragndrop } from '@/types/dragndrop';
import { IGroup, IGroupedRows } from '@/types/group';
import { RowColorize, RowIdentity } from '@/types/row';
import { IRowContext } from '@/types/row-context';
import { ISelectionContext, SelectionType } from '@/types/selection';
import { TreeStatus } from '@/types/tree-status';
import { RowHeightCache } from '@/utils/row-height-cache';
import { translateXY } from '@/utils/translate';
import { isVNodeEmpty } from '@/utils/vnode';
import GroupHeader from './body-group-header.component.vue';
import Row from './body-row.component.vue';
import RowDetail from './body-row-detail.component';
import SummaryRow from './body-row-summary.component';
import RowWrapper from './body-row-wrapper.component.vue';
import ScrollerComponent from './scroller.component';
import Scroller from './scroller.component.vue';
import DataTableSelectionComponent from './selection.component';
import Selection from './selection.component.vue';

@Options({
  components: {
    'datatable-selection': Selection,
    'datatable-scroller': Scroller,
    'datatable-summary-row': SummaryRow,
    'datatable-row-wrapper': RowWrapper,
    'datatable-body-row': Row,
    'datatable-group-header': GroupHeader,
    'datatable-row-detail': RowDetail,
  },
})
export default class DataTableBodyComponent extends Vue {
  @Prop() scrollbarWidth: number;
  @Prop() scrollbarV: boolean;
  @Prop() scrollbarH: boolean;
  @Prop() loadingIndicator: boolean;
  @Prop() externalPaging: boolean;
  @Prop() rowHeight: number;
  @Prop() groupRowsBy: Array<IGroup>;
  @Prop() groupRowHeight: number;
  @Prop() groupHeaderStyles: Record<string, string | number>;
  @Prop() groupHeaderClasses: string | Array<string>;
  @Prop() selectionType: SelectionType;
  @Prop() checkMode: CheckMode;
  @Prop({ type: Boolean, default: false }) checkboxable: boolean;
  @Prop({ type: Array, default: () => [] as Array<Record<string, unknown>> }) selected: Array<Record<string, unknown>>;
  @Prop({ type: Array, default: () => [] as Array<Record<string, unknown>> }) checked: Array<Record<string, unknown>>;
  @Prop({ type: Function, default: (): RowIdentity => () => null }) rowIdentity: RowIdentity;
  @Prop() rowDetail: boolean;
  @Prop() rowDetailHeight: number | string | ((row?: Record<string, unknown>, index?: number) => number);
  @Prop() selectCheck: () => void;
  @Prop() displayCheck: (row: Record<string, unknown>, column?: ITableColumn, value?: unknown) => boolean;
  @Prop() trackByProp: string;
  @Prop() rowClass: (row: Record<string, unknown>) => string;
  @Prop() groupExpansionDefault: boolean;
  @Prop() innerWidth: number;
  @Prop() virtualization: boolean;
  @Prop() summaryRow: boolean;
  @Prop() summaryPosition: string;
  @Prop() summaryHeight: number | string;
  @Prop() pageSize: number;
  @Prop() limit: number;
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) rows: Array<Record<string, unknown>>;
  @Prop({ type: Array, default: (): Array<ITableColumn> => [] }) columns: Array<ITableColumn>;
  @Prop() offset: number;
  @Prop({ default: 0 }) rowCount: number;
  @Prop({ default: 0 }) bodyHeight: number;
  @Prop({ type: [Number, String], default: null }) minItemHeight: number | string;
  @Prop({ type: [String], default: 'height' }) heightField: string;
  @Prop() renderTracking: boolean;
  @Prop() columnGroupWidths: IColumnsWidth;
  @Prop() columnsByPin: IColumnsByPinRecord[];
  @Prop() beforeSelectRowCheck: (
    newRow: Record<string, unknown>,
    oldSelected: Record<string, unknown>[]
  ) => boolean | Promise<boolean>;
  @Prop({
    default: {
      draggable: false,
      dragstart: (): unknown => null,
      drop: (): unknown => null,
    },
  })
  dragData: IDragndrop;
  @Prop({ type: Function, default: (): RowColorize => null }) colorize: RowColorize;

  scroller: ScrollerComponent = null;
  selector: DataTableSelectionComponent = null;
  rowHeightsCache: RowHeightCache = new RowHeightCache();
  offsetY = 0;
  myOffset = 0;
  myOffsetX = 0;
  indexes: { first: number; last: number } = { first: 0, last: 0 };
  rowIndexes = new Map<Record<string, unknown>, number>();
  rowExpansions = new Map<Record<string, unknown> | IGroupedRows, boolean>();
  myBodyHeight: string = null;

  groupStyles = {
    left: {},
    center: {},
    right: {},
  };

  contextMenu: {
    event: PointerEvent;
    col: ITableColumn;
    row: IRowContext;
    show: boolean;
  } = {
    event: null,
    col: null,
    row: null,
    show: false,
  };
  contextMenuPosition: {
    x: number;
    y: number;
  } = {
    x: 0,
    y: 0,
  };

  rowTrackingFn: (row: Record<string, unknown>) => string | number;
  lastFirst: number;
  lastLast: number;
  lastRowCount: number;
  rowsChanged: boolean;
  rowContexts: Array<IRowContext> = [];

  isDrag = false;

  // private readonly renderCounter = 0;
  // private readonly renderId: number = null;
  private pageRowCount = 0;

  @Watch('pageSize') onPageSize() {
    this.recalcLayout();
  }

  @Watch('rows', { immediate: true }) async onRowsChanged(): Promise<void> {
    this.rowsChanged = true;
    this.rowExpansions.clear();
    const updateOffset =
      this.rows && this.rows.length && ((this.offset && !this.offsetY) || (!this.offset && this.offsetY));
    if (updateOffset) {
      this.updateOffsetY(this.offset, true);
      await nextTick();
      if (this.offset && !this.offsetY) {
        // if offsetY wasn't set, try one more time
        this.updateOffsetY(this.offset, true);
        await nextTick();
      }
    }
    this.lastFirst = -1;
    this.recalcLayout();
  }

  @Watch('selected', { deep: true }) async onSelectedChanged(): Promise<void> {
    await nextTick();
    this.rowContexts.forEach(rowContext => {
      rowContext.isSelected = this.isSelect(rowContext.row);
      rowContext.isChecked = this.isChecked(rowContext.row);
    });
  }

  @Watch('checked', { deep: true }) async onCheckedChanged(): Promise<void> {
    await nextTick();
    this.rowContexts.forEach(rowContext => {
      rowContext.isChecked = this.isChecked(rowContext.row);
    });
  }

  @Watch('columns', { immediate: true }) onColumnsChanged() {
    this.buildStylesByGroup();
  }

  @Watch('offset', { immediate: true }) onOffsetChanged() {
    this.myOffset = this.offset;
  }

  // @Watch('offsetX', { immediate: true }) onOffsetXChanged() {
  //   this.myOffsetX = this.offsetX;
  // }

  @Watch('myOffsetX') onMyOffsetXChanged() {
    this.buildStylesByGroup();
  }

  @Watch('columnGroupWidths') onColumnGroupWidthsChanged() {
    this.buildStylesByGroup();
  }

  @Watch('innerWidth') onInnerWidthChanged() {
    this.buildStylesByGroup();
  }

  @Watch('myOffset') onMyOffsetChanged() {
    if (this.limit) {
      this.recalcLayout();
    }
  }

  @Watch('rowCount') onRowCountChanged() {
    this.recalcLayout();
  }

  @Watch('bodyHeight', { immediate: true }) onBodyHeightChanged() {
    this.myBodyHeight = this.bodyHeight.toString();
    if (this.bodyHeight === -1) {
      this.myBodyHeight = '0px';
      return;
    }
    if (this.scrollbarV) {
      this.myBodyHeight = this.hasRows ? this.myBodyHeight + 'px' : 'auto';
    } else {
      this.myBodyHeight = 'auto';
    }
    this.pageRowCount = 0;
    this.recalcLayout();
  }

  /**
   * Creates an instance of DataTableBodyComponent.
   */
  created() {
    // declare fn here so we can get access to the `this` property
    this.rowTrackingFn = (row: Record<string, unknown>): string | number => {
      const idx = this.getRowIndex(row);
      if (this.trackByProp) {
        return `${idx}-${this.trackByProp}`;
      }
      return idx;
    };
  }

  mounted() {
    this.selector = this.$refs.selector as DataTableSelectionComponent;
    this.scroller = this.$refs.scroller as ScrollerComponent;
  }

  onContextMenu(event: { event: PointerEvent; col: ITableColumn; row: IRowContext }) {
    this.contextMenu = {
      ...event,
      show: false,
    };
    const onClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const parent = target.closest('.datatable-body-cell-context-menu');
      if (!parent) {
        this.contextMenu = null;
      }
      window.removeEventListener('click', onClick);
    };
    window.addEventListener('click', onClick);
    this.getContextMenuPosition();
  }

  getContextMenuPosition() {
    this.$nextTick(() => {
      const el = document.querySelector('.datatable-body-cell-context-menu');
      const w = el.clientWidth;
      const h = el.clientHeight;
      const rect = (this.$el as HTMLElement).getBoundingClientRect();
      let x = this.contextMenu.event.clientX - rect.x + 20 + this.myOffsetX;
      let y = this.contextMenu.event.clientY - rect.y + 7 + this.offsetY;
      if (x > rect.width - w) {
        x = x - w;
      }
      if (y > rect.height - h) {
        y = y - h;
      }
      this.contextMenuPosition.x = x;
      this.contextMenuPosition.y = y;
      this.contextMenu.show = true;
    });
  }

  onCloseContextMenu() {
    this.contextMenu = null;
    this.contextMenuPosition = {
      x: 0,
      y: 0,
    };
  }

  reset() {
    this.myOffsetX = 0;
    this.offsetY = 0;
  }

  /**
   * Updates the Y offset given a new offset.
   */
  updateOffsetY(offset?: number, fromPager: boolean = false): number {
    // scroller is missing on empty table
    if (!this.scroller) {
      return;
    }
    let offsetY = 0;
    if (this.scrollbarV && this.virtualization && offset) {
      // First get the row Index that we need to move to.
      const rowIndex = this.pageSize * offset;
      if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
        offsetY = this.rowHeightsCache.query(rowIndex - 1);
      } else {
        offsetY = rowIndex * this.rowHeight;
      }
    } else if (this.scrollbarV && !this.virtualization) {
      offsetY = 0;
    }
    if (offset && !offsetY) {
      return 0;
    }
    this.scroller.setOffset(offsetY || 0, fromPager);
    return offsetY || 0;
  }

  onScrollerWidthChanged() {
    this.buildStylesByGroup();
  }

  onScrollSetup(event: { scrollYPos: number; scrollXPos: number }) {
    this.myOffsetX = event.scrollXPos;
    this.offsetY = event.scrollYPos;
  }

  /**
   * Body was scrolled, this is mainly useful for
   * when a user is server-side pagination via virtual scroll.
   */
  onBodyScroll(event: { direction: string; scrollYPos: number; scrollXPos: number; fromPager: boolean }) {
    this.contextMenu = null;
    const scrollYPos: number = event.scrollYPos;
    const scrollXPos: number = event.scrollXPos;
    /**
     * if scroll change, trigger update
     * this is mainly used for header cell positions
     */
    if (this.offsetY !== scrollYPos || this.myOffsetX !== scrollXPos) {
      this.$emit('scroll', {
        offsetY: scrollYPos,
        offsetX: scrollXPos,
      });
    }
    this.offsetY = scrollYPos;
    this.myOffsetX = scrollXPos;
    nextTick(() => {
      this.updateIndexes(event.direction);
      this.updatePage(event.direction, event.fromPager);
      this.updateRows();
    });
  }

  /**
   * Updates the page given a direction.
   */
  updatePage(direction: string, fromPager: boolean) {
    let offset = this.indexes.first / this.pageSize;

    if (fromPager) {
      offset = Math.ceil(offset);
    } else if (direction === 'up') {
      offset = Math.ceil(offset);
    } else if (direction === 'down') {
      offset = Math.floor(offset);
    }

    if (!fromPager && ['up', 'down'].includes(direction) && !isNaN(offset)) {
      this.$emit('page', { offset });
    }
  }

  /**
   * Updates the rows in the view port
   */
  updateRows(force: boolean = false) {
    const { first, last } = this.indexes;
    if (!force && !this.rowsChanged && this.lastFirst === first && this.lastLast === last) {
      return;
    }
    this.rowsChanged = false;
    if (this.rows?.length) {
      this.lastFirst = first;
      this.lastLast = last;
    }
    this.lastRowCount = this.rowCount;
    let rowIndex = first;
    let idx = 0;
    this.rowIndexes.clear();

    const temp: Array<IRowContext> = [];

    let group;
    while (rowIndex < last && rowIndex < this.rowCount) {
      const row = this.rows[rowIndex];
      if (row) {
        if (row.__isGroup) {
          group = row;
        }
        this.rowIndexes.set(row, rowIndex);
        temp[idx] = {
          row,
          rowIndex,
          rowHeight: this.rowHeight,
          isSelected: this.isSelect(row),
          isChecked: this.isChecked(row),
          expanded: this.getRowExpanded(row),
          checkboxable: this.checkboxable,
          treeStatus: this.treeStatus(row),
          treeLevel: this.treeLevel(row),
          group: group as unknown as IGroupedRows,
        };
        idx++;
      }
      rowIndex++;
    }
    this.rowContexts = temp;
  }

  /**
   * @param group the group with all rows
   */
  getGroupHeight(group: { value: Array<Record<string, unknown>> }): number {
    let rowHeight = 0;
    if (Array.isArray(group.value)) {
      for (const value of group.value) {
        rowHeight += this.getRowAndDetailHeight(value);
      }
    }
    return rowHeight;
  }

  /**
   * Calculate row height based on the expanded state of the row.
   */
  getRowAndDetailHeight(row: Record<string, unknown>): number {
    let rowHeight = this.rowHeight;
    const expanded = this.rowExpansions.get(row);

    // Adding detail row height if its expanded.
    if (expanded) {
      rowHeight += this.getDetailRowHeight(row);
    }

    return rowHeight;
  }

  /**
   * Get the height of the detail row.
   */
  getDetailRowHeight = (row?: Record<string, unknown>, index?: number): number => {
    if (!this.rowDetail) {
      return 0;
    }
    const rowHeight = this.rowDetailHeight || this.rowHeight || 50;
    return typeof rowHeight === 'function' ? rowHeight(row, index) : Number(rowHeight);
  };

  /**
   * Calculates the styles for the row so that the rows can be moved in 2D space
   * during virtual scroll inside the DOM.   In the below case the Y position is
   * manipulated.   As an example, if the height of row 0 is 30 px and row 1 is
   * 100 px then following styles are generated:
   *
   * transform: translate3d(0px, 0px, 0px);    ->  row0
   * transform: translate3d(0px, 30px, 0px);   ->  row1
   * transform: translate3d(0px, 130px, 0px);  ->  row2
   *
   * Row heights have to be calculated based on the row heights cache as we wont
   * be able to determine which row is of what height before hand.  In the above
   * case the positionY of the translate3d for row2 would be the sum of all the
   * heights of the rows before it (i.e. row0 and row1).
   *
   * @param {*} row The row that needs to be placed in the 2D space.
   * @returns {*} Returns the CSS3 style to be applied
   *
   * @memberOf DataTableBodyComponent
   */
  getRowWrapperStyles(rowContext: IRowContext): Record<string, string> {
    if (!rowContext || !this.columnGroupWidths) {
      return null;
    }
    const styles: Record<string, string> = {};
    // only add styles for the group if there is a group
    if (this.groupRowsBy) {
      styles['width'] = `${this.columnGroupWidths.total}px`;
    }

    if (this.scrollbarV && this.virtualization) {
      let idx = 0;
      idx = rowContext.rowIndex;
      let pos = 0;
      let height = 50;
      if (!this.isUseRowHeightCache) {
        height = this.rowHeight;
        pos = idx * height;
      } else {
        pos = this.rowHeightsCache.query(idx - 1);
      }
      translateXY(styles, 0, pos);
    }
    return styles;
  }

  getRowOffsetY(index: number): { offsetY: number; height: number } {
    if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
      let result = this.rowHeightsCache.queryWithHeight(index);
      if (!result) {
        result = { height: 0, offsetY: 0 };
      }
      return result;
    }
    return {
      offsetY: this.rowHeight * index,
      height: this.rowHeight,
    };
  }

  /**
   * Calculate bottom summary row offset for scrollbar mode.
   * For more information about cache and offset calculation
   * see description for `getRowsStyles` method
   *
   * @returns {*} Returns the CSS3 style to be applied
   *
   * @memberOf DataTableBodyComponent
   */
  getBottomSummaryRowStyles(): Record<string, string> {
    if (!this.scrollbarV || !this.rows || !this.rows.length) {
      return null;
    }

    const styles = { position: 'absolute' };
    let pos = 0;
    if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
      pos = this.rowHeightsCache.query(this.rows.length - 1);
    } else {
      pos = this.rowHeight * (this.rowCount - 1);
    }

    translateXY(styles, 0, pos);

    return styles;
  }

  getRowClass(row: Record<string, unknown>): Array<string | Record<string, boolean>> {
    const result: Array<string | Record<string, boolean>> = [];
    if (this.rowClass instanceof Function) {
      result.push(this.rowClass(row));
    }
    if (this.colorize instanceof Function) {
      const type = this.colorize(row);
      if (type === 'warning') {
        result.push('datatable-row-warning');
      }
      if (type === 'error') {
        result.push('datatable-row-error');
      }
    }
    return result;
  }

  /**
   * Updates the index of the rows in the viewport
   */
  updateIndexes(direction?: string) {
    let first = 0;
    let last = 0;

    if (this.scrollbarV && !this.limit) {
      if (this.virtualization) {
        // Calculation of the first and last indexes will be based on where the
        // scrollY position would be at.  The last index would be the one
        // that shows up inside the view port the last.
        const height = this.bodyHeight;
        if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
          first = this.rowHeightsCache.getRowIndex(this.offsetY);
          last = this.rowHeightsCache.getRowIndex(height + this.offsetY) + 1;
        } else {
          first = Math.floor(this.offsetY / this.rowHeight);
          if (!this.pageRowCount) {
            last = Math.ceil((height + this.offsetY + this.rowHeight) / this.rowHeight);
            this.pageRowCount = last - first;
          } else {
            last = first + this.pageRowCount;
          }
        }
      } else {
        // If virtual rows are not needed
        // We render all in one go
        first = 0;
        last = this.rowCount;
      }
    } else {
      // The server is handling paging and will pass an array that begins with the
      // element at a specified offset.  first should always be 0 with external paging.
      if (!this.externalPaging) {
        first = Math.max(this.myOffset * this.pageSize, 0);
      }
      last = Math.min(first + this.pageSize, this.rowCount);
    }
    this.indexes = { first, last };
  }

  /**
   * Refreshes the full Row Height cache.  Should be used
   * when the entire row array state has changed.
   */
  refreshRowHeightCache() {
    if (!this.isUseRowHeightCache) {
      return;
    }
    // clear the previous row height cache if already present.
    // this is useful during sorts, filters where the state of the
    // rows array is changed.
    this.rowHeightsCache.clearCache();

    // Initialize the tree only if there are rows inside the tree.
    if (this.rows && this.rows.length) {
      this.rowHeightsCache.initCache({
        rows: this.rows,
        rowHeight: this.rowHeight,
        rowDetailHeight: this.getDetailRowHeight,
        groupRowHeight: this.groupRowHeight,
        externalVirtual: this.scrollbarV && this.externalPaging,
        rowCount: this.rowCount,
        rowIndexes: this.rowIndexes,
        rowExpansions: this.rowExpansions,
      });
    }
  }

  /**
   * Gets the index for the view port
   */
  getAdjustedViewPortIndex(): number {
    // Capture the row index of the first row that is visible on the viewport.
    // If the scroll bar is just below the row which is highlighted then make that as the
    // first index.
    const viewPortFirstRowIndex = this.indexes.first;

    let offsetScroll;
    if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
      offsetScroll = this.rowHeightsCache.query(viewPortFirstRowIndex);
      return offsetScroll <= this.offsetY ? Math.max(0, viewPortFirstRowIndex - 1) : viewPortFirstRowIndex;
    }
    offsetScroll = this.rowHeight * viewPortFirstRowIndex;
    return offsetScroll <= this.offsetY ? Math.max(0, viewPortFirstRowIndex - 1) : viewPortFirstRowIndex;
    // return viewPortFirstRowIndex;
  }

  /**
   * Toggle the Expansion of the row i.e. if the row is expanded then it will
   * collapse and vice versa.   Note that the expanded status is stored as
   * a part of the row object itself as we have to preserve the expanded row
   * status in case of sorting and filtering of the row set.
   */
  toggleRowExpansion(rowContext: IRowContext): boolean {
    // Capture the row index of the first row that is visible on the viewport.
    // const viewPortFirstRowIndex = this.getAdjustedViewPortIndex();
    let expanded = rowContext.expanded;

    // If the rowDetailHeight is auto --> only in case of non-virtualized scroll
    if (this.isUseRowHeightCache) {
      const rowDetailHeight = this.getDetailRowHeight(rowContext.row) * (expanded ? -1 : 1);
      this.rowHeightsCache.update(rowContext.rowIndex, rowDetailHeight);
    }
    // Update the toggled row and update thive nevere heights in the cache.
    expanded = !expanded;
    this.rowExpansions.set(rowContext.row, expanded);

    this.$emit('detail-toggle', {
      rows: [rowContext.row],
      currentIndex: rowContext.rowIndex, // viewPortFirstRowIndex
    });
    return Boolean(expanded);
  }

  /**
   * Expand/Collapse all the rows no matter what their state is.
   */
  toggleAllRows(expanded: boolean) {
    // clear prev expansions
    this.rowExpansions.clear();

    const rowExpanded = Boolean(expanded);

    // Capture the row index of the first row that is visible on the viewport.
    const viewPortFirstRowIndex = this.getAdjustedViewPortIndex();

    for (const row of this.rows) {
      this.rowExpansions.set(row, rowExpanded);
    }

    if (this.scrollbarV) {
      // Refresh the full row heights cache since every row was affected.
      this.recalcLayout();
    }

    // Emit all rows that have been expanded.
    this.$emit('detail-toggle', {
      rows: this.rows,
      currentIndex: viewPortFirstRowIndex,
    });
  }

  onGroupToggle($event: { value: Record<string, unknown> }) {
    this.$emit('group-toggle', $event);
  }

  onGroupSelect(event: boolean, rowContext: IRowContext) {
    const row = rowContext.row;
    if (!row) {
      return;
    }
    const groups = row.groups as IGroupedRows;
    if (Array.isArray(groups) && groups.length > 0) {
      for (const g of groups) {
        const context: IRowContext = {
          group: g,
          row: {
            rows: g.rows,
          },
          isChecked: false,
          isSelected: false,
          rowHeight: rowContext.rowHeight,
          rowIndex: rowContext.rowIndex,
          treeStatus: rowContext.treeStatus,
          treeLevel: rowContext.treeLevel,
          expanded: rowContext.expanded,
          checkboxable: rowContext.checkboxable,
        };
        this.onGroupSelect(event, context);
      }
      return;
    }

    const rows = row.rows;
    if (Array.isArray(rows) && rows.length > 0 && this.selector) {
      this.selector.onGroupActivate(event, rows);
    }
  }

  onCheck(rowContext: IRowContext) {
    if (this.selector) {
      this.selector.checkRow(rowContext.row, false, true);
    }
  }

  onCheckedAll(flag: boolean) {
    if (this.selector) {
      const groups = this.rowContexts.filter(r => r.row.__isGroup && r.row.level === 0);
      if (groups.length) {
        for (const gr of groups) {
          this.onGroupSelect(flag, gr);
        }
      } else {
        this.selector.onGroupActivate(flag, this.rows);
      }
    }
  }

  /**
   * Recalculates the table
   */
  recalcLayout() {
    this.refreshRowHeightCache();
    this.updateIndexes();
    this.updateRows();
  }

  /**
   * Tracks the column
   */
  columnTrackingFn(index: number, column: ITableColumn): string {
    return column.$$id;
  }

  initExpansions(group: IGroupedRows) {
    this.rowExpansions.set(group, true);
    if (group.groups) {
      for (const gr of group.groups) {
        this.initExpansions(gr);
      }
    }
  }

  /**
   * Returns if the row was expanded and set default row expansion when row expansion is empty
   */
  getRowExpanded(row: Record<string, unknown>): boolean {
    if (!this.rowDetail) {
      return false;
    }
    const expanded = Boolean(this.rowExpansions.get(row));
    return expanded;
  }

  /**
   * Gets the row index given a row
   */
  getRowIndex(row: Record<string, unknown>): number {
    return row ? this.rowIndexes.get(row) || 0 : 0;
  }

  onTreeAction(event: { row: Record<string, unknown> }) {
    this.$emit('tree-action', event);
  }

  isSelect(row: Record<string, unknown>): boolean {
    if (!this.selectEnabled) {
      return false;
    }
    return this.selector
      ? (this.selector as unknown as { getRowSelected: (row: Record<string, unknown>) => boolean }).getRowSelected(row)
      : false;
  }

  isChecked(row: Record<string, unknown>): boolean {
    if (!this.checkEnabled) {
      return false;
    }
    return this.selector ? this.selector.getRowChecked(row) : false;
  }

  onActivate(model: ISelectionContext, index: number) {
    if (this.selector) {
      this.selector.onActivate(model, this.indexes.first + index);
    }
  }

  onRowRendered(row: Record<string, unknown>) {
    // if (this.renderCounter === 0) {
    //   // eslint-disable-next-line no-console
    //   console.time('render');
    // }
    // this.renderCounter++;
    // const counter = this.renderCounter;
    // clearTimeout(this.renderId);
    // this.renderId = setTimeout(() => this.checkRenderFinish(counter), 100) as unknown as number;
  }

  checkRenderFinish(counter: number) {
    // if (counter === this.renderCounter) {
    //   // eslint-disable-next-line no-console
    //   console.timeEnd('render');
    //   this.renderCounter = 0;
    //   this.$emit('rendered');
    // } else {
    //   counter = this.renderCounter;
    //   clearTimeout(this.renderId);
    //   this.renderId = setTimeout(() => this.checkRenderFinish(counter), 100) as unknown as number;
    // }
  }

  buildStylesByGroup() {
    if (!this.columnGroupWidths) {
      return;
    }
    this.contextMenu = null;
    const { left, center, right } = this.calcGroupStyles();
    this.groupStyles = {
      left,
      center,
      right,
    };
  }

  calcGroupStyles(): Record<keyof IColumnsWidth, Record<string, string>> {
    if (!this.columnGroupWidths) {
      return null;
    }
    const result: Record<string, Record<string, string>> = {
      left: {},
      center: {},
      right: {},
    };

    for (const key of ['left', 'center', 'right']) {
      const styles = {
        // width: `${this.columnGroupWidths.total}px`,
      };
      switch (key) {
        case 'left':
          translateXY(styles, 'var(--row-left-translate-x)', 0);
          break;
        case 'right':
          translateXY(styles, 'var(--row-right-translate-x)', 0);
          break;
      }
      result[key] = styles;
    }
    return result;
  }

  getGroupStyles(colGroup: { type: 'left' | 'center' | 'right' }): Record<string, string | number> {
    if (!this.columnGroupWidths) {
      return null;
    }
    if (colGroup && colGroup.type) {
      return this.groupStyles[colGroup.type];
    }
    return {
      width: `${this.columnGroupWidths.total}px`,
    };
  }

  treeStatus(row: Record<string, unknown>): TreeStatus {
    if (!row) {
      return null;
    }
    const status = row.treeStatus as TreeStatus;
    return status;
  }

  treeLevel(row: Record<string, unknown>): number {
    if (!row) {
      return null;
    }
    const level = row.level as number;
    return level;
  }

  isRowVisible(row: Record<string, unknown>): boolean {
    const rowContext = this.rowContexts.find(c => c.row === row);
    if (!rowContext) {
      return false;
    }
    let rowOffsetY;
    if (this.isUseRowHeightCache || typeof this.rowHeight === 'function') {
      rowOffsetY = this.rowHeightsCache.query(rowContext.rowIndex);
    } else {
      rowOffsetY = this.rowHeight * rowContext.rowIndex;
    }
    return rowOffsetY >= this.offsetY && rowOffsetY <= this.offsetY + this.bodyHeight;
  }

  onCellFocus($event: Event) {
    // eslint-disable-next-line no-console
    console.log('onCellFocus($event)');
  }

  /**
   * Toggle the expansion of the row
   */
  toggleExpandDetail(row: Record<string, unknown>) {
    const rowContext = this.rowContexts.find(c => c.row === row);
    if (!rowContext) {
      throw new Error('row context is not found');
    }
    rowContext.expanded = this.toggleRowExpansion(rowContext);
    this.updateIndexes();
    this.updateRows(true);
    this.$emit('detail-toggle', {
      type: 'row',
      value: row,
    });
  }

  /**
   * Expand all the rows.
   */
  expandAllDetails() {
    this.toggleAllRows(true);
    this.$emit('detail-toggle', {
      type: 'all',
      value: true,
    });
  }

  /**
   * Collapse all the rows.
   */
  collapseAllDetails() {
    this.toggleAllRows(false);
    this.$emit('detail-toggle', {
      type: 'all',
      value: false,
    });
  }

  onDragStart(e: DragEvent, rowContext: IRowContext) {
    if (!this.dragData.draggable) {
      return;
    }
    if (this.dragData && this.dragData.canDrag instanceof Function) {
      const canDrag = this.dragData.canDrag(rowContext.row);
      if (canDrag === false) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    this.isDrag = true;
    rowContext.dragging = true;
    if (this.dragData && this.dragData.dragstart instanceof Function) {
      this.dragData.dragstart(e, rowContext.row);
    }
  }

  onDrop(e: DragEvent, rowContext: IRowContext) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.dragData.draggable) {
      return;
    }
    rowContext.dragover = false;
    if (this.dragData && this.dragData.drop instanceof Function) {
      if (this.dragData.canDrop instanceof Function) {
        const canDrop = this.dragData.canDrop(rowContext.row);
        if (canDrop === false) {
          return;
        }
      }
      this.dragData.drop(e, rowContext.row);
    }
  }

  onDragEnter(e: DragEvent, rowContext: IRowContext) {
    e.preventDefault();
    if (!this.dragData.draggable) {
      return;
    }
    this.isDrag = true;
    if (this.dragData.canDrop instanceof Function) {
      const canDrop = this.dragData.canDrop(rowContext.row);
      if (canDrop === false) {
        return;
      }
    }
    if (rowContext.dragging) {
      return;
    }
    rowContext.dragover = true;
  }

  onDragOver(e: DragEvent, rowContext: IRowContext) {
    e.preventDefault();
    if (!this.dragData.draggable) {
      return;
    }
    if (this.dragData.canDrop instanceof Function) {
      const canDrop = this.dragData.canDrop(rowContext.row);
      if (canDrop === false) {
        return;
      }
    }
    this.isDrag = true;
    if (rowContext.dragging) {
      return;
    }
    rowContext.dragover = true;
  }

  onDragLeave(e: DragEvent, rowContext: IRowContext) {
    e.preventDefault();
    this.isDrag = false;
    rowContext.dragover = false;
  }

  onDragEnd(e: DragEvent, rowContext: IRowContext) {
    e.preventDefault();
    if (!this.dragData.draggable) {
      return;
    }
    this.isDrag = false;
    rowContext.dragging = false;
    rowContext.dragover = false;
  }

  get bodyWidth(): string {
    if (this.scrollbarH && this.innerWidth) {
      return `${this.innerWidth}px`;
    }
    return '100%';
  }

  get styles(): Record<string, string> {
    return {
      width: this.bodyWidth,
      height: this.myBodyHeight ? this.myBodyHeight : 'auto',
      'overflow-anchor': 'auto',
      contain: 'content',
    };
  }

  /**
   * Returns if selection is enabled.
   */
  get selectEnabled(): boolean {
    return Boolean(this.selectionType);
  }

  get checkEnabled(): boolean {
    return this.checkMode === CheckMode.checkNoSelect || this.selectionType === SelectionType.checkbox;
  }

  get isUseRowHeightCache(): boolean {
    if (typeof this.rowHeight === 'function' || this.rowDetailHeight || this.groupRowsBy) {
      return true;
    }
    return false;
  }

  get fixedRowHeight(): boolean {
    if (this.rowHeight && typeof this.rowHeight === 'number') {
      return true;
    }
    return false;
  }

  /**
   * Property that would calculate the height of scroll bar
   * based on the row heights cache for virtual scroll and virtualization. Other scenarios
   * calculate scroll height automatically (as height will be undefined).
   */
  get scrollHeight(): number | undefined {
    if (this.scrollbarV && this.virtualization && this.rowCount) {
      if (!this.isUseRowHeightCache) {
        const height = this.rowHeight;
        return height * this.rowCount;
      }
      return this.rowHeightsCache.query(this.rowCount - 1);
    }
    if (!this.rowCount) {
      return 0;
    }
  }

  get scrollWidth(): string {
    return this.columnGroupWidths ? this.columnGroupWidths.total.toString() : 'auto';
  }

  get hasRows(): boolean {
    return this.rows?.length > 0;
  }

  get isEmpty(): boolean {
    return !this.hasRows && !this.loadingIndicator;
  }

  get minBodyWidth(): string {
    return this.columnGroupWidths?.total ? this.columnGroupWidths?.total + 'px' : '100%';
  }

  get hasColumnsFrozen(): { left: boolean; right: boolean } {
    return {
      left: this.columns.some(c => c.frozenLeft),
      right: this.columns.some(c => c.frozenRight),
    };
  }

  get slotContextMenuPassed() {
    if (this.$slots['context-menu']) {
      return !isVNodeEmpty(this.$slots['context-menu']());
    }
  }
}
