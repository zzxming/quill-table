import Quill from 'quill';
import { CELL_MIN_PRE, blotName } from '../assets/const';
import { TableFormat } from './TableFormat';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableColgroupFormat extends Container {
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

  findCol(index) {
    const next = this.children.iterator();
    let i = 0;
    let cur;
    while ((cur = next())) {
      if (i === index) {
        break;
      }
      i++;
    }
    return cur;
  }

  insertColByIndex(index, value) {
    const table = this.parent;
    if (!(table instanceof TableFormat)) {
      throw new TypeError('TableColgroupFormat should be child of TableFormat');
    }
    const col = this.findCol(index);
    const tableCellInner = Parchment.create(blotName.tableCol, value);
    if (table.full) {
    // TODO: first minus column should be near by
      const next = this.children.iterator();
      let cur;
      while ((cur = next())) {
        if (cur.width - tableCellInner.width >= CELL_MIN_PRE) {
          cur.width -= tableCellInner.width;
          break;
        }
      }
    }
    this.insertBefore(tableCellInner, col);
  }
}
TableColgroupFormat.blotName = blotName.tableColGroup;
TableColgroupFormat.tagName = 'colgroup';
TableColgroupFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableColgroupFormat };
