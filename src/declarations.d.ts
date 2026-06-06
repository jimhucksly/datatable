// Extra variables that live on Global that
// will be replaced by webpack DefinePlugin
declare const ENV: string;
declare const APP_VERSION: string;
declare const IS_PRODUCTION: boolean;
declare const HMR: boolean;
declare const IS_DEV: boolean;

declare class ResizeObserver {
  constructor(callback: ResizeObserverCallback);
  observe: (target: Element, options?: ResizeObserverOptions) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
}

type ResizeObserverBoxOptions = 'border-box' | 'content-box' | 'device-pixel-content-box';

interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void;

interface ResizeObserverEntry {
  readonly target: Element;
  readonly contentRect: DOMRectReadOnly;
  readonly borderBoxSize: ResizeObserverSize[];
  readonly contentBoxSize: ResizeObserverSize[];
  readonly devicePixelContentBoxSize: ResizeObserverSize[];
}

interface ResizeObserverSize {
  readonly inlineSize: number;
  readonly blockSize: number;
}

interface ErrorStackTraceLimit {
  stackTraceLimit: number;
}

// HACK: This is only for demo page hmr
interface AppWindow {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  state: any;
  ResizeObserver: typeof ResizeObserver;
}

interface Window extends AppWindow {}

interface ErrorConstructor extends ErrorStackTraceLimit {}
