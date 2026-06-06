<template>
  <div
    :id="`${column.prop}-${column.$$id}`"
    class="datatable-body-cell"
    :class="[cssClasses, `datatable-body-cell--align-${column.align}`]"
    :style="styles"
    :tabindex="tabIndex"
    @dblclick="onDblClick"
    @click="onClick"
    @keydown="onKeyDown"
    @mouseenter="onMouseEnter"
    @focus="onFocus"
    @blur="onBlur"
  >
    <template v-if="isCheckboxable">
      <label class="datatable-checkbox">
        <input type="checkbox" :checked="rowContext.isChecked" @click="onCheckboxChange" />
        <span></span>
      </label>
    </template>
    <template v-if="isEnumerable">
      <span>{{ rowContext.rowIndex + 1 }}</span>
    </template>
    <template v-if="!isCheckboxable && !isEnumerable">
      <template v-if="column.isTreeColumn">
        <button
          class="datatable-tree-button"
          :disabled="rowContext.treeStatus === 'disabled'"
          :style="{ '--tree-level': rowContext.treeLevel }"
          @click.stop="onTreeAction"
          @dblclick.stop=""
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="7" height="10" viewBox="0 0 7 10" fill="none">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M1.16667 0L0 1.16667L3.83333 5L0 8.83333L1.16667 10L6.16667 5L1.16667 0Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </template>
      <div class="datatable-body-cell-label" @contextmenu="onContextMenu">
        <slot
          name="default"
          v-bind="{
            row: rowContext.row ? rowContext.row : {},
            column: column,
            rowIndex: rowContext.rowIndex,
            group: rowContext.group,
            expanded: rowContext.expanded,
            value: value,
          }"
        >
          <span :title="sanitizedValue" v-html="value"></span>
        </slot>
      </div>
    </template>
  </div>
</template>
<script src="./body-cell.component.ts"></script>
