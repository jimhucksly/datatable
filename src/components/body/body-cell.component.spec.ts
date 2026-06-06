import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import { ITableColumn } from '@/types/column';
import { setColumnDefaults } from '@/utils/column-helper';
import { numericIndexGetter } from '@/utils/column-prop-getters';
import DataTableBodyCellComponent from './body-cell.component.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest() {
  try {
    wrapper = mount(DataTableBodyCellComponent, {
      sync: false,
      propsData: {
        column: {
          visible: true,
          isTreeColumn: false,
          $$valueGetter: () => 'test',
        },
        rowContext: {
          treeStatus: 'disabled',
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

describe('DataTableBodyCellComponent', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('prop tests', () => {
    it('should get value from zero-index prop', async () => {
      const columns: ITableColumn[] = [{ name: 'First Column', prop: 0 }];
      setColumnDefaults(columns[0]);
      expect(columns[0].$$valueGetter).toBe(numericIndexGetter);

      wrapper.setProps({
        column: columns[0],
        rowContext: {
          row: ['Hello'],
        },
      });
      await component.$nextTick();
      expect((component as unknown as { value: string }).value).toEqual('Hello');
    });
  });
});
