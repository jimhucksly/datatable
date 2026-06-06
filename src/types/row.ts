export type RowSize = 's' | 'm' | 'l';

export type RowColorizeType = 'warning' | 'error';

export type RowColorize = (row: Record<string, unknown>) => RowColorizeType;

export type RowIdentity = (row: Record<string, unknown>) => string | number;
