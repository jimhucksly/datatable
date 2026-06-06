import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import { directiveOptions as directiveOptionsD } from '@/directives/draggable.directive';
import { directiveOptions as directiveOptionsLP } from '@/directives/long-press.directive';
import { directiveOptions as directiveOptionsR } from '@/directives/resizeable.directive';
import { directiveOptions as directiveOptionsVO } from '@/directives/visibility.directive';
import { columnsByPinArr } from '@/utils/column';
import DataTableHeaderComponent from './header.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest() {
  try {
    wrapper = mount(DataTableHeaderComponent, {
      sync: false,
      global: {
        directives: {
          'long-press': directiveOptionsLP,
          resizeable: directiveOptionsR,
          'visibility-observer': directiveOptionsVO,
          dragndrop: directiveOptionsD,
        },
      },
    });
    await wrapper.setProps({
      columnsByPin: columnsByPinArr({
        left: [],
        center: [
          {
            prop: 'birthDate',
            name: 'BirthDate',
            visible: true,
          },
        ],
        right: [],
      }),
    });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableHeaderComponent', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });

    it('calculate styleObject', () => {
      const cmp = component as unknown as Record<string, unknown>;
      expect(cmp.styleObject).toEqual({ width: '100%', height: 'auto' });
    });

    it('should to display columns', () => {
      const label = component.$el.querySelector('.datatable-header-cell-label');
      expect(label).toBeTruthy();
      expect(label.textContent).toEqual('BirthDate');
    });
  });
});
