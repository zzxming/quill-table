import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');
import TableColgroupFormat from './TableColgroupFormat';

class TableFormat extends Container {
    constructor(domNode, value) {
        super(domNode, value);

        this.tableWidth();
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
            let colgroup = this.children.head;
            const colCount = colgroup.children.length;
            colgroup.children.map((col) => {
                col.format('width', width / colCount);
            });

            this.colWidthFillTable();
        }, 0);
    }

    colWidthFillTable() {
        let colgroup = this.children.head;
        if (!colgroup || colgroup.statics.blotName !== TableColgroupFormat.blotName) return;

        let colsWidth = colgroup.children.reduce((sum, col) => col.getWidth() + sum, 0);
        this.domNode.style.width = colsWidth + 'px';
        return colsWidth;
    }

    tableWidth() {
        setTimeout(() => {
            const width = getComputedStyle(this.domNode).width;
            if (!width) return;
            let colsWidth = this.colWidthFillTable();
            const tableRealWidth = parseInt(width);
            if (tableRealWidth > colsWidth) {
                this.domNode.style.width = tableRealWidth + 'px';
                this.computedCorrectWidth(tableRealWidth);
            }
        }, 0);
    }

    tableId() {
        return this.domNode.dataset.tableId;
    }

    rowsId() {
        return this.children.tail.children.map((d) => d.rowId());
    }

    colsId() {
        return this.children.head.children.map((d) => d.colId());
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

    // 注意 table 的 format 不要在 static 写 defaultChild, 否则会导致 table 内的 blot 无法全部删除, 而导致 table 无法删除
    // deleteAt(index, length) {
    // 	super.deleteAt(index, length);
    // }
}

TableFormat.blotName = 'table';
TableFormat.tagName = 'table';
TableFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableFormat;
