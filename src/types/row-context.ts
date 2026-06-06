import { IGroupedRows } from './group';
import { TreeStatus } from './tree-status';

export interface IRowDefault {
  id?: string | number;
  [key: string]: unknown;
}

export interface IRowContext {
  activateFn?: () => void;
  row: IRowDefault;
  group?: IGroupedRows | Record<string, unknown>;
  rowHeight: number | string;
  isSelected: boolean;
  isChecked: boolean;
  rowIndex: number;
  treeStatus: TreeStatus;
  treeLevel: number;
  expanded: boolean;
  checkboxable: boolean;
  isFocused?: boolean;
  dragging?: boolean;
  dragover?: boolean;
}
