import Quill from 'quill';
import { blotName } from '../assets/const/name';
import TableCellInnerFormat from './TableCellInnerFormat';
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
        node.setAttribute('style', style || '');
        return node;
    }

    get rowId() {
        return this.domNode.dataset.rowId;
    }
    get colId() {
        return this.domNode.dataset.colId;
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
    set style(value) {
        this.domNode.setAttribute('style', value);
    }

    getCellInner() {
        return this.descendants(TableCellInnerFormat)[0];
    }

    optimize() {
        super.optimize();
        const { colId, rowId } = this.domNode.dataset;
        const next = this.next;
        if (
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.dataset.rowId === rowId &&
            next.domNode.dataset.colId === colId
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
        this.children.forEachAt(index, length, function (child, offset, length) {
            child.deleteAt(offset, length);
        });
    }
}

TableCellFormat.blotName = blotName.tableCell;
TableCellFormat.tagName = 'td';
TableCellFormat.className = 'ql-table-cell';
TableCellFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableCellFormat;
