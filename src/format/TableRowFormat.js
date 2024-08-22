import Quill from 'quill';
import { blotName } from '../assets/const';
import { TableCellInnerFormat } from './TableCellInnerFormat';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableRowFormat extends Container {
  static create(value) {
    const node = super.create();
    node.dataset.rowId = value;
    return node;
  }

  optimize() {
    super.optimize();
    const next = this.next;
    if (
      next != null
      && next.prev === this
      && next.statics.blotName === this.statics.blotName
      && next.domNode.dataset.rowId === this.domNode.dataset.rowId
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }

  get rowId() {
    return this.domNode.dataset.rowId;
  }

  insertCell(targetIndex, value, isRight) {
    const next = this.children.iterator();
    let index = 0;
    let cur;
    while ((cur = next())) {
      if (isRight) index += cur.colspan;
      if (index >= targetIndex) break;
      if (!isRight) index += cur.colspan;
    }

    if (isRight && index > targetIndex) {
      cur.colspan += 1;
    }
    else if (!isRight && index > targetIndex && index - cur.colspan >= targetIndex) {
      cur.prev.colspan += 1;
    }
    else {
      const tableCell = Parchment.create(blotName.tableCell, value);
      const tableCellInner = Parchment.create(blotName.tableCellInner, value);
      tableCell.appendChild(tableCellInner);
      this.insertBefore(tableCell, isRight ? cur?.next : cur);
    }
  }

  foreachCellInner(func) {
    const next = this.children.iterator();
    let i = 0;
    let cur;
    while ((cur = next())) {
      const [tableCell] = cur.descendants(TableCellInnerFormat);
      if (func(tableCell, i++)) break;
    }
  }
}

TableRowFormat.blotName = blotName.tableRow;
TableRowFormat.tagName = 'tr';
TableRowFormat.className = 'ql-table-row';
TableRowFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableRowFormat };
