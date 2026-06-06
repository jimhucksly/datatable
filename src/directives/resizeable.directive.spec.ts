import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { Vue } from 'vue-class-component';
import { directiveOptions } from './resizeable.directive';

let wrapper: VueWrapper;
let component: Vue;

function setupTest() {
  try {
    const cmp = defineComponent({
      name: 'test-fixture-component',
      template: '<div v-resizeable></div>',
    });
    wrapper = mount(cmp, {
      global: {
        directives: {
          resizeable: directiveOptions,
        },
      },
    });
    component = wrapper.vm;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('ResizeableDirective', () => {
  beforeEach(() => {
    setupTest();
  });

  it('should have a component instance', () => {
    expect(component).toBeTruthy();
  });
});
