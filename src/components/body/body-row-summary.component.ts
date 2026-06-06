import { Options, Prop, Vue, Watch } from 'vue-property-decorator';
import { IColumnsByPinRecord, IColumnsWidth } from '@/types/column';
import { IRowContext } from '@/types/row-context';
import DataTableBodyRowComponent from './body-row.component.vue';

export interface ISummaryColumn {
  summaryFunc?: (cells: unknown[]) => string;
  cellTemplate?: string;

  prop: string;
  // pipe?: PipeTransform;
  filter?: (...args: Array<unknown>) => string;
}

function defaultSumFunc(cells: number[]): number {
  const cellsWithValues = cells.filter(cell => Boolean(cell));

  if (!cellsWithValues.length) {
    return null;
  }
  if (cellsWithValues.some(cell => typeof cell !== 'number')) {
    return null;
  }
  return cellsWithValues.reduce((res, cell) => res + cell);
}

@Options({
  components: {
    'datatable-body-row': DataTableBodyRowComponent,
  },
  template: `
    <datatable-body-row
      v-if="summaryRow && internalColumns"
      tabindex="-1"
      :columnsByPin="columnsByPin"
      :columnGroupWidths="columnGroupWidths"
      :groupStyles="groupStyles"
      :rowContext="myRowContext"
      :row="summaryRow"
      :slots="mySlotsFunc"
      @activate="onActivate"
    >
    </datatable-body-row>
  `,
})
export default class DataTableSummaryRowComponent extends Vue {
  @Prop() rows: Record<string, unknown>[];
  @Prop() columns: ISummaryColumn[];
  @Prop() rowHeight: number;
  @Prop() offsetX: number;
  @Prop() innerWidth: number;

  @Prop() columnsByPin: IColumnsByPinRecord[];
  @Prop() columnGroupWidths: IColumnsWidth;
  @Prop() groupStyles: Record<string, string | number>;
  @Prop() groupClass: string;

  internalColumns: ISummaryColumn[] = [];
  summaryRow: Record<string, unknown> = {};
  myRowContext: IRowContext = null;

  @Watch('rows', { immediate: true }) onRowsChanged() {
    this.onChanges();
  }

  @Watch('columns') onColumnsChanged() {
    this.onChanges();
  }

  onChanges() {
    if (!this.columns || !this.rows) {
      return;
    }
    this.updateValues();
  }

  onActivate(event: Event) {
    this.$emit('summary-activate', event, this.summaryRow);
  }

  private updateValues() {
    this.summaryRow = {};

    this.columns.forEach(col => {
      const cellsFromSingleColumn = this.rows.map(row => row[col.prop]);
      const sumFunc = this.getSummaryFunction(col);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.summaryRow[col.prop] = col.filter
        ? col.filter(sumFunc(cellsFromSingleColumn))
        : sumFunc(cellsFromSingleColumn);
    });
    this.myRowContext = {
      row: this.summaryRow,
      rowIndex: -1,
      expanded: false,
      checkboxable: false,
      isChecked: false,
      isSelected: false,
      rowHeight: this.rowHeight,
      treeStatus: null,
      treeLevel: null,
    };
  }

  private getSummaryFunction(column: ISummaryColumn): (a: unknown[]) => unknown {
    if (!column.summaryFunc) {
      return defaultSumFunc;
    }
    return column.summaryFunc;
  }
}
