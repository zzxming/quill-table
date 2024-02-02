import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');
import { blotName } from '../assets/const/name';
import TableRowFormat from './TableRowFormat';
import TableColFormat from './TableColFormat';

class TableFormat extends Container {
    constructor(domNode, value) {
        super(domNode, value);

        this.formatTableWidth();
    }

    static create(value) {
        const node = super.create();

        node.dataset.tableId = value;
        node.classList.add('ql-table');
        node.setAttribute('cellpadding', 0);
        node.setAttribute('cellspacing', 0);

        return node;
    }

    computedCorrectWidth(width) {
        setTimeout(() => {
            const colgroup = this.children.head;
            const colCount = colgroup.children.length;
            colgroup.children.map((col) => {
                col.width = width / colCount;
            });

            this.colWidthFillTable();
        }, 0);
    }

    colWidthFillTable() {
        const colgroup = this.children.head;
        if (!colgroup || colgroup.statics.blotName !== blotName.tableColGroup) return;

        const colsWidth = colgroup.children.reduce((sum, col) => col.width + sum, 0);
        this.domNode.style.width = colsWidth + 'px';
        return colsWidth;
    }

    formatTableWidth() {
        setTimeout(() => {
            this.colWidthFillTable();
        }, 0);
    }

    get tableId() {
        return this.domNode.dataset.tableId;
    }

    getRows() {
        return this.descendants(TableRowFormat);
    }
    getRowIds() {
        return this.getRows().map((d) => d.rowId);
    }

    getCols() {
        return this.descendants(TableColFormat);
    }
    getColIds() {
        return this.getCols().map((d) => d.colId);
    }

    optimize() {
        super.optimize();
        let next = this.next;
        if (
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.dataset.tableId === this.domNode.dataset.tableId
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }
}

TableFormat.blotName = blotName.table;
TableFormat.tagName = 'table';
TableFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableFormat;
