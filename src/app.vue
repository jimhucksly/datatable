<template>
  <div style="flex-basis: 100%; overflow: hidden">
    <datatable
      checkMode="checkNoSelect"
      column-mode="flex"
      size="s"
      sort-type="single"
      :treeFromRelation="isHierarchic ? 'company.parentId' : undefined"
      :treeToRelation="isHierarchic ? 'company.id' : undefined"
      :checkboxable="true"
      :enumerable="false"
      :checked="checked"
      selectionType="single"
      v-model:group-expanded-state="groupState"
      v-model:group-expansion="groupExpansion"
      :groupRowsBy="groupBy"
      :group-expansion-default="true"
      :columns="columns"
      :scrollbar-v="true"
      :scrollbar-h="true"
      :rows="rows"
      :sorts="sorts"
      :loading-indicator="loading"
      :external-paging="true"
      :count="pagerOptions.total"
      :offset="pagerOptions.page - 1"
      :bordered="bordered"
      :colorize="colorize"
      :drag-data="dragData"
      @check="onCheckRow($event)"
      @select="onSelectRow($event)"
      @page="onPage($event)"
    >
      <template #header:controls>
        <div class="controls">
          <v-tooltip>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon class="ma-1" @click="settings">
                <svg-icon>settings</svg-icon>
              </v-btn>
            </template>
            <span>Настройки таблицы</span>
          </v-tooltip>
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon>
                <svg-icon>menu</svg-icon>
              </v-btn>
            </template>
            <v-card>
              <v-list>
                <v-list-item @click="expand">
                  <span>Развернуть все</span>
                </v-list-item>
                <v-list-item @click="close">
                  <span>Свернуть все</span>
                </v-list-item>
                <v-list-item @click="bordered = !bordered">
                  <span v-if="bordered">Скрыть границы ячеек</span>
                  <span v-else>Показать границы ячеек</span>
                </v-list-item>
              </v-list>
            </v-card>
          </v-menu>
        </div>
      </template>
      <template #cell-header:append="{ column, hover }">
        <button v-if="hover" :key="column.prop" @click="headerButtonClick">
          <svg-icon>filters</svg-icon>
        </button>
      </template>
      <template #cell="scope">
        <span v-if="scope.column.type === 'datetime'">{{ scope.column.formatter(scope.value) }}</span>
        <span v-else>{{ scope.value }}</span>
      </template>
      <template #group-header="scope">
        <span>
          <b>{{ scope.groupName }}:</b> {{ scope.groupValue }}
        </span>
      </template>
      <!-- <template #context-menu="{ column, row, cancel }">
        <button @click="onClick({ column, row }, cancel)">
          <svg-icon>preview</svg-icon>
        </button>
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon>
              <svg-icon>menu</svg-icon>
            </v-btn>
          </template>
          <v-card>
            <v-list>
              <v-list-item @click="expand">
                <span>Копировать</span>
              </v-list-item>
            </v-list>
          </v-card>
        </v-menu>
        <div style="display: none">{{ column }}</div>
        <div style="display: none">{{ row }}</div>
      </template> -->
    </datatable>
  </div>
</template>
<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { generatePalette } from '@dn-web/core';
import Icons from './icons.vue';
import { optionalGetterForProp } from './utils/tree';

interface IColumn {
  prop: string;
  name?: string;
  isTreeColumn?: boolean;
}

function getCookie(key: string) {
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  const _key = key.replace(/([$()*+./?[\\\]^{|}])/g, '\\$1');
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  const matches = document.cookie.match(new RegExp('(?:^|; )' + _key + '=([^;]*)'));
  if (matches && matches[1] && matches[1].length) {
    return matches[1];
  }
  return null;
}

function removeDuplicates(arr: Array<unknown>, key: string): Array<unknown> {
  const treeTo = optionalGetterForProp(key);
  const uniqueArray: Array<unknown> = [];
  return arr
    .map((item: Record<string, unknown>) => {
      if (uniqueArray.includes(treeTo(item))) {
        return null;
      }
      uniqueArray.push(treeTo(item));
      return item;
    })
    .filter(item => Boolean(item));
}

const grState = getCookie('groupState');

