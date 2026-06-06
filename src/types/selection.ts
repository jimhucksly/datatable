import { ITableColumn } from './column';

export enum SelectionType {
  single = 'single',
  singleFocus = 'singleFocus',
  multi = 'multi',
  multiClick = 'multiClick',
  cell = 'cell',
  checkbox = 'checkbox',
}

export enum ActivateType {
  click = 'click',
  dblclick = 'dblclick',
  checkbox = 'checkbox',
  keydown = 'keydown',
  mouseenter = 'mouseenter',
}

export interface ISelectionContext {
  type: ActivateType;
  event: MouseEvent | KeyboardEvent;
  row: Record<string, unknown>;
  rowIndex: number;
  rowElement: Element;
  cellElement: Element;
  cellIndex: number;
  column?: ITableColumn;
}
