import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import DataTableSelectionComponent from './selection.component.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest() {
  try {
    wrapper = mount(DataTableSelectionComponent, { sync: false });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableSelectionComponent', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });
  });
});
