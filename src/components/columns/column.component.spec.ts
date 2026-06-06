import { mount, VueWrapper } from '@vue/test-utils';
import { DefineComponent } from 'vue';
import { Options, Vue } from 'vue-property-decorator';
import { ITableColumn } from '@/types/column';
import DataTableColumnComponent from './column.component';

let counter = 0;

@Options({
  components: {
    'datatable-column': DataTableColumnComponent,
  },
  name: 'test-fixture-component',
  template: `
    <datatable-column id="t1" />
    <datatable-column id="t2" :name="columnName" />
    <datatable-column id="t3" :visible="visible" />
  `,
})
class TestFixtureComponent extends Vue {
  columnName = '';
  visible = true;

  onColumnInsert(column: ITableColumn) {
    counter++;
  }
  onColumnChangeVisible(column: ITableColumn) {
    //
  }
  onColumnRemoved(column: ITableColumn) {
    //
  }
}

async function setupTest() {
  try {
    counter = 0;
    wrapper = mount(TestFixtureComponent, { sync: false });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

let wrapper: VueWrapper<TestFixtureComponent>;
let component: TestFixtureComponent;

describe('DataTableColumnDirective', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('should be twice called onColumnInsert', () => {
      expect(counter).toEqual(3);
    });
  });

  describe('column #1', () => {
    it('should be found', () => {
      const column = wrapper.findComponent('#t1');
      expect(column).toBeTruthy();
    });

    it('should have undefined inputs by default', () => {
      const column = wrapper.findComponent<DefineComponent>('#t1');
      expect((column.vm as unknown as Record<string, unknown>).name).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).prop).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).frozenRight).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).frozenLeft).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).flexGrow).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).resizeable).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).comparator).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).sortable).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).draggable).toBeUndefined();
      expect((column.vm as unknown as { canAutoResize: boolean }).canAutoResize).toEqual(true);
      expect((column.vm as unknown as Record<string, unknown>).minWidth).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).width).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).maxWidth).toBeUndefined();
      expect((column.vm as unknown as Record<string, unknown>).treeLevelIndent).toBeUndefined();
      expect((column.vm as unknown as { visible: boolean }).visible).toEqual(true);
    });
  });

  describe('column #2', () => {
    it('should be found', () => {
      const column = wrapper.findComponent<DefineComponent>('#t2');
      expect(column).toBeTruthy();
    });

    it('should have the name', async () => {
      const column = wrapper.findComponent<DefineComponent>('#t2');
      component.columnName = 'Column A';
      await component.$nextTick();
      expect((column.vm as unknown as { name: string }).name).toEqual(component.columnName);
    });
  });

  describe('column #3', () => {
    it('props visible shoul be changed', async () => {
      const column = wrapper.findComponent<DefineComponent>('#t3');
      expect(column.vm.visible).toEqual(true);
      component.visible = false;
      await component.$nextTick();
      expect(column.vm.visible).toEqual(false);
    });

    it('notifies of visible changes', async () => {
      const spy = jest.spyOn(component, 'onColumnChangeVisible');
      component.visible = false;
      await component.$nextTick();
      expect(spy).toHaveBeenCalled();
    });
  });
});
