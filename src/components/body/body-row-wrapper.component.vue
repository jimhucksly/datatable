<template>
  <div class="datatable-row-wrapper" :style="styleObject" tabindex="-1" :data-test-id="rowId">
    <datatable-group-header
      v-if="row && row.__isGroup"
      :class="groupHeaderClasses"
      :style="groupTitleStyles"
      :group="row"
      :groupLevel="row.level"
      :groupRowsBy="groupRowsBy"
      :expanded="row.__expanded"
      :checkboxable="row.__checkboxable"
      :active="row.active"
      @group-toggle="$emit('group-toggle', $event)"
      @select="$emit('select', $event)"
      @contextmenu="$emit('row-contextmenu', $event, row)"
    >
      <template #group-header="scope">
        <slot name="group-header" v-bind="scope"></slot>
      </template>
    </datatable-group-header>
    <slot v-else v-bind="{ rowId }">
      <!-- datatable-body-row here -->
    </slot>
    <!-- <datatable-row-detail
      v-if="rowDetail && expanded"
      class="datatable-row-detail"
      :style="{ height: rowDetailHeight + 'px' }"
      :row="row"
      :expanded="expanded"
      @detail-toggle="$emit('detail-toggle', $event)"
      @contextmenu="$emit('row-contextmenu', $event, row)"
    >
    </datatable-row-detail> -->
  </div>
</template>
<script src="./body-row-wrapper.component.ts"></script>
