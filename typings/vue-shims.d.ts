declare module '*.vue' {
  import { defineComponent } from 'vue';
  const component: ReturnType<typeof defineComponent>;
  export default component;
}

// TypeScript type module definition required for vue-template-loader
declare module '*.html' {
  // eslint-disable-next-line no-duplicate-imports
  import Vue, { ComponentOptions } from 'vue';

  interface WithRender {
    <V extends Vue>(options: ComponentOptions<V>): ComponentOptions<V>;
    <V extends typeof Vue>(component: V): V;
  }

  const withRender: WithRender;
  export = withRender;
}
