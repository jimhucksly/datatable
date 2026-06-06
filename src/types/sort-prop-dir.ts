import { ITableColumn } from './column';
import { SortDirection } from './sort-direction';

export interface ISortPropDir {
  dir: SortDirection;
  prop: string | number;
}

export interface ISortEvent {
  sorts: ISortPropDir[];
  column?: ITableColumn;
  prevValue?: SortDirection;
  newValue?: SortDirection;
}
