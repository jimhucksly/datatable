export interface IGroup {
  title: string;
  prop: string;
  valueGetter?: (row: Record<string, unknown>) => string;
}

export interface IGroupedRows {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __isGroup: true;
  key: string;
  level: number;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __expanded: boolean;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __checkboxable: boolean;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  __checkedAll: boolean;
  rows: Record<string, unknown | IGroupedRows>[];
  groups?: IGroupedRows[];
  keys?: IKeyDescription;
  active?: boolean;
}

export interface IKeyDescription {
  title: string;
  prop: string;
  value?: string;
}
