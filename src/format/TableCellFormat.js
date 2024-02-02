import Quill from 'quill';
const Parchment = Quill.import('parchment');

import { blotName } from '../assets/const/name';
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

    // 需要删除整table
    deleteAt(index, length) {
        super.deleteAt(index, length);
        this.parent.remove();
    }
}

TableCellFormat.blotName = blotName.tableCell;
TableCellFormat.tagName = 'td';
TableCellFormat.className = 'ql-table-cell';
TableCellFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableCellFormat;
