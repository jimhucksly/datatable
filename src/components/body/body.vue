<template>
  <div
    :style="styles"
    class="datatable-body"
    :class="{ 'datatable-body--empty': isEmpty, 'datatable-body--dragging': isDrag }"
  >
    <datatable-selection
      ref="selector"
      :selected="selected"
      :checked="checked"
      :rows="rows"
      :groupRowsBy="groupRowsBy"
      :pageSize="pageSize"
      :selectCheck="selectCheck"
      :selectEnabled="selectEnabled"
      :selectionType="selectionType"
      :checkMode="checkMode"
      :rowIdentity="rowIdentity"
      :scroller="scroller"
      :bodyHeight="bodyHeight"
      :beforeSelectRowCheck="beforeSelectRowCheck"
      @select="this.$emit('select', $event)"
      @check="$emit('check', $event)"
      @check-all="$emit('check-all', $event)"
      @activate="$emit('activate', $event)"
    >
      <datatable-scroller
        ref="scroller"
        :scrollbarV="scrollbarV"
        :scrollbarH="scrollbarH"
        :scrollHeight="scrollHeight"
        :scrollWidth="scrollWidth"
        :scrollbarWidth="scrollbarWidth"
        :viewportWidth="innerWidth"
        :hasColumnsFrozen="hasColumnsFrozen"
        @setup="onScrollSetup"
        @scroll="onBodyScroll"
        @change-width="onScrollerWidthChanged"
      >
        <!-- <datatable-summary-row
          class="datatable-summary-row"
          v-if="summaryRow && summaryPosition === 'top'"
          :rowHeight="summaryHeight"
          :offsetX="offsetX"
          :innerWidth="innerWidth"
          :rows="rows"
          :columns="columns"
          :columnsByPin="columnsByPin"
          :columnGroupWidths="columnGroupWidths"
          :groupStyles="getGroupStyles"
          :slots="cellSlots"
        >
        </datatable-summary-row> -->
        <datatable-row-wrapper
          v-for="(rowContext, i) of rowContexts"
          :key="rowContext.rowIndex"
          :styleObject="getRowWrapperStyles(rowContext)"
          :groupRowsBy="groupRowsBy"
          :groupLevel="0"
          :row="rowContext.row"
          :rowIdentity="rowIdentity"
          :innerWidth="innerWidth"
          :rowDetail="rowDetail"
          :groupRowHeight="groupRowHeight"
          :groupHeaderStyles="groupHeaderStyles"
          :groupHeaderClasses="groupHeaderClasses"
          :rowDetailHeight="getDetailRowHeight(rowContext.row)"
          :expanded="rowContext.expanded"
          :checkboxable="rowContext.checkboxable"
          :rowIndex="rowContext.rowIndex"
          @group-toggle="onGroupToggle"
          @select="onGroupSelect($event, rowContext)"
          @row-contextmenu="$emit('rowContextmenu', $event)"
        >
          <template #default="{ rowId }">
            <datatable-body-row
              tabindex="-1"
              :columnsByPin="columnsByPin"
              :columnGroupWidths="columnGroupWidths"
              :groupStyles="getGroupStyles"
              :rowClass="getRowClass"
              :row="rowContext.row"
              :rowContext="rowContext"
              :row-id="rowId || i"
              :displayCheck="displayCheck"
              :renderTracking="renderTracking"
              :draggable="dragData ? dragData.draggable : false"
              :show-context-menu="slotContextMenuPassed"
              @tree-action="onTreeAction($event)"
              @activate="onActivate($event, i)"
              @check="onCheck(rowContext)"
              @row-created="onRowRendered"
              @row-updated="onRowRendered"
              @context-menu="onContextMenu"
              @dragstart="onDragStart($event, rowContext)"
              @dragenter="onDragEnter($event, rowContext)"
              @dragover="onDragOver($event, rowContext)"
              @dragleave="onDragLeave($event, rowContext)"
              @dragend="onDragEnd($event, rowContext)"
              @drop="onDrop($event, rowContext)"
            >
              <template #default="scope">
                <slot v-bind="scope"></slot>
              </template>
            </datatable-body-row>
          </template>
          <template #group-header="scope">
            <slot name="group-header" v-bind="scope"></slot>
          </template>
        </datatable-row-wrapper>
        <!-- <datatable-summary-row
          class="datatable-summary-row"
          v-if="summaryRow && summaryPosition === 'bottom'"
          :style="getBottomSummaryRowStyles"
          :rowHeight="summaryHeight"
          :offsetX="offsetX"
          :innerWidth="innerWidth"
          :rows="rows"
          :columns="columns"
          :columnsByPin="columnsByPin"
          :columnGroupWidths="columnGroupWidths"
          :groupStyles="getGroupStyles"
          :slots="cellSlots"
        >
        </datatable-summary-row> -->
      </datatable-scroller>
      <div v-if="isEmpty" class="datatable-body-row-empty" :style="{ width: minBodyWidth }">
        <slot name="empty"></slot>
      </div>
    </datatable-selection>
    <div
      v-if="$slots['context-menu'] && contextMenu && contextMenu.event"
      class="datatable-body-cell-context-menu"
      :style="{
        '--context-menu-x': contextMenuPosition.x,
        '--context-menu-y': contextMenuPosition.y,
        visibility: contextMenu.show ? 'visible' : 'hidden',
      }"
    >
      <slot
        name="context-menu"
        v-bind="{ column: contextMenu.col, row: contextMenu.row, cancel: onCloseContextMenu }"
      ></slot>
    </div>
  </div>
</template>
<script src="./body.component.ts"></script>
