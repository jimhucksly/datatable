import { IColumnsByPin, IColumnsByPinRecord, IColumnsWidth, ITableColumn } from '@/types/column';

export function columnsByPin(cols: ITableColumn[]): IColumnsByPin {
  const ret: { left: ITableColumn[]; center: ITableColumn[]; right: ITableColumn[] } = {
    left: [],
    center: [],
    right: [],
  };

  if (cols) {
    for (const col of cols) {
      if (col.frozenLeft) {
        ret.left.push(col);
      } else if (col.frozenRight) {
        ret.right.push(col);
      } else {
        ret.center.push(col);
      }
    }
  }

  return ret;
}

/**
 * Returns the widths of all group sets of a column
 */
export function columnGroupWidths(groups: IColumnsByPin, all: ITableColumn[], tableWidth: number): IColumnsWidth {
  const result = {
    left: columnTotalWidth(groups.left),
    center: columnTotalWidth(groups.center),
    right: columnTotalWidth(groups.right),
    total: Math.floor(columnTotalWidth(all)),
  };
  if (tableWidth > result.total) {
    result.center += tableWidth - result.total;
    result.total = tableWidth;
  }
  return result;
}

/**
 * Calculates the total width of all columns and their groups
 */
export function columnTotalWidth(columns: ITableColumn[]): number {
  let totalWidth = 0;

  if (columns) {
    for (const c of columns) {
      if (c.hidden || !c.visible) {
        continue;
      }
      let width = c.hidden || !c.visible ? 0 : c.width || c.$$oldWidth;
      if (typeof width === 'string') {
        width = Math.floor(parseFloat(width));
      }
      totalWidth = totalWidth + width;
    }
  }

  return totalWidth;
}

/**
 * Calculates the total width of all columns and their groups
 */
export function columnsTotalWidth(columns: ITableColumn[]): number {
  let totalWidth = 0;

  for (const column of columns) {
    totalWidth = totalWidth + column.width;
  }

  return totalWidth;
}

export function columnsByPinArr(val: IColumnsByPin): Array<IColumnsByPinRecord> {
  const colsByPinArr: Array<{ type: 'left' | 'center' | 'right'; columns: ITableColumn[] }> = [];
  const colsByPin = val;

  colsByPinArr.push({ type: 'left', columns: colsByPin['left'] });
  colsByPinArr.push({ type: 'center', columns: colsByPin['center'] });
  colsByPinArr.push({ type: 'right', columns: colsByPin['right'] });

  return colsByPinArr;
}
