import { Options, Vue } from 'vue-property-decorator';

@Options({
  template: `
    <div class="datatable-progress" role="progressbar" :style="styles">
      <div class="datatable-progress-container">
        <div class="datatable-progress-bar"></div>
      </div>
    </div>
  `,
  props: ['offset-y'],
  computed: {
    styles() {
      return {
        transform: `translateY(${this.offsetY}px)`,
      };
    },
  },
})
export default class ProgressBarComponent extends Vue {}
