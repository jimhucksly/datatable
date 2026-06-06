<template>
  <div
    class="b-datatable"
    v-visibility-observer="{ on: false, timeout: 1000 }"
    :class="classObject"
    @visible="onVisible"
    @insert-column="onColumnInsert"
  >
    <div class="hidden-columns" ref="hiddenColumns"><slot></slot></div>
    <datatable-header
      ref="datatableHeader"
      :style="`--datatable-header-height: ${headerHeight}px`"
      v-if="headerHeight"
      :sorts="mySorts"
      :sortType="mySortType"
      :scrollbarWidth="scrollbarWidth"
      :scrollbarH="scrollbarH"
      :innerWidth="innerWidth"
      :dealsWithGroup="Array.isArray(groupRowsBy) && Boolean(groupRowsBy.length)"
      :columns="internalColumns"
      :headerHeight="headerHeight"
      :reorderable="reorderable"
      :selectionType="selectionType"
      :columnGroupWidths="columnGroupWidths"
      :columnsByPin="columnsByPinArray"
      @sort="onColumnSort($event)"
      @resize="onColumnResize($event)"
      @reorder="onColumnReorder($event)"
      @select="onHeaderSelect($event)"
      @columnContextmenu="onColumnContextmenu($event)"
      @column-visible-changed="onColumnChangeVisible($event)"
      @set-header-width="onSetHeaderWidth($event)"
    >
      <template #controls>
        <slot name="header:controls"></slot>
      </template>
      <template v-if="$slots['cell-header']" #default="scope">
        <slot name="cell-header" v-bind="scope"></slot>
      </template>
      <template v-if="$slots['cell-header:append']" #append="scope">
        <slot name="cell-header:append" v-bind="scope"></slot>
      </template>
    </datatable-header>
    <datatable-progress v-if="loadingIndicator" :offset-y="headerHeight"></datatable-progress>
    <datatable-body
      ref="datatableBody"
      :groupRowsBy="groupRowsBy"
      :rows="internalRows"
      :groupExpansionDefault="groupExpansionDefault"
      :scrollbarV="scrollbarV"
      :scrollbarH="scrollbarH"
      :scrollbarWidth="scrollbarWidth"
      :virtualization="virtualization"
      :loadingIndicator="loadingIndicator"
      :externalPaging="externalPaging"
      :rowHeight="rowHeight"
      :rowCount="rowCount"
      :offset="myOffset"
      :trackByProp="trackByProp"
      :columns="internalColumns"
      :pageSize="pageSize"
      :limit="limit"
      :rowDetail="rowDetail"
      :rowDetailHeight="rowDetailHeight"
      :selected="mySelected"
      :checked="checked"
      :innerWidth="innerWidth"
      :bodyHeight="bodyHeight"
      :selectionType="selectionType"
      :checkMode="checkMode"
      :checkboxable="checkboxable"
      :rowIdentity="rowIdentity"
      :rowClass="rowClass"
      :selectCheck="selectCheck"
      :displayCheck="displayCheck"
      :summaryRow="summaryRow"
      :summaryHeight="summaryHeight"
      :summaryPosition="summaryPosition"
      :groupRowHeight="groupRowHeight"
      :groupHeaderStyles="groupHeaderStyles"
      :groupHeaderClasses="groupHeaderClasses"
      :renderTracking="renderTracking"
      :beforeSelectRowCheck="beforeSelectRowCheck"
      :columnGroupWidths="columnGroupWidths"
      :columnsByPin="columnsByPinArray"
      :dragData="dragData"
      :colorize="colorize"
      @page="onBodyPage"
      @activate="$emit('activate', $event)"
      @row-context-menu="onRowContextmenu"
      @select="onBodySelect"
      @check="onBodyCheck"
      @check-all="onBodyCheckAll"
      @scroll="onBodyScroll"
      @group-toggle="onGroupToggle"
      @tree-action="onTreeAction($event)"
      @rendered="$emit('rendered', $event)"
    >
      <template #default="scope">
        <slot name="cell" v-bind="scope"></slot>
      </template>
      <template #group-header="scope">
        <slot name="group-header" v-bind="scope"></slot>
      </template>
      <template #context-menu="scope">
        <slot name="context-menu" v-if="$slots['context-menu']" v-bind="scope"></slot>
      </template>
      <template #empty>
        <slot name="empty">
          <div v-html="messages.emptyMessage"></div>
        </slot>
      </template>
    </datatable-body>
    <div class="datatable-footer" :style="`--datatable-footer-height: ${footerHeight}px`">
      <datatable-footer ref="datatableFooter" v-if="footerHeight" :footerHeight="footerHeight">
        <template #default="scope">
          <slot name="footer"></slot>
        </template>
      </datatable-footer>
    </div>
  </div>
</template>
<script src="./datatable.component.ts"></script>
