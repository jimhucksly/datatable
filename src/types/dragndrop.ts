export interface IDragndrop {
  draggable: boolean;
  canDrag: (row: Record<string, unknown>) => boolean;
  canDrop: (row: Record<string, unknown>) => boolean;
  dragstart: (e: DragEvent, row: Record<string, unknown>) => void;
  drop: (e: DragEvent, row: Record<string, unknown>) => void;
}
