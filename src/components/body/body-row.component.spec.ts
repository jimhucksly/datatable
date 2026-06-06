import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import DataTableBodyRowComponent from './body-row.component.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

function setupTest() {
  try {
    wrapper = mount(DataTableBodyRowComponent, {
      propsData: {
        columnGroupWidths: {
          left: 0,
          center: 0,
          right: 0,
          total: 100,
        },
      },
    });
    component = wrapper.vm;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableBodyRowComponent', () => {
  beforeEach(() => {
    setupTest();
  });

  it('should have a component instance', () => {
    expect(component).toBeDefined();
  });
});
