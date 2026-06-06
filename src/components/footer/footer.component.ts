import { Prop, Vue } from 'vue-property-decorator';

export default class DataTableFooterComponent extends Vue {
  @Prop() footerHeight: number;
}
