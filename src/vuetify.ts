import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';

const defaults = {
  global: {
    ripple: false,
    density: 'compact',
  },
  VToolbar: {
    height: 60,
    density: 'default',
  },
  VTooltip: {
    scrollStrategy: 'close',
    location: 'bottom',
    contentClass: ['bg-dark'],
    noClickAnimation: true,
    openDelay: 600,
  },
  VContainer: {
    fluid: true,
  },
  VBtn: {
    elevation: 0,
  },
  VList: {
    lines: false,
  },
  VMenu: {
    transition: 'toggle-slide-y-transition',
    location: 'bottom',
  },
};

const vuetify = createVuetify({
  components,
  defaults: {
    ...defaults,
  },
});

export { vuetify };
