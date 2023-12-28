import Quill from 'quill';
import ContainBlot from '../blot/contain';
const Parchment = Quill.import('parchment');

import TableFormat from './TableFormat';
import TableBodyFormat from './TableBodyFormat';
import TableRowFormat from './TableRowFormat';
import TableWrapperFormat from './TableWrapperFormat';
import TableColgroupFormat from './TableColgroupFormat';

class TableCellFormat extends ContainBlot {
    static create(value) {
        const { tableId, rowId, colId, cellId, rowspan, colspan, style } = value;
        const node = super.create();
        node.dataset.tableId = tableId;
        node.dataset.rowId = rowId;
        node.dataset.colId = colId;
        node.dataset.cellId = cellId;
        node.setAttribute('rowspan', rowspan ?? 1);
        node.setAttribute('colspan', colspan ?? 1);
        node.setAttribute('style', style ?? null);

        // 因为 wrapper 不可输入, 此设置在 table 内可输入
        // node.setAttribute('contenteditable', true);
        node.classList.add('ql-table-cell');
        return node;
    }

    format(name, value) {
        if (name != null) {
            if (value) {
                this.domNode.setAttribute(name, value);
            } else {
                this.domNode.removeAttribute(name);
            }
        } else {
            super.format(name, value);
        }
    }

    colId() {
        return this.domNode.dataset.colId;
    }

    rowId() {
        return this.domNode.dataset.rowId;
    }

    formats() {
        const { tableId, rowId, colId, cellId } = this.domNode.dataset;
        return {
            [this.statics.blotName]: {
                tableId,
                rowId,
                colId,
                cellId,
                rowspan: this.domNode.getAttribute('rowspan'),
                colspan: this.domNode.getAttribute('colspan'),
                style: this.domNode.getAttribute('style'),
            },
        };
    }

    firstIndexOfCol() {
        const table = Quill.find(document.querySelector(`table[data-table-id="${this.domNode.dataset.tableId}"]`));
        const [colgroup] = table.descendants(TableColgroupFormat);

        const colId = this.domNode.dataset.colId;
        const colsId = colgroup.children.map((col) => col.colId());
        return colsId.findIndex((id) => id === colId);
    }

    optimize() {
        super.optimize();

        const parent = this.parent;
        if (parent != null && parent.statics.blotName != TableRowFormat.blotName) {
            // we will mark td position, put in table and replace mark
            const mark = Parchment.create('block');

            this.parent.insertBefore(mark, this.next);
            const tableWrapper = Parchment.create(TableWrapperFormat.blotName, this.domNode.dataset.tableId);
            const table = Parchment.create(TableFormat.blotName, this.domNode.dataset.tableId);

            const tableBody = Parchment.create(TableBodyFormat.blotName);
            const tr = Parchment.create(TableRowFormat.blotName, this.domNode.dataset.rowId);

            tr.appendChild(this);
            tableBody.appendChild(tr);
            table.appendChild(tableBody);
            tableWrapper.appendChild(table);

            tableWrapper.replace(mark);
        }

        // merge same TD id
        const next = this.next;
        if (
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.dataset.tableId === this.domNode.dataset.tableId &&
            next.domNode.dataset.cellId === this.domNode.dataset.cellId
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }

    // 需要删除整table
    deleteAt(index, length) {
        // console.log(this);
        // console.log(index, length);
        super.deleteAt(index, length);
        // console.log(this.domNode.dataset.cellId, this.next?.domNode.dataset.cellId, this.prev?.domNode.dataset.cellId);
        if (index === 0 && length === 1) {
            // 当单元格内有元素存在时, this.prev 不会是 tableRow
            // 持续删除一行, 一行删完后会触发 row 的 deleteAt, 从而删除整个 table
            if (this.prev?.statics?.blotName === this.statics.blotName) {
                this.prev.deleteAt(index, length);
            } else if (this.parent?.statics?.blotName === TableRowFormat.blotName) {
                this.parent.deleteAt(0, 1);
            }
        }
    }
}

TableCellFormat.blotName = 'td';
TableCellFormat.tagName = 'td';
TableCellFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableCellFormat;
