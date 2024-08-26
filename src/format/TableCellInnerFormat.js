import Quill from 'quill';
import { blotName } from '../assets/const';
import { findParentBlot } from '../utils';
import { ContainerFormat } from './ContainerFormat';

const Parchment = Quill.import('parchment');

class TableCellInnerFormat extends ContainerFormat {
  static create(value) {
    const { tableId, rowId, colId, rowspan, colspan, style } = value;
    const node = super.create();
    node.dataset.tableId = tableId;
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.dataset.rowspan = rowspan || 1;
    node.dataset.colspan = colspan || 1;
    node._style = style;
    return node;
  }

  // 仅 Block 存在 cache, 存在 cache 时不会获取最新 delta, cache 还会保存父级 format(bubbleFormats 函数), 需要清除以获取最新 delta
  clearDeltaCache() {
    // eslint-disable-next-line unicorn/no-array-for-each
    this.children.forEach((child) => {
      child.cache = {};
    });
  }

  get rowId() {
    return this.domNode.dataset.rowId;
  }

  set rowId(value) {
    this.parent && (this.parent.rowId = value);
    this.domNode.dataset.rowId = value;
  }

  get colId() {
    return this.domNode.dataset.colId;
  }

  set colId(value) {
    this.parent && (this.parent.colId = value);
    this.domNode.dataset.colId = value;
  }

  get rowspan() {
    return Number(this.domNode.dataset.rowspan);
  }

  set rowspan(value) {
    this.parent && (this.parent.rowspan = value);
    this.domNode.dataset.rowspan = value;
    this.clearDeltaCache();
  }

  get colspan() {
    return Number(this.domNode.dataset.colspan);
  }

  set colspan(value) {
    this.parent && (this.parent.colspan = value);
    this.domNode.dataset.colspan = value;
    this.clearDeltaCache();
  }

  get style() {
    return this.parent.style;
  }

  set style(value) {
    this.parent.style = value;
    this.domNode._style = this.parent.style;
    this.clearDeltaCache();
  }

  getColumnIndex() {
    const table = findParentBlot(this, blotName.table);
    return table.getColIds().indexOf(this.colId);
  }

  replace(target) {
    if (target.statics.blotName !== this.statics.blotName) {
      const cloneTarget = target.clone();
      target.moveChildren(cloneTarget);
      this.appendChild(cloneTarget);
      target.parent.insertBefore(this, target.next);
      target.remove();
    }
    else {
      super.replace(target);
    }
  }

  format(name, value) {
    super.format(name, value);
    this.clearDeltaCache();
  }

  formats() {
    const { tableId, rowId, colId, rowspan, colspan } = this.domNode.dataset;
    return {
      [this.statics.blotName]: {
        tableId,
        rowId,
        colId,
        rowspan,
        colspan,
        style: this.domNode._style,
      },
    };
  }

  optimize() {
    super.optimize();

    const parent = this.parent;
    // 父级非表格，则将当前 blot 放入表格中
    const { tableId, colId, rowId, rowspan, colspan } = this.domNode.dataset;
    if (parent != null && parent.statics.blotName !== blotName.tableCell) {
      const mark = Parchment.create('block');

      this.parent.insertBefore(mark, this.next);
      const tableWrapper = Parchment.create(blotName.tableWrapper, tableId);
      const table = Parchment.create(blotName.table, tableId);
      const tableBody = Parchment.create(blotName.tableBody);
      const tr = Parchment.create(blotName.tableRow, rowId);
      const td = Parchment.create(blotName.tableCell, {
        tableId,
        rowId,
        colId,
        rowspan,
        colspan,
        style: this.domNode._style,
      });

      td.appendChild(this);
      tr.appendChild(td);
      tableBody.appendChild(tr);
      table.appendChild(tableBody);
      tableWrapper.appendChild(table);

      tableWrapper.replace(mark);
    }

    const next = this.next;
    // cell 下有多个 cellInner 全部合并
    if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName) {
      next.moveChildren(this);
      next.remove();
    }
  }
}

TableCellInnerFormat.blotName = blotName.tableCellInner;
TableCellInnerFormat.tagName = 'p';
TableCellInnerFormat.className = 'ql-table-cell-inner';

export { TableCellInnerFormat };
