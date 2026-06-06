import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import DataTableRowWrapperComponent from './body-row-wrapper.component.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

function setupTest() {
  try {
    wrapper = mount(DataTableRowWrapperComponent, {
      sync: false,
      propsData: {
        row: {},
        rowDetail: false,
        expanded: false,
        offsetX: 10,
      },
    });
    component = wrapper.vm;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableRowWrapperComponent', () => {
  beforeEach(() => {
    setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('should have a group header styles', () => {
      const styles = (component as unknown as { groupTitleStyles: Record<string, string | number> }).groupTitleStyles;
      expect(styles).toBeTruthy();
    });
  });
});
