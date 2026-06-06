/* eslint-disable max-classes-per-file */
import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance, DefineComponent } from 'vue';
import { Options, Vue } from 'vue-property-decorator';
import { directiveOptions as directiveOptionsD } from '@/directives/draggable.directive';
import { directiveOptions as directiveOptionsLP } from '@/directives/long-press.directive';
import { directiveOptions as directiveOptionsR } from '@/directives/resizeable.directive';
import { directiveOptions as directiveOptionsVO } from '@/directives/visibility.directive';
import { ITableColumn } from '@/types/column';
import { ISortPropDir } from '@/types/sort-prop-dir';
import { delay } from '@/utils/delay';
import DataTableBodyComponent from './body/body.vue';
import DatatableComponent from './datatable.component.vue';
import DataTableFooterComponent from './footer/footer.vue';
import DataTableHeaderComponent from './header/header.vue';

interface IDatatable {
  rows: Array<Record<string, unknown>>;
  columns: ITableColumn[];
  offset: number;
  sorts: ISortPropDir[];
  innerOffset: number;
  columnTwoProp: string;
  groupRowsBy?: Array<{ prop: string; title: string }>;
  externalPaging?: boolean;
  add: () => void;
}

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest(cmpValue: unknown) {
  try {
    wrapper = mount(cmpValue as DefineComponent, {
      sync: false,
      global: {
        components: {
          'datatable-header': DataTableHeaderComponent,
          'datatable-body': DataTableBodyComponent,
          'datatable-footer': DataTableFooterComponent,
        },
        directives: {
          'long-press': directiveOptionsLP,
          resizeable: directiveOptionsR,
          'visibility-observer': directiveOptionsVO,
          dragndrop: directiveOptionsD,
        },
      },
    });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

@Options({
  name: 'TestFixtureComponent',
  components: {
    datatable: DatatableComponent,
  },
  template: `
    <div>
      <datatable
        :group-expansion-default="true"
        :group-row-height="26"
        :columns="columns"
        :rows="rows"
        :sorts="sorts"
        :count="rows.length"
        :external-paging="externalPaging"
        :group-rows-by="groupRowsBy"
        :row-height="26"
        @row-count="emitRowCount($event)"
      ></datatable>
    </div>
  `,
})
class TestFixtureComponent extends Vue {
  columns: ITableColumn[] = [];
  rows: Record<string, unknown>[] = [];
  sorts: ISortPropDir[] = [];
  offset? = 0;
  groupRowsBy: Array<string> = null;
  externalPaging = false;

  emitRowCount(e: unknown) {
    this.$emit('row-count', e);
  }
}

@Options({
  name: 'TestFixtureComponentWithCustomTemplates',
  components: {
    datatable: DatatableComponent,
  },
  template: `
    <datatable :rows="rows" :columns="columns" :sorts="sorts">
      <template #cell-header="scope">
        <span>{{ scope.column.name + '-custom' }}</span>
      </template>
      <template #cell-header:append="scope">
        <button class="custom-button" @click="headerButtonClick"></button>
      </template>
      <template #cell="scope">
        <span v-if="scope.column.prop === 'id'">{{ scope.row.id }}</span>
        <span>{{ scope.value }}</span>
      </template>
    </datatable>
  `,
})
class TestFixtureComponentWithCustomTemplates extends Vue {
  columns: ITableColumn[] = [];
  rows: Record<string, unknown>[] = [];
  sorts: ISortPropDir[] = [];

  headerButtonClick() {
    this.$emit('header-button-click');
  }
}

@Options({
  name: 'TestFixtureComponentWithAddRow',
  components: {
    datatable: DatatableComponent,
  },
  template: `
    <div>
      <datatable :columns="columns" :rows="rows"></datatable>
    </div>
  `,
})
class TestFixtureComponentWithAddRow extends Vue {
  columns: ITableColumn[] = [{ name: 'id' }, { name: 'user' }];
  rows: Record<string, unknown>[] = [
    { id: 5, user: 'Bob' },
    { id: 20, user: 'Sam' },
    { id: 12, user: 'Joe' },
  ];

  add() {
    this.rows.push({ id: 55, user: 'Piter' });
  }
}

describe('DatatableComponent', () => {
  beforeEach(async () => {
    await setupTest(TestFixtureComponent);
  });

  it('should to display columns', async () => {
    const datatable = wrapper.findComponent<DefineComponent>('.b-datatable');
    expect(typeof datatable.vm.recalculateColumns).toEqual('function');
    const spy = jest.spyOn(datatable.vm as unknown as { recalculateColumns: () => void }, 'recalculateColumns');
    const columns = [
      {
        prop: 'birthDate',
        name: 'BirthDate',
      },
    ];
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);
    expect(spy).toHaveBeenCalled();
  });

  it('should sort date values', async () => {
    const initialRows = [
      { birthDate: new Date(1980, 11, 1) },
      { birthDate: new Date(1978, 8, 5) },
      { birthDate: new Date(1995, 4, 3) },
    ];

    const columns = [
      {
        prop: 'birthDate',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `birthDate` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('1978');
    expect(textContent({ row: 2, column: 1 })).toContain('1980');
    expect(textContent({ row: 3, column: 1 })).toContain('1995');

    // sort by `birthDate` descending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('1995');
    expect(textContent({ row: 2, column: 1 })).toContain('1980');
    expect(textContent({ row: 3, column: 1 })).toContain('1978');
  });

  it('should sort number values', async () => {
    const initialRows = [{ id: 5 }, { id: 20 }, { id: 12 }];

    const columns = [
      {
        prop: 'id',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `id` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('5');
    expect(textContent({ row: 2, column: 1 })).toContain('12');
    expect(textContent({ row: 3, column: 1 })).toContain('20');

    // sort by `id` descending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('20');
    expect(textContent({ row: 2, column: 1 })).toContain('12');
    expect(textContent({ row: 3, column: 1 })).toContain('5');
  });

  it('should sort string values', async () => {
    const initialRows = [{ product: 'Computers' }, { product: 'Bikes' }, { product: 'Smartphones' }];

    const columns = [
      {
        prop: 'product',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `product` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('Bikes');
    expect(textContent({ row: 2, column: 1 })).toContain('Computers');
    expect(textContent({ row: 3, column: 1 })).toContain('Smartphones');

    // sort by `product` descending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('Smartphones');
    expect(textContent({ row: 2, column: 1 })).toContain('Computers');
    expect(textContent({ row: 3, column: 1 })).toContain('Bikes');
  });

  it('should sort with a custom comparator', async () => {
    const initialRows = [{ product: 'Smartphones' }, { product: 'Cars' }, { product: 'Bikes' }];

    const columns = [
      {
        prop: 'product',
        comparator: (productA: string, productB: string) => productA.length - productB.length,
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `product` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('Cars');
    expect(textContent({ row: 2, column: 1 })).toContain('Bikes');
    expect(textContent({ row: 3, column: 1 })).toContain('Smartphones');

    // sort by `product` descending
    sortBy({ column: 1 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('Smartphones');
    expect(textContent({ row: 2, column: 1 })).toContain('Bikes');
    expect(textContent({ row: 3, column: 1 })).toContain('Cars');
  });

  it('should sort using a stable sorting algorithm', async () => {
    const initialRows = [
      { name: 'sed', state: 'CA' },
      { name: 'dolor', state: 'NY' },
      { name: 'ipsum', state: 'NY' },
      { name: 'foo', state: 'CA' },
      { name: 'bar', state: 'CA' },
      { name: 'cat', state: 'CA' },
      { name: 'sit', state: 'CA' },
      { name: 'man', state: 'CA' },
      { name: 'lorem', state: 'NY' },
      { name: 'amet', state: 'NY' },
      { name: 'maecennas', state: 'NY' },
    ];

    /**
     * assume the following sort operations take place on `initialRows`:
     * 1) initialRows.sort(byLengthOfNameProperty) (Ascending)
     * 2) initialRows.sort(byState)                (Descending)
     *
     * in browsers that do not natively implement stable sort (such as Chrome),
     * the result could be:
     *
     *  [
     *    { name: 'maecennas',  state: 'NY' },
     *    { name: 'amet',       state: 'NY' },
     *    { name: 'dolor',      state: 'NY' },
     *    { name: 'ipsum',      state: 'NY' },
     *    { name: 'lorem',      state: 'NY' },
     *    { name: 'sed',        state: 'CA' },
     *    { name: 'cat',        state: 'CA' },
     *    { name: 'man',        state: 'CA' },
     *    { name: 'foo',        state: 'CA' },
     *    { name: 'bar',        state: 'CA' },
     *    { name: 'sit',        state: 'CA' }
     *  ]
     *
     * in browsers that natively implement stable sort the result is guaranteed
     * to be:
     *
     *  [
     *    { name: 'amet',       state: 'NY' },
     *    { name: 'dolor',      state: 'NY' },
     *    { name: 'ipsum',      state: 'NY' },
     *    { name: 'lorem',      state: 'NY' },
     *    { name: 'maecennas',  state: 'NY' },
     *    { name: 'sed',        state: 'CA' },
     *    { name: 'foo',        state: 'CA' },
     *    { name: 'bar',        state: 'CA' },
     *    { name: 'cat',        state: 'CA' },
     *    { name: 'sit',        state: 'CA' },
     *    { name: 'man',        state: 'CA' }
     *  ]
     */

    const columns = [
      {
        prop: 'name',
        comparator: (nameA: string, nameB: string) => nameA.length - nameB.length,
      },
      {
        prop: 'state',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `name` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    // sort by `state` descending
    sortBy({ column: 2 });
    await component.$nextTick();

    sortBy({ column: 2 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('amet');
    expect(textContent({ row: 2, column: 1 })).toContain('dolor');
    expect(textContent({ row: 3, column: 1 })).toContain('ipsum');
    expect(textContent({ row: 4, column: 1 })).toContain('lorem');
    expect(textContent({ row: 5, column: 1 })).toContain('maecennas');
    expect(textContent({ row: 6, column: 1 })).toContain('sed');
    expect(textContent({ row: 7, column: 1 })).toContain('foo');
    expect(textContent({ row: 8, column: 1 })).toContain('bar');
    expect(textContent({ row: 9, column: 1 })).toContain('cat');
    expect(textContent({ row: 10, column: 1 })).toContain('sit');
    expect(textContent({ row: 11, column: 1 })).toContain('man');
  });

  it('should sort correctly after push events', async () => {
    const initialRows = [
      { name: 'sed', state: 'CA' },
      { name: 'dolor', state: 'NY' },
      { name: 'ipsum', state: 'NY' },
      { name: 'foo', state: 'CA' },
      { name: 'bar', state: 'CA' },
      { name: 'cat', state: 'CA' },
      { name: 'sit', state: 'CA' },
      { name: 'man', state: 'CA' },
      { name: 'lorem', state: 'NY' },
      { name: 'amet', state: 'NY' },
      { name: 'maecennas', state: 'NY' },
    ];
    const additionalRows = [...initialRows];

    const columns = [
      {
        prop: 'name',
        comparator: (nameA: string, nameB: string) => nameA.length - nameB.length,
      },
      {
        prop: 'state',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    await delay(1000);

    // sort by `state` descending
    sortBy({ column: 2 });
    await component.$nextTick();

    // sort by `state` ascending
    sortBy({ column: 2 });
    await component.$nextTick();

    // sort by `name` ascending
    sortBy({ column: 1 });

    // mimic new `rows` data pushed to component
    (component as unknown as IDatatable).rows = additionalRows;
    await delay(1000);

    // sort by `state` descending
    sortBy({ column: 2 });
    await component.$nextTick();

    // sort by `state` ascending
    sortBy({ column: 2 });
    await component.$nextTick();

    expect(textContent({ row: 1, column: 1 })).toContain('amet');
    expect(textContent({ row: 2, column: 1 })).toContain('dolor');
    expect(textContent({ row: 3, column: 1 })).toContain('ipsum');
    expect(textContent({ row: 4, column: 1 })).toContain('lorem');
    expect(textContent({ row: 5, column: 1 })).toContain('maecennas');
    expect(textContent({ row: 6, column: 1 })).toContain('sed');
    expect(textContent({ row: 7, column: 1 })).toContain('foo');
    expect(textContent({ row: 8, column: 1 })).toContain('bar');
    expect(textContent({ row: 9, column: 1 })).toContain('cat');
    expect(textContent({ row: 10, column: 1 })).toContain('sit');
    expect(textContent({ row: 11, column: 1 })).toContain('man');
  });

  it('should set offset to 0 when sorting by a column', async () => {
    const initialRows = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const columns = [
      {
        prop: 'id',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = columns;
    (component as unknown as IDatatable).offset = 1;
    await delay(1000);

    // sort by `id` descending
    sortBy({ column: 1 });
    await component.$nextTick();

    // sort by `id` ascending
    sortBy({ column: 1 });
    await component.$nextTick();

    const datatable = wrapper.findComponent<DefineComponent>('.b-datatable');
    expect((datatable.vm as unknown as IDatatable).innerOffset).toBe(0);
  });

  it('should support array data', async () => {
    const initialRows = [['Hello', 123]];
    const columns = [{ prop: 0 }, { prop: 1 }];

    (component as unknown as IDatatable).columns = columns;
    (component as unknown as IDatatable).rows = initialRows as unknown as Array<Record<string, unknown>>;
    await delay(1000);

    expect(textContent({ row: 1, column: 1 })).toContain('Hello');
    expect(textContent({ row: 1, column: 2 })).toContain('123');
  });

  it('should correctly calculate rows count with externalPager', async () => {
    const initialRows = [
      { name: 'sed', state: 'CA' },
      { name: 'dolor', state: 'NY' },
      { name: 'ipsum', state: 'NY' },
      { name: 'foo', state: 'CA' },
      { name: 'bar', state: 'CA' },
      { name: 'cat', state: 'CA' },
      { name: 'sit', state: 'CA' },
      { name: 'man', state: 'CA' },
      { name: 'lorem', state: 'NY' },
      { name: 'amet', state: 'NY' },
      { name: 'maecennas', state: 'NY' },
    ];
    const columns1 = [{ prop: 'name' }, { prop: 'state' }];
    const groupBy = [{ prop: 'state', title: 'State' }];
    const uniqueGroupValues = initialRows.reduce((acc, row) => {
      const newValue = row[groupBy[0].prop as keyof typeof row];
      if (acc.includes(newValue)) {
        return acc;
      }
      return [...acc, newValue];
    }, []);

    (component as unknown as IDatatable).columns = columns1;
    (component as unknown as IDatatable).rows = initialRows as unknown as Array<Record<string, unknown>>;
    (component as unknown as IDatatable).groupRowsBy = groupBy;
    (component as unknown as IDatatable).externalPaging = true;
    await delay(1000);

    expect(wrapper.emitted()).toHaveProperty('row-count');
    expect(wrapper.emitted('row-count')[0][0]).toEqual(initialRows.length + uniqueGroupValues.length);
  });
});

// //////////////////////////////////////////////////////////////////////////////
// slots tests
// //////////////////////////////////////////////////////////////////////////////
describe('DatatableComponent With Custom Templates', () => {
  beforeEach(async () => {
    await setupTest(TestFixtureComponentWithCustomTemplates);
  });

  it('should sort when the table is initially rendered if `sorts` are provided', async () => {
    const initialRows = [
      { id: 5, user: 'Bob' },
      { id: 20, user: 'Sam' },
      { id: 12, user: 'Joe' },
    ];

    const sorts = [
      {
        prop: 'id',
        dir: 'asc',
      },
    ];

    const initialColumns = [
      {
        name: 'id',
      },
      {
        name: 'user',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = initialColumns;
    (component as unknown as IDatatable).sorts = sorts as ISortPropDir[];
    await delay(1000);

    expect(textContent({ row: 1, column: 1 })).toContain('5');
    expect(textContent({ row: 1, column: 2 })).toContain('Bob');
    expect(textContent({ row: 2, column: 1 })).toContain('12');
    expect(textContent({ row: 2, column: 2 })).toContain('Joe');
    expect(textContent({ row: 3, column: 1 })).toContain('20');
    expect(textContent({ row: 3, column: 2 })).toContain('Sam');
  });

  it('should reflect changes to input column.prop', async () => {
    const initialRows = [
      { id: 5, user: 'Sam', age: 35 },
      { id: 20, user: 'Bob', age: 50 },
      { id: 12, user: 'Joe', age: 60 },
    ];

    const initialColumns = [
      {
        name: 'id',
      },
      {
        name: 'user',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = initialColumns;
    await delay(1000);

    expect(textContent({ row: 1, column: 2 })).toContain('Sam');
    expect(textContent({ row: 2, column: 2 })).toContain('Bob');
    expect(textContent({ row: 3, column: 2 })).toContain('Joe');

    /**
     * switch to displaying `age` column as the second column in the table
     */
    (component as unknown as IDatatable).columns[1].prop = 'age';
    await delay(3000);

    expect(textContent({ row: 1, column: 2 })).toContain('35');
    expect(textContent({ row: 2, column: 2 })).toContain('50');
    expect(textContent({ row: 3, column: 2 })).toContain('60');
  });

  it('should be render custom template for header cell', async () => {
    const initialRows = [
      { id: 5, user: 'Sam', age: 35 },
      { id: 20, user: 'Bob', age: 50 },
      { id: 12, user: 'Joe', age: 60 },
    ];

    const initialColumns = [
      {
        name: 'id',
      },
      {
        name: 'user',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = initialColumns;
    await delay(1000);

    expect(textContent({ row: 1, column: 2 }, true)).toContain('user-custom');
  });

  it('should display a header append template', async () => {
    const initialRows = [
      { id: 5, user: 'Sam', age: 35 },
      { id: 20, user: 'Bob', age: 50 },
      { id: 12, user: 'Joe', age: 60 },
    ];

    const initialColumns = [
      {
        name: 'id',
      },
      {
        name: 'user',
      },
    ];

    (component as unknown as IDatatable).rows = initialRows;
    (component as unknown as IDatatable).columns = initialColumns;
    await delay(1000);

    const headerCells = wrapper.findAllComponents<DefineComponent>('.datatable-header-cell');
    const headerCell = headerCells[0];
    const button = headerCell.find('button.custom-button');
    button.trigger('click');
    expect(wrapper.emitted('header-button-click')).toBeDefined();
  });
});

describe('DatatbleComponent with Add Row', () => {
  beforeEach(async () => {
    await setupTest(TestFixtureComponentWithAddRow);
  });

  it('display a new added row', async () => {
    const datatable = wrapper.findComponent<DefineComponent>('.b-datatable');
    const body = datatable.findComponent<DefineComponent>('.datatable-body');
    (component as unknown as IDatatable).add();
    await delay(1000);
    const rows = Array.from(body.vm.$el.querySelectorAll('.datatable-row-wrapper'));
    expect(rows.length).toEqual(4);
  });
});

/**
 * mimics the act of a user clicking a column to sort it
 */
function sortBy({ column }: { column: number }) {
  const columnIndex = column - 1;
  const headerCells = wrapper.findAllComponents<DefineComponent>('.datatable-header-cell');
  const headerCell = headerCells[columnIndex];
  const sortBtn = headerCell.vm.$el.querySelector('.sort-btn');
  sortBtn.click();
}

/**
 * test helper function to return text content of a cell within the
 * body of the datatable component
 */
function textContent({ row, column }: { row: number; column: number }, header: boolean = false) {
  const [rowIndex, columnIndex] = [row - 1, column - 1];
  if (header) {
    const headerCells = wrapper.findAllComponents<DefineComponent>('.datatable-header-cell');
    const headerCell = headerCells[columnIndex];
    const label: HTMLElement = headerCell.vm.$el.querySelector('.datatable-header-cell-label > span');
    return label.textContent;
  }
  const bodyRows = wrapper.findAllComponents<DefineComponent>('.datatable-row-wrapper');
  const bodyRow = bodyRows[rowIndex];
  const rowCols = bodyRow.findAllComponents<DefineComponent>('.datatable-body-cell');
  const rowCol = rowCols[columnIndex];
  const label: HTMLElement = rowCol.vm.$el.querySelector('.datatable-body-cell-label > span');
  return label.textContent;
}
