import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import DataTableHeaderCellComponent from './header-cell.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest() {
  try {
    wrapper = mount(DataTableHeaderCellComponent, {
      sync: false,
      propsData: {
        column: {},
      },
    });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableHeaderCellComponent', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });
  });
});
