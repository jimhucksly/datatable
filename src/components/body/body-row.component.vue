<template>
  <div
    id="row-group"
    class="datatable-body-row"
    :class="cssClasses"
    :style="styles"
    :tabIndex="-1"
    :key="rowId"
    @focus="onFocus"
    @blur="onBlur"
    @keydown="onKeyDown"
  >
    <div
      class="datatable-row-group"
      v-for="colGroup of columnsByPin"
      :key="colGroup.type"
      :class="'datatable-row-' + colGroup.type"
      :style="groupStyles(colGroup)"
    >
      <template v-for="(column, ii) of colGroup.columns">
        <datatable-body-cell
          v-if="column.visible"
          :key="`${column.$$id}-${counter}`"
          tabIndex="-1"
          :rowContext="rowContext"
          :column="column"
          :renderTracking="renderTracking"
          :displayCheck="displayCheck"
          :showContextMenu="showContextMenu"
          @activate="onActivate($event, ii)"
          @check="onCheck"
          @tree-action="onTreeAction"
          @context-menu="onContextMenu($event, column, rowContext)"
          @cell-created="onCellRendered"
          @cell-updated="onCellRendered"
          @mouseenter="onMouseenter"
        >
          <template #default="scope">
            <slot v-bind="scope"></slot>
          </template>
        </datatable-body-cell>
      </template>
    </div>
  </div>
</template>
<script src="./body-row.component.ts"></script>
