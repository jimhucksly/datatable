import { Options, Prop, Vue } from 'vue-property-decorator';
import { IGroupedRows } from '@/types/group';

@Options({
  template: `
    <div style="padding-left:5px;">
      <slot name="rowDetail" v-bind="{ row: row, expanded: expanded }">
        <h3>detail row info</h3>
      </slot>
    </div>
  `,
})
export default class DataTableBodyRowDetailComponent extends Vue {
  @Prop({ default: 0 }) rowHeight: number | ((group?: IGroupedRows, index?: number) => number);
  @Prop() row: Record<string, unknown>;
  @Prop() expanded: boolean;

  created() {
    //
  }

  beforeUpdate() {
    //
  }

  toggleExpandGroup() {
    //
  }
}
