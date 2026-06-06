import { StyleValue } from 'vue';
import { Inject, Prop, Vue, Watch } from 'vue-property-decorator';
import { IEventProvider } from '@/types/events';

export default class ScrollerComponent extends Vue {
  @Prop({ type: Boolean, default: false }) scrollbarV: boolean;
  @Prop({ type: Boolean, default: false }) scrollbarH: boolean;
  @Prop() scrollHeight: number;
  @Prop() scrollWidth: string;
  @Prop() scrollbarWidth: number;
  @Prop() viewportWidth: number;
  @Prop({ type: Object, default: () => ({ left: false, right: false }) }) hasColumnsFrozen: {
    left: boolean;
    right: boolean;
  };

  fromPager = true;
  innerWidth = 0;
  scrollYPos = 0;
  scrollXPos = 0;
  prevScrollYPos = 0;
  prevScrollXPos = 0;
  stopRender = false;
  parentElement: Element;
  onScrollListener: (event: MouseEvent) => void;
  onInitScrollHandler: () => void;
  resizeObserver?: ResizeObserver;

  @Inject({ from: 'eventProvider', default: null }) eventProvider: IEventProvider;

  @Watch('innerWidth') onInnerWidthChanged() {
    this.$emit('change-width', this.innerWidth);
  }

  created() {
    this.$emit('setup', {
      scrollYPos: this.scrollYPos,
      scrollXPos: this.scrollXPos,
    });
    if (this.eventProvider) {
      this.eventProvider.emit('offsetX', this.scrollXPos);
    }
  }

  mounted() {
    // manual bind so we don't always listen
    if (this.scrollbarV || this.scrollbarH) {
      this.parentElement = this.$el.closest('.datatable-body');
      this.onScrollListener = this.onScrolled.bind(this) as (event: MouseEvent) => void;
      this.parentElement.addEventListener('scroll', this.onScrollListener, {
        passive: true,
      });
      this.onInitScrollHandler = this.onInitScroll.bind(this) as () => void;
      'mousedown DOMMouseScroll mousewheel wheel touchstart keyup'.split(' ').forEach(event => {
        this.parentElement.addEventListener(event, this.onInitScrollHandler, {
          passive: true,
        });
      });
      this.tick();
    }
    if ((window as Window).ResizeObserver) {
      this.resizeObserver = new (window as Window).ResizeObserver(entries => {
        window.requestAnimationFrame(() => {
          if (!Array.isArray(entries) || !entries.length) {
            return null;
          }
          if (entries.length && entries[0].contentRect) {
            this.innerWidth = Math.floor(entries[0].contentRect.width);
          } else {
            this.innerWidth = this.$el.clientWidth;
          }
        });
      });
      this.resizeObserver.observe(this.$el);
    }
  }

  beforeUnmount() {
    this.stopRender = true;
    if (this.resizeObserver) {
      this.resizeObserver.unobserve(this.$el);
    }
    if (this.scrollbarV || this.scrollbarH) {
      'mousedown DOMMouseScroll mousewheel wheel touchstart keyup'.split(' ').forEach(event => {
        this.parentElement.removeEventListener(event, this.onInitScrollHandler);
      });
    }
  }

  setOffset(offsetY: number, fromPager: boolean = false) {
    if (this.parentElement) {
      this.fromPager = fromPager;
      this.parentElement.scrollTop = offsetY;
    }
  }

  incOffset(offsetY: number) {
    if (this.parentElement) {
      this.parentElement.scrollTop += offsetY;
    }
  }

  onInitScroll() {
    this.fromPager = false;
  }

  onScrolled(event: MouseEvent) {
    if (this.scrollbarV || this.scrollbarH) {
      const dom: Element = (event.currentTarget || event.target) as Element;
      if (dom) {
        this.scrollYPos = dom.scrollTop;
        this.scrollXPos = dom.scrollLeft;
        if (this.eventProvider) {
          this.eventProvider.emit('offsetX', this.scrollXPos);
        }
        this.updateOffset();
      }
    }
  }

  tick() {
    if (this.stopRender) {
      return;
    }
    window.requestAnimationFrame(() => this.tick());
    if (this.scrollbarV || this.scrollbarH) {
      if (!this.parentElement) {
        return;
      }
      const scrollTop = this.parentElement.scrollTop;
      const scrollLeft = this.parentElement.scrollLeft;
      if (this.scrollYPos === scrollTop && this.scrollXPos === scrollLeft) {
        return;
      }
      this.scrollYPos = scrollTop;
      this.scrollXPos = scrollLeft;
      this.updateOffset();
    }
  }

  updateOffset() {
    let direction: string;
    if (this.scrollYPos < this.prevScrollYPos) {
      direction = 'down';
    } else if (this.scrollYPos > this.prevScrollYPos) {
      direction = 'up';
    } else if (this.scrollXPos < this.prevScrollXPos) {
      direction = 'right';
    } else if (this.scrollXPos > this.prevScrollXPos) {
      direction = 'left';
    }
    if (direction) {
      this.$emit('scroll', {
        direction,
        scrollYPos: this.scrollYPos,
        scrollXPos: this.scrollXPos,
        fromPager: this.fromPager,
      });
    }
    this.prevScrollYPos = this.scrollYPos;
    this.prevScrollXPos = this.scrollXPos;
  }

  get styleObject(): StyleValue {
    const styles: Record<string, string> = {
      height: this.scrollHeight ? `${this.scrollHeight}px` : null,
      width: this.scrollWidth ? `${this.scrollWidth}px` : '100%',
      position: 'relative',
      transform: 'translateZ(0)',
      overflow: 'hidden',
      '--scroll-x': `${this.scrollXPos}px`,
    };
    if (this.hasColumnsFrozen.left) {
      styles['--row-left-translate-x'] = `${this.scrollXPos}px`;
    }
    if (this.hasColumnsFrozen.right) {
      const r = this.innerWidth - this.viewportWidth + this.scrollbarWidth - this.scrollXPos;
      styles['--row-right-translate-x'] = `${r * -1}px`;
    }
    return styles;
  }
}
