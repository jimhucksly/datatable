import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { Vue } from 'vue-property-decorator';
import { directiveOptions, IHasLongPressController } from './long-press.directive';

let wrapper: VueWrapper;
let component: Vue;

function setupTest() {
  try {
    const cmp = defineComponent({
      name: 'test-fixture-component',
      template: '<div v-long-press="{ pressModel: {}, pressEnabled: false }"></div> ',
    });
    wrapper = mount(cmp, {
      global: {
        directives: {
          'long-press': directiveOptions,
        },
      },
    });
    component = wrapper.vm;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('LongPressDirective', () => {
  beforeEach(() => {
    setupTest();
  });

  it('should have a component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should have LongPressDirective directive', () => {
    const ctrl = (component.$el as IHasLongPressController).__longpress__;
    expect(ctrl).toBeTruthy();
  });

  it('should have isLongPress set to false', () => {
    const ctrl = (component.$el as IHasLongPressController).__longpress__;
    expect(ctrl.pressEnabled).toBeFalsy();
  });
});
