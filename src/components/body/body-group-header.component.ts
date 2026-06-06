import { Prop, Vue, Watch } from 'vue-property-decorator';
import { IGroup, IGroupedRows } from '@/types/group';

export default class DataTableBodyGroupHeaderComponent extends Vue {
  @Prop({ default: 0 }) rowHeight: number;
  @Prop() group: IGroupedRows;
  @Prop() expanded: boolean;
  @Prop() checkboxable: boolean;
  @Prop() active: boolean;
  @Prop() groupLevel: number;
  @Prop() groupRowsBy: Array<IGroup>;

  myAllRowsSelected = false;

  onCheckboxChangeDisabled = false;

  @Watch('group.__checkedAll') onCheckedAll(value: boolean) {
    this.onCheckboxChangeDisabled = true;
    this.myAllRowsSelected = value;
    setTimeout(() => {
      this.onCheckboxChangeDisabled = false;
    }, 200);
  }

  onCheckboxChange() {
    if (this.onCheckboxChangeDisabled) {
      setTimeout(() => {
        this.onCheckboxChangeDisabled = false;
      }, 100);
      return;
    }
    this.$emit('select', this.myAllRowsSelected);
  }

  /**
   * Toggle the expansion of a group
   */
  toggleExpandGroup() {
    this.$emit('group-toggle', {
      type: 'group',
      value: this.group,
    });
  }

  get groupTitle(): string {
    if (this.group.keys) {
      return this.group.keys.value;
    }
  }

  get groupHeader(): string {
    if (this.group && this.group.keys) {
      return this.group.keys.title;
    }
  }

  get groupBy(): IGroup {
    if (this.groupLevel && Array.isArray(this.groupRowsBy) && this.groupRowsBy.length - 1 >= this.groupLevel) {
      return this.groupRowsBy[this.groupLevel];
    }
    return null;
  }
}
