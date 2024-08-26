import Quill from 'quill';
import { blotName } from '../assets/const';
import { findParentBlot, randomId } from '../utils';
import { TableRowFormat } from './TableRowFormat';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableBodyFormat extends Container {
  optimize() {
    super.optimize();
    const next = this.next;
    if (
      next != null
      && next.prev === this
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }

  deleteAt(index, length) {
    if (index === 0 && length === this.length()) {
      this.parent.remove();
    }
    this.children.forEachAt(index, length, (child, offset, length) => {
      child.deleteAt(offset, length);
    });
  }

  // insert row at index
  insertRow(targetIndex) {
    const tableBlot = findParentBlot(this, blotName.table);
    if (!tableBlot) return;
    // get all column id. exclude the columns of the target index row with rowspan
    const colIds = tableBlot.getColIds();
    const rows = this.descendants(TableRowFormat);
    const insertColIds = new Set(colIds);
    let index = 0;
    for (const row of rows) {
      if (index === targetIndex) break;
      row.foreachCellInner((cell) => {
        if (index + cell.rowspan > targetIndex) {
          cell.rowspan += 1;
          insertColIds.delete(cell.colId);
          // colspan cell need remove all includes colId
          if (cell.colspan !== 1) {
            const colIndex = colIds.indexOf(cell.colId);
            for (let i = 0; i < cell.colspan - 1; i++) {
              insertColIds.delete(colIds[colIndex + i + 1]);
            }
          }
        }
      });
      index += 1;
    }
    // append new row
    const rowId = randomId();
    const tr = Parchment.create(blotName.tableRow, rowId);
    for (const colId of insertColIds) {
      const td = Parchment.create(blotName.tableCell, {
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      const tdInner = Parchment.create(blotName.tableCellInner, {
        tableId: tableBlot.tableId,
        rowId,
        colId,
        rowspan: 1,
        colspan: 1,
      });
      const block = Parchment.create('block');
      block.appendChild(Parchment.create('break'));
      tdInner.appendChild(block);
      td.appendChild(tdInner);
      tr.appendChild(td);
    }
    this.insertBefore(tr, rows[targetIndex] || null);
  }
}
TableBodyFormat.blotName = blotName.tableBody;
TableBodyFormat.tagName = 'tbody';
TableBodyFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableBodyFormat };
