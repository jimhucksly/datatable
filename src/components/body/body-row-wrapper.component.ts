import { Options, Prop, Vue } from 'vue-property-decorator';
import { IGroup } from '@/types/group';
import { translateXY } from '@/utils/translate';
import GroupHeader from './body-group-header.component.vue';
import Row from './body-row.component.vue';
import RowDetail from './body-row-detail.component';

@Options({
  name: 'datatable-row-wrapper',
  components: {
    'datatable-group-header': GroupHeader,
    'datatable-row-detail': RowDetail,
    'datatable-body-row': Row,
  },
})
export default class DataTableRowWrapperComponent extends Vue {
  @Prop() innerWidth: number;
  @Prop() rowDetail: boolean;
  @Prop() groupLevel: number;
  @Prop() rowDetailHeight: number;
  @Prop() groupRowHeight: number;
  @Prop({ type: Object, default: () => ({}) }) groupHeaderStyles: Record<string, string>;
  @Prop() groupHeaderClasses: string | Array<string>;
  @Prop() row: Record<string, unknown>;
  @Prop() rowIdentity: (row: Record<string, unknown>) => string | number;
  @Prop() groupRowsBy: Array<IGroup>;
  @Prop() rowIndex: number;
  @Prop() expanded: boolean;
  @Prop() styleObject: Record<string, string>;
  @Prop({ type: Boolean, default: false }) checkboxable: boolean;

  mounted() {
    this.$emit('set-row-element', this.$el);
  }

  updated() {
    this.$emit('set-row-element', this.$el);
  }

  onContextmenu($event: MouseEvent) {
    this.$emit('rowContextmenu', { event: $event, row: this.row });
  }

  get groupTitleStyles(): Record<string, string> {
    const styles: Record<string, string> = {
      ...this.groupHeaderStyles,
      height: this.groupRowHeight ? `${this.groupRowHeight}px` : 'auto',
    };
    translateXY(styles, 'var(--scroll-x)', 0);
    return styles;
  }

  get rowId(): string | number | null {
    if (!this.row) {
      return null;
    }
    if (this.rowIdentity) {
      const result = this.rowIdentity(this.row);
      if (typeof result === 'object') {
        return null;
      }
      return result;
    }
    return null;
  }
}
