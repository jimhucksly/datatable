import { mount, VueWrapper } from '@vue/test-utils';
import { ComponentPublicInstance } from 'vue';
import { Vue } from 'vue-class-component';
import DataTableBodyComponent from './body.vue';

let wrapper: VueWrapper<Vue, ComponentPublicInstance>;
let component: Vue;

async function setupTest() {
  try {
    wrapper = mount(DataTableBodyComponent, {
      propsData: {
        innerWidth: 1000,
      },
    });
    component = wrapper.vm;
    await component.$nextTick();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

describe('DataTableBodyComponent', () => {
  beforeEach(async () => {
    await setupTest();
  });

  describe('fixture', () => {
    it('should have a component instance', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Paging', () => {
    it('should have correct indexes for normal paging with rows > pageSize', async () => {
      await wrapper.setProps({
        rows: [
          { num: 1 },
          { num: 2 },
          { num: 3 },
          { num: 4 },
          { num: 5 },
          { num: 6 },
          { num: 7 },
          { num: 8 },
          { num: 9 },
          { num: 10 },
        ],
        pageSize: 10,
        offset: 1,
        rowCount: 20,
      });
      const expectedIndexes = { first: 10, last: 20 };
      (component as unknown as { updateIndexes: () => void }).updateIndexes();
      expect((component as unknown as { indexes: { first: number; last: number } }).indexes).toEqual(expectedIndexes);
    });

    it('should have correct indexes for normal paging with rows < pageSize', async () => {
      await wrapper.setProps({
        externalPaging: false,
        rows: [{ num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }],
        pageSize: 5,
        offset: 1,
        rowCount: 9,
      });
      const expectedIndexes = { first: 5, last: 9 };
      (component as unknown as { updateIndexes: () => void }).updateIndexes();
      expect((component as unknown as { indexes: { first: number; last: number } }).indexes).toEqual(expectedIndexes);
    });

    it('should have correct indexes for external paging with rows > pageSize', async () => {
      await wrapper.setProps({
        externalPaging: true,
        rows: [
          { num: 1 },
          { num: 2 },
          { num: 3 },
          { num: 4 },
          { num: 5 },
          { num: 6 },
          { num: 7 },
          { num: 8 },
          { num: 9 },
          { num: 10 },
        ],
        pageSize: 10,
        offset: 1,
        rowCount: 20,
      });
      const expectedIndexes = { first: 0, last: 10 };
      (component as unknown as { updateIndexes: () => void }).updateIndexes();
      expect((component as unknown as { indexes: { first: number; last: number } }).indexes).toEqual(expectedIndexes);
    });

    it('should have correct indexes for external paging with rows < pageSize', async () => {
      await wrapper.setProps({
        externalPaging: true,
        rows: [{ num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }],
        pageSize: 5,
        offset: 1,
        rowCount: 9,
      });
      const expectedIndexes = { first: 0, last: 5 };
      (component as unknown as { updateIndexes: () => void }).updateIndexes();
      expect((component as unknown as { indexes: { first: number; last: number } }).indexes).toEqual(expectedIndexes);
    });
  });

  describe('Summary row', () => {
    it('should not return custom styles for a bottom summary row if a scrollbar mode is off', () => {
      const styles = (component as unknown as { getBottomSummaryRowStyles: () => unknown }).getBottomSummaryRowStyles();
      expect(styles).toBeFalsy();
    });

    it('should return custom styles for a bottom summary row if a scrollbar mode is on', async () => {
      wrapper.setProps({
        rowHeight: 50,
        scrollbarV: true,
        virtualization: true,
        rows: [{ num: 1 }, { num: 2 }, { num: 3 }, { num: 4 }],
      });
      await component.$nextTick();
      const styles = (component as unknown as { getBottomSummaryRowStyles: () => unknown }).getBottomSummaryRowStyles();
      expect(styles).toBeDefined();
    });
  });
});
