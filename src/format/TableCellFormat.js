import Quill from 'quill';
import { blotName } from '../assets/const';
import { findParentBlot } from '../utils';
import { TableCellInnerFormat } from './TableCellInnerFormat';

const Parchment = Quill.import('parchment');
const Container = Quill.import('blots/container');

class TableCellFormat extends Container {
  static create(value) {
    const { rowId, colId, rowspan, colspan, style } = value;
    const node = super.create();
    node.dataset.rowId = rowId;
    node.dataset.colId = colId;
    node.setAttribute('rowspan', rowspan || 1);
    node.setAttribute('colspan', colspan || 1);
    node.style.cssText = style;
    return node;
  }

  get rowId() {
    return this.domNode.dataset.rowId;
  }

  set rowId(value) {
    this.domNode.dataset.rowId = value;
  }

  get colId() {
    return this.domNode.dataset.colId;
  }

  set colId(value) {
    this.domNode.dataset.colId = value;
  }

  get rowspan() {
    return Number(this.domNode.getAttribute('rowspan'));
  }

  set rowspan(value) {
    this.domNode.setAttribute('rowspan', value);
  }

  get colspan() {
    return Number(this.domNode.getAttribute('colspan'));
  }

  set colspan(value) {
    this.domNode.setAttribute('colspan', value);
  }

  get style() {
    return this.domNode.style.cssText;
  }

  set style(value) {
    Object.assign(this.domNode.style, value);
  }

  getCellInner() {
    return this.descendants(TableCellInnerFormat)[0];
  }

  optimize() {
    super.optimize();
    const { colId, rowId, colspan, rowspan } = this.domNode.dataset;

    // td need only child tableCellInner. but for MutationObserver. tableCell need allow break
    // make sure tableCellInner is only child
    const tableBlot = findParentBlot(this, blotName.table);
    const cellInner = this.getCellInner();
    if (!cellInner) {
      // eslint-disable-next-line unicorn/no-array-for-each
      this.children.forEach((child) => {
        child.remove();
      });
      const tableCellInner = Parchment.create(blotName.tableCellInner, {
        tableId: tableBlot.tableId,
        rowId,
        colId,
        colspan: colspan || 1,
        rowspan: rowspan || 1,
      });
      const block = Parchment.create('block');
      block.appendChild(Parchment.create('break'));
      tableCellInner.appendChild(block);
      this.appendChild(tableCellInner);
    }

    const next = this.next;
    if (
      next != null
      && next.prev === this
      && next.statics.blotName === this.statics.blotName
      && next.domNode.dataset.rowId === rowId
      && next.domNode.dataset.colId === colId
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }

  deleteAt(index, length) {
    if (index === 0 && length === this.length()) {
      const cell = this.next || this.prev;
      const cellInner = cell && cell.getCellInner();
      if (cellInner) {
        cellInner.colspan += this.colspan;
      }
      return this.remove();
    }
    this.children.forEachAt(index, length, (child, offset, length) => {
      child.deleteAt(offset, length);
    });
  }
}

TableCellFormat.blotName = blotName.tableCell;
TableCellFormat.tagName = 'td';
TableCellFormat.className = 'ql-table-cell';
TableCellFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableCellFormat };
