import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { Vue } from 'vue-property-decorator';
import { delay } from '@/utils/delay';
import { directiveOptions } from './visibility.directive';

let wrapper: VueWrapper<Vue>;
let component: Vue;

async function setupTest() {
  try {
    const cmp = defineComponent({
      name: 'test-fixture-component',
      template: `
        <div id="test" v-visibility-observer="{ on: visibilityCheck }" @visible="onVisible" style="width: 100px; height: 100px;"></div>
      `,
      data() {
        return {
          visibilityCheck: true,
          isOnVisibleCalled: false,
        };
      },
      methods: {
        onVisible() {
          this.isOnVisibleCalled = true;
        },
      },
    });
    wrapper = mount(cmp, {
      global: {
        directives: {
          'visibility-observer': directiveOptions,
        },
      },
    });
    component = wrapper.vm;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 500 });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 500 });
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('VisibilityDirective', () => {
  beforeEach(async () => {
    await setupTest();
  });

  it('should have a component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should have VisibilityDirective directive', async () => {
    await delay(1100);
    expect(component.$el.classList.contains('visible')).toBeTruthy();
    expect((component as unknown as { isOnVisibleCalled: boolean }).isOnVisibleCalled).toBeTruthy();
  });
});
