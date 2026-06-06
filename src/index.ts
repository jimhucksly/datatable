import './scss/';
import './app.scss';
import { createApp, defineAsyncComponent } from 'vue';
import App from './app.vue';
import { vuetify } from './vuetify';

function fetchMock() {
  return new Promise<Array<Record<string, unknown>>>(resolve => {
    fetch(window ? '/mock.json' : 'mock_small.json')
      .then(res => res.json())
      .then((json: Array<Record<string, unknown>>) => {
        resolve(json);
      })
      /* eslint-disable-next-line no-console */
      .catch(e => console.log(e));
  });
}

function init() {
  fetchMock()
    .then((json: Array<Record<string, unknown>>) => {
      start(json);
    })
    /* eslint-disable-next-line no-console */
    .catch(e => console.log(e));
}

function start(rows: Array<Record<string, unknown>>) {
  const app = createApp(App, {
    items: rows,
  });

  app.component(
    'datatable',
    defineAsyncComponent(() => import($DEV ? './components/datatable.component.vue' : '../dist'))
  );

  app.use(vuetify);

  app.mount('#app');
}

init();