export default {
  name: 'app',
  components: {
    'svg-icon': Icons,
  },
  props: ['items'],
  mounted() {
    const palette = document.createElement('style');
    palette.innerHTML = generatePalette();
    palette.id = 'dnwebui-palette';
    document.body.appendChild(palette);
    setTimeout(() => {
      this.loading = false;
      // this.checked = [this.rows[0], this.rows[1]];
    }, 1000);
  },
  data(): {
    pagerOptions: {
      page: number;
      pageSize: number;
      total: number;
    };
    [key: string]: unknown;
  } {
    return {
      show: true,
      loading: true,
      bordered: false,
      groupState: JSON.parse(grState),
      groupExpansion: -1,
      isHierarchic: false,
      pagerOptions: {
        page: 1,
        pageSize: 0,
        total: 0,
      },
      checked: [],
      sorts: null,
      // sorts: [
      //   {
      //     prop: 'id',
      //     dir: 'asc',
      //   },
      // ],
      groupBy: null,
      // groupBy: [
      //   {
      //     title: 'City',
      //     prop: 'city',
      //   },
      //   {
      //     title: 'Gender',
      //     prop: 'gender',
      //   },
      // ],
    };
  },
  methods: {
    toTree() {
      this.columns.unshift({
        prop: 'company.name',
        isTreeColumn: true,
      });
      this.isHierarchic = true;
    },
    headerButtonClick() {
      /* eslint-disable no-console */
      console.log('hello!');
    },
    onCheckRow(e: unknown) {
      /* eslint-disable no-console */
      console.log('check', e);
    },
    onSelectRow(e: unknown) {
      /* eslint-disable no-console */
      console.log('select', e);
    },
    onClick(e: { column: unknown; row: unknown }, cancel: () => void) {
      /* eslint-disable no-console */
      console.log('context menu click');
      cancel();
    },
    onPage(e: { offset: number; pageSize: number }) {
      /* eslint-disable no-console */
      // console.log('on page!!', e);
    },
    $log(value: unknown) {
      /* eslint-disable no-console */
      console.log(value);
    },
    close() {
      this.groupExpansion = 0;
    },
    expand() {
      this.groupExpansion = 1;
    },
    settings() {
      //
    },
    colorize(row: Record<string, unknown>): string {
      // return row.city === 'Tokyo' ? 'warning' : row.city === 'London' ? 'error' : null;
      return null;
    },
  },
  watch: {
    groupState: {
      deep: true,
      handler: (value: unknown) => {
        document.cookie = 'groupState=' + JSON.stringify(value) + '; path=/; expires=""';
      },
    },
    rows() {
      this.pagerOptions.total = this.rows.length;
    },
  },
  computed: {
    rows() {
      if (this.isHierarchic) {
        return removeDuplicates(this.items, 'company.name');
      }
      return this.items;
    },
    columns() {
      const arr: Array<IColumn> = this.isHierarchic
        ? [
            {
              prop: 'company.name',
              isTreeColumn: true,
            },
          ]
        : [];
      const columns = [
        {
          prop: 'id',
        },
        {
          name: 'First Name',
          prop: 'first_name',
        },
        {
          name: 'Last Name',
          prop: 'last_name',
        },
        {
          name: 'Cash',
          prop: 'cash',
          align: 'right',
        },
        {
          prop: 'city',
        },
        {
          prop: 'email',
        },
        {
          prop: 'gender',
        },
        {
          name: 'IP',
          prop: 'ip_address',
        },
        // {
        //   prop: 'company.id',
        // },
      ];

      arr.push(...columns);
      if (!this.isHierarchic) {
        arr.push({
          name: 'Company',
          prop: 'company.name',
        });
      }

      return arr;
    },
    dragData() {
      return {
        draggable: true,
        canDrag: (row: Record<string, unknown>) => {
          if (row.id === 3) {
            return false;
          }
        },
        canDrop: (row: Record<string, unknown>) => {
          if (row.id === 4) {
            return false;
          }
        },
        dragstart: (event: DragEvent, row: Record<string, unknown>) => {
          /* eslint-disable no-console */
          console.log(event);
          console.log(row);
        },
        drop: (event: DragEvent, row: Record<string, unknown>) => {
          /* eslint-disable no-console */
          console.log(event);
          console.log(row);
        },
      };
    },
  },
};
</script>
