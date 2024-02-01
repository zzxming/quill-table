import Quill from 'quill';
import { blotName } from '../assets/const/name';
import TableCellInnerFormat from './TableCellInnerFormat';
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
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.dataset.rowId === this.domNode.dataset.rowId
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }

    get rowId() {
        return this.domNode.dataset.rowId;
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

    deleteAt(index, length) {
        super.deleteAt(index, length);
        if (this.prev?.statics?.blotName === this.statics.blotName) {
            this.prev.deleteAt(index, length);
        }
    }
}

TableRowFormat.blotName = blotName.tableRow;
TableRowFormat.tagName = 'tr';
TableRowFormat.className = 'ql-table-row';
TableRowFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableRowFormat;
