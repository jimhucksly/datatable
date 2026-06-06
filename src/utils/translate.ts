/* eslint-disable no-undefined */
import { camelCase } from './camel-case';
import { getVendorPrefixedName } from './prefixes';

// browser detection and prefixing tools
const transform = typeof window !== 'undefined' ? getVendorPrefixedName('transform') : undefined;
const hasCSSTransforms = typeof window !== 'undefined' ? Boolean(getVendorPrefixedName('transform')) : undefined;
const hasCSS3DTransforms = typeof window !== 'undefined' ? Boolean(getVendorPrefixedName('perspective')) : undefined;
const ua = typeof window !== 'undefined' ? window.navigator.userAgent : 'Chrome';
const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);

export function translateXY(styles: Record<string, string>, x: number | string, y: number) {
  const _x = typeof x === 'string' ? x : `${x}px`;
  const _y = typeof y === 'string' ? y : `${y}px`;
  if (typeof transform !== 'undefined' && hasCSSTransforms) {
    if (!isSafari && hasCSS3DTransforms) {
      styles[transform] = `translate3d(${_x}, ${_y}, 0)`;
      styles['-webkit-backface-visibility'] = 'hidden';
    } else {
      styles[camelCase(transform)] = `translate(${_x}, ${_y})`;
    }
  } else {
    styles.left = `${_x}`;
    styles.top = `${_y}`;
  }
}
