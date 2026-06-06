<template>
  <div
    :class="[
      'datatable-group-header',
      {
        active: active,
        'datatable-group-header--expanded': expanded,
        'datatable-group-header--checkboxable': checkboxable,
      },
    ]"
    @click="toggleExpandGroup"
  >
    <template v-if="checkboxable">
      <div class="datatable-group-header-cell datatable-group-header-cell--checkboxable">
        <label class="datatable-checkbox">
          <input type="checkbox" v-model="myAllRowsSelected" @change="onCheckboxChange" />
          <span></span>
        </label>
      </div>
    </template>
    <button class="datatable-group-header-button" :style="{ '--group-level': groupLevel }">
      <svg xmlns="http://www.w3.org/2000/svg" width="7" height="10" viewBox="0 0 7 10" fill="none">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M1.16667 0L0 1.16667L3.83333 5L0 8.83333L1.16667 10L6.16667 5L1.16667 0Z"
          fill="currentColor"
        />
      </svg>
    </button>
    <slot
      name="group-header"
      v-bind="{
        group: group,
        expanded: expanded,
        level: groupLevel,
        groupBy: groupBy,
        groupName: groupHeader,
        groupValue: groupTitle,
      }"
    >
      <span>
        <b>{{ groupTitle }}</b>
      </span>
    </slot>
  </div>
</template>
<script src="./body-group-header.component.ts" lang="ts"></script>
