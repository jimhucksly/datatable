<template>
  <div
    class="datatable-header-cell-template-wrap"
    :class="classes"
    :style="styles"
    :title="isCheckboxable ? '' : name"
    @contextmenu="onContextmenu($event)"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <label v-if="isCheckboxable" class="datatable-checkbox">
      <input type="checkbox" v-model="myAllRowsSelected" @change="onCheckboxChange" />
      <span></span>
    </label>
    <span v-if="isEnumerable"></span>
    <template v-if="!isCheckboxable && !isEnumerable">
      <div class="datatable-header-cell">
        <div class="datatable-header-cell-label draggable" @click="onSort">
          <span>
            <slot name="default" v-bind="{ column: column }">
              {{ name }}
            </slot>
          </span>
        </div>
      </div>
      <div class="cell-controls">
        <button
          class="sort-btn"
          :class="{ 'sort-asc': isSortAsc, 'sort-desc': isSortDesc, 'sort-multi': isMultipleSort }"
          @click="onSort"
        >
          <span class="sort-btn-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" viewBox="0 0 10 7" fill="none">
              <path
                d="M1.175 -6.35783e-08L5 3.825L8.825 -6.35783e-08L10 1.18333L5 6.18333L0 1.18333L1.175 -6.35783e-08Z"
                fill="currentColor"
              />
            </svg>
          </span>
          {{ sortOrder }}
        </button>
        <slot name="append" v-bind="{ column: column, hover }"></slot>
      </div>
    </template>
  </div>
</template>
<script src="./header-cell.component.ts"></script>
