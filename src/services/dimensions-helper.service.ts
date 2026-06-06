export class DimensionsHelper {
  getDimensions(element: Element): DOMRect {
    return element.getBoundingClientRect();
  }
}
