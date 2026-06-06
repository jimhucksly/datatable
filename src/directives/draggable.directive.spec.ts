import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { Vue } from 'vue-property-decorator';
import { directiveOptions } from './draggable.directive';

let wrapper: VueWrapper;
let component: Vue;

async function setupTest() {
  try {
    const cmp = defineComponent({
      name: 'test-fixture-component',
      template: '<div v-dragndrop="{ dragEvent: null, dragModel: column, dragX: false, dragY: false }"></div> ',
      data(): {
        column: unknown;
      } {
        return {
          column: null,
        };
      },
    });
    wrapper = mount(cmp, {
      global: {
        directives: {
          dragndrop: directiveOptions,
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

describe('DraggableDirective', () => {
  beforeEach(async () => {
    await setupTest();
  });

  it('should have a component instance', () => {
    expect(component).toBeTruthy();
  });
});
