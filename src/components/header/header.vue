<template>
  <div class="datatable-header">
    <div
      v-for="colGroup of columnsByPin"
      :key="colGroup.type"
      :class="['datatable-row-group', 'datatable-row-' + colGroup.type]"
      :style="styleByGroup[colGroup.type]"
    >
      <template v-for="column of colGroup.columns">
        <datatable-header-cell
          v-if="column.visible"
          :key="column.$$id"
          v-resizeable="{ resizeEnabled: column.resizeable && !column.checkboxable, initialWidth: column.width }"
          v-long-press="{ pressModel: column, pressEnabled: reorderable && column.draggable }"
          v-dragndrop="{ dragEvent: dragEvent, dragModel: column, dragX: isEnableDragX(column), dragY: false }"
          @resize="onColumnResized($event, column)"
          @longPressStart="onLongPressStart($event, column)"
          @longPressEnd="onLongPressEnd($event, column)"
          :headerHeight="headerHeight"
          :isTarget="column.isTarget"
          :column="column"
          :sortType="sortType"
          :sorts="sorts"
          :selectionType="selectionType"
          :checked="checkedAll"
          :drag-element-id="dragElement ? dragElement.$$id : null"
          @sort="onSort($event)"
          @select="onSelect"
          @columnContextmenu="$emit('columnContextmenu', $event)"
          @header-cell-mounted="onHeaderCellMounted(column, $event)"
          @dragStart="onDragStart"
          @dragEnd="onDragEnd"
          @dragging="onDragging"
          @column-visible-changed="onColumnVisibleChanged($event)"
        >
          <template #default="scope">
            <slot name="default" v-bind="scope"></slot>
          </template>
          <template #append="scope">
            <slot name="append" v-bind="scope"></slot>
          </template>
        </datatable-header-cell>
      </template>
    </div>
    <div class="datatable-header-controls">
      <slot name="controls"></slot>
    </div>
  </div>
</template>
<script src="./header.component.ts"></script>
