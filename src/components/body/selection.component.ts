import { Prop, Vue, Watch } from 'vue-property-decorator';
import DataTableBodyComponent from '@/components/body/body.component';
import ScrollerComponent from '@/components/body/scroller.component';
import { CheckMode } from '@/types/check';
import { IGroup, IGroupedRows } from '@/types/group';
import { Keys } from '@/types/keys';
import { ActivateType, ISelectionContext, SelectionType } from '@/types/selection';
import { deepValueGetter } from '@/utils/column-prop-getters';

export default class DataTableSelectionComponent extends Vue {
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) rows: Array<Record<string, unknown>>;
  @Prop() groupRowsBy: Array<IGroup>;
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) selected: Array<Record<string, unknown>>;
  @Prop({ type: Array, default: (): Array<Record<string, unknown>> => [] }) checked: Array<Record<string, unknown>>;
  @Prop() selectEnabled: boolean;
  @Prop() selectionType: SelectionType;
  @Prop() checkMode: CheckMode;
  @Prop() rowIdentity: (row: Record<string, unknown>) => string | number;
  @Prop() selectCheck: () => void;
  @Prop() scroller: ScrollerComponent;
  @Prop() pageSize: number;
  @Prop() bodyHeight: number;
  @Prop() beforeSelectRowCheck: (
    newRow: Record<string, unknown>,
    oldSelected: Array<Record<string, unknown>>
  ) => boolean | Promise<boolean>;

  prevIndex: number;

  throttle: {
    evName: string;
    timeout: number;
  } = {
    evName: '',
    timeout: null,
  };

  @Watch('checkedAll', { immediate: true }) onCheckedAll(value: boolean) {
    this.throttling('check-all', value);
  }

  get groupedRows(): Array<IGroupedRows> {
    return (this.rows as Array<unknown> as Array<IGroupedRows>).filter(r => r && r.__isGroup);
  }

  get checkedAll(): boolean {
    if (this.groupedRows?.length) {
      return !this.groupedRows.map(gr => Number(gr.__checkedAll)).includes(0);
    }
    return this.checked.length === this.rows.length;
  }

  async selectRow(event: KeyboardEvent | MouseEvent, index: number, row: Record<string, unknown>): Promise<void> {
    if (!this.selectEnabled) {
      return;
    }
    let doSelect: boolean | Promise<boolean> = true;
    if (typeof this.beforeSelectRowCheck === 'function') {
      doSelect = this.beforeSelectRowCheck(this.rows[index], this.selected);
    }
    if (doSelect instanceof Promise) {
      doSelect = await doSelect;
    }
    if (!doSelect) {
      return;
    }
    const chkbox = this.selectionType === SelectionType.checkbox && this.checkMode === CheckMode.checkIsSelect;
    const multi = this.selectionType === SelectionType.multi;
    const multiClick = this.selectionType === SelectionType.multiClick;
    let selected: Record<string, unknown>[] = [];
    if (multi || chkbox || multiClick) {
      if (event.shiftKey) {
        selected = this.selectRowsBetween([], this.rows, index, this.prevIndex);
      } else if (event.ctrlKey || event.metaKey || multiClick || chkbox) {
        selected = this.selectRows([...this.selected], row);
      } else {
        selected = this.selectRows([], row);
      }
    } else {
      selected = this.selectRows([], row);
    }
    this.prevIndex = index;
    if (typeof this.selectCheck === 'function') {
      selected = selected.filter(this.selectCheck.bind(this) as () => void);
    }

    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
    this.throttling('select', {
      selected,
      index,
    });
  }

  // checkRow(event: KeyboardEvent | MouseEvent, index: number, row: Record<string, unknown>) {
  //   if (!this.selectEnabled) {
  //     return;
  //   }
  //   let checked: Record<string, unknown>[] = [];
  //   if (event.shiftKey) {
  //     checked = this.selectRowsBetween([], this.rows, index, this.prevIndex);
  //   } else {
  //     checked = this.selectRows([...this.checked], row);
  //   }
  //   this.prevIndex = index;

  //   if (typeof this.selectCheck === 'function') {
  //     checked = checked.filter(this.selectCheck.bind(this) as () => void);
  //   }

  //   this.checked.splice(0, this.checked.length);
  //   this.checked.push(...checked);

  //   this.throttling('check', {
  //     checked,
  //   });
  // }

  checkRow(row: Record<string, unknown>, toggle?: boolean, flag?: boolean) {
    let checked = this.selectRows([...this.checked], row, toggle, flag);
    if (typeof this.selectCheck === 'function') {
      checked = checked.filter(this.selectCheck.bind(this) as () => void);
    }
    return checked;
  }

  postCheckRow(checked: Array<Record<string, unknown>>) {
    this.checked.splice(0, this.checked.length);
    this.checked.push(...checked);
    this.throttling('check', {
      checked,
    });
  }

  onActivate(model: ISelectionContext, index: number) {
    const { type, event, row, column } = model;
    if (type === ActivateType.checkbox && this.checkMode === CheckMode.checkNoSelect) {
      this.postCheckRow(this.checkRow(model.row));
      return;
    }
    let select = type === ActivateType.click || type === ActivateType.dblclick;
    if (this.checkMode === CheckMode.checkNoSelect && column?.checkboxable) {
      select = false;
    }
    if (select) {
      this.selectRow(event, index, row);
    } else if (type === ActivateType.keydown) {
      if ((<KeyboardEvent>event).keyCode === (Keys.return as number)) {
        this.selectRow(event, index, row);
      } else {
        this.onKeyboardFocus(model);
      }
    }
    this.$emit('activate', model);
  }

  onGroupActivate(flag: boolean, rows: Array<Record<string, unknown>>) {
    if (Array.isArray(rows) && rows.length > 0) {
      let checked: Record<string, unknown>[] = [...this.checked];
      for (const r of rows) {
        const arr = this.selectRows(checked, r, false, flag);
        if (!arr) {
          continue;
        }
        checked = arr;
      }
      this.postCheckRow(checked);
    }
  }

  onKeyboardFocus(model: ISelectionContext) {
    const { keyCode } = <KeyboardEvent>model.event;
    const shouldFocus = [Keys.up, Keys.down, Keys.right, Keys.left, Keys.pageUp, Keys.pageDown].includes(keyCode);

    if (shouldFocus) {
      const isCellSelection = this.selectionType === SelectionType.cell;

      if (!model.cellElement || !isCellSelection) {
        this.focusRow(model, keyCode);
      } else if (isCellSelection) {
        this.focusCell(model.cellElement, model.rowElement, keyCode, model.cellIndex);
      }
    }
  }

  focusRow(model: ISelectionContext, keyCode: number) {
    const nextRowElement = this.getPrevNextRow(model.rowElement, keyCode);
    let index = 0;
    if (keyCode === (Keys.up as number)) {
      if (model.rowIndex - 1 < 0) {
        return;
      }
      index = model.rowIndex - 1;
    } else if (keyCode === (Keys.down as number)) {
      if (model.rowIndex + 1 >= this.rows.length) {
        return;
      }
      index = model.rowIndex + 1;
    } else if (keyCode === (Keys.pageUp as number)) {
      index = model.rowIndex - this.pageSize;
      index = index < 0 ? 0 : index;
    } else if (keyCode === (Keys.pageDown as number)) {
      index = model.rowIndex + this.pageSize;
      index = index >= this.rows.length ? this.rows.length - 1 : index;
    }
    const { offsetY, height } = (this.$parent as DataTableBodyComponent).getRowOffsetY(index + 1);
    if (!height) {
      if (nextRowElement) {
        (nextRowElement as HTMLElement).focus();
      }
      return;
    }
    let scrolled = false;
    let h = 0;
    if ([Keys.down, Keys.pageDown].includes(keyCode)) {
      h = offsetY + height - (Number(this.$parent.$el.scrollTop) + Number(this.bodyHeight));
    } else if ([Keys.up, Keys.pageUp].includes(keyCode)) {
      h = offsetY - height - this.$parent.$el.scrollTop;
    }
    if (h > 0 && [Keys.down, Keys.pageDown].includes(keyCode)) {
      this.scroller.incOffset(h);
      // scrolled = model.rowIndex === this.rows.length - 2 ? false : true;
    } else if (h < 0 && [Keys.up, Keys.pageUp].includes(keyCode)) {
      this.scroller.incOffset(h);
      scrolled = model.rowIndex !== 1;
    } else if (h === 0 && [Keys.up, Keys.pageUp].includes(keyCode) && [0, 1, 2].includes(model.rowIndex)) {
      this.scroller.setOffset(h);
      // scrolled = true;
    }
    if (scrolled || [Keys.left, Keys.right].includes(keyCode)) {
      (model.rowElement as HTMLElement).focus();
    } else if (nextRowElement) {
      (nextRowElement as HTMLElement).focus();
    }
  }

  getPrevNextRowElement(rowElement: Element, keyCode: number): Element {
    if (rowElement) {
      let focusElement: Element;
      if (keyCode === (Keys.up as number)) {
        focusElement = rowElement.previousElementSibling;
      } else if (keyCode === (Keys.down as number)) {
        focusElement = rowElement.nextElementSibling;
      }
      return focusElement;
    }
  }

  getPrevNextRow(rowElement: Element, keyCode: number): Element {
    const parentElement = rowElement.parentElement;

    if (parentElement) {
      let focusElement: Element;
      if (keyCode === (Keys.up as number)) {
        focusElement = parentElement.previousElementSibling;
      } else if (keyCode === (Keys.down as number)) {
        focusElement = parentElement.nextElementSibling;
      }

      if (focusElement && focusElement.children.length) {
        return focusElement.children[0];
      }
    }
  }

  focusCell(cellElement: Element, rowElement: Element, keyCode: number, cellIndex: number) {
    let nextCellElement: Element;

    if (keyCode === (Keys.left as number)) {
      nextCellElement = cellElement.previousElementSibling;
    } else if (keyCode === (Keys.right as number)) {
      nextCellElement = cellElement.nextElementSibling;
    } else if (keyCode === (Keys.up as number) || keyCode === (Keys.down as number)) {
      const nextRowElement = this.getPrevNextRow(rowElement, keyCode);
      if (nextRowElement) {
        const children = nextRowElement.getElementsByClassName('datatable-body-cell');
        if (children.length) {
          nextCellElement = children[cellIndex];
        }
      }
    }

    if (nextCellElement) {
      (nextCellElement as HTMLElement).focus();
    }
  }

  getRowSelected(row: Record<string, unknown>): boolean {
    return this.getRowSelectedIdx(row, this.selected) > -1;
  }

  getRowChecked(row: Record<string, unknown>): boolean {
    const arr = this.checkMode === CheckMode.checkIsSelect ? this.selected : this.checked;
    return this.getRowSelectedIdx(row, arr) > -1;
  }

  getRowSelectedIdx(row: Record<string, unknown>, selected: Record<string, unknown>[]): number {
    if (!selected || !selected.length) {
      return -1;
    }
    const rowId = this.rowIdentity(row);
    return selected.findIndex(r => {
      const id = this.rowIdentity(r);
      return id === rowId;
    });
  }

  getRowIndex(row: Record<string, unknown>) {
    const rowId = this.rowIdentity(row);
    return this.rows.findIndex(r => {
      const id = this.rowIdentity(r);
      return id === rowId;
    });
  }

  getGroupsByRow(row: Record<string, unknown>): Array<IGroupedRows> {
    const props = (this.groupRowsBy || []).map(gr => gr.prop);
    const values = props.map(p => deepValueGetter(row, p));
    return this.groupedRows.filter(gr => values.includes(gr.keys.value));
  }

  private selectRowsBetween(
    selected: Record<string, unknown>[],
    rows: Record<string, unknown>[],
    index: number,
    prevIndex: number
  ): Record<string, unknown>[] {
    const reverse = index < prevIndex;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const greater = i >= prevIndex && i <= index;
      const lesser = i <= prevIndex && i >= index;
      let range = { start: 0, end: 0 };
      if (reverse) {
        range = {
          start: index,
          end: prevIndex,
        };
      } else {
        range = {
          start: prevIndex,
          end: index + 1,
        };
      }
      if ((reverse && lesser) || (!reverse && greater)) {
        // if in the positive range to be added to `selected`, and
        // not already in the selected array, add it
        if (i >= range.start && i <= range.end) {
          selected.push(row);
        }
      }
    }
    return selected;
  }

  private selectRows(
    selected: Array<Record<string, unknown>>,
    row: Record<string, unknown>,
    /**
     * if row is selected need exclude row from selections
     */
    toggleMode: boolean = true,
    /**
     * only toggleMode is false
     */
    flag: boolean = false
  ): Array<Record<string, unknown>> {
    let selectedIdx: Array<string | number> = [];

    const groups = this.getGroupsByRow(row);
    const selectedIndex = this.getRowSelectedIdx(row, selected);

    const checkGroup = (gr: IGroupedRows) => {
      if (gr.rows && gr.rows.length) {
        const filter = gr.rows.filter(r => !selectedIdx.includes(this.rowIdentity(r)));
        gr.__checkedAll = filter.length === 0;
      }
    };

    const checkGroups = (_groups: Array<IGroupedRows>) => {
      for (const gr of _groups) {
        if (gr.groups && gr.groups.length) {
          gr.__checkedAll = checkGroups(gr.groups);
        }
        if (gr.rows && gr.rows.length) {
          checkGroup(gr);
        }
      }
      return !_groups.map(gr => Number(gr.__checkedAll)).includes(0);
    };

    const add = () => {
      selected.push(row);
      selectedIdx = selected.map(r => this.rowIdentity(r));
      checkGroups(groups);
      return selected;
    };

    const remove = () => {
      selected.splice(selectedIndex, 1);
      selectedIdx = selected.map(r => this.rowIdentity(r));
      checkGroups(groups);
      return selected;
    };
    if (toggleMode) {
      return selectedIndex === -1 ? add() : remove();
    }
    if (flag) {
      if (selectedIndex === -1) {
        return add();
      }
      selectedIdx = selected.map(r => this.rowIdentity(r));
      checkGroups(groups);
      return selected;
    }
    if (!flag) {
      if (selectedIndex > -1) {
        return remove();
      }
      selectedIdx = selected.map(r => this.rowIdentity(r));
      checkGroups(groups);
      return selected;
    }
  }

  private throttling(evName: string, evData: unknown) {
    if (evName === this.throttle.evName && this.throttle.timeout) {
      clearTimeout(this.throttle.timeout);
    }
    this.throttle.evName = evName;
    this.throttle.timeout = setTimeout(() => {
      this.$emit(evName, evData);
    }, 300) as unknown as number;
  }
}
