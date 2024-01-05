import Quill from 'quill';
import ContainBlot from '../blot/contain';
import { blotName } from '../assets/const/name';
const Parchment = Quill.import('parchment');

class TableCellInnerFormat extends ContainBlot {
    static create(value) {
        const { tableId, rowId, colId, rowspan, colspan, style } = value;
        const node = super.create();
        node.dataset.tableId = tableId;
        node.dataset.rowId = rowId;
        node.dataset.colId = colId;
        node.dataset.rowspan = rowspan || 1;
        node.dataset.colspan = colspan || 1;
        node.setAttribute('style', style);
        return node;
    }

    formats() {
        const { tableId, rowId, colId, rowspan, colspan } = this.domNode.dataset;
        return {
            [this.statics.blotName]: {
                tableId,
                rowId,
                colId,
                rowspan,
                colspan,
                style: this.domNode.getAttribute('style'),
            },
        };
    }

    get rowId() {
        return this.domNode.dataset.rowId;
    }
    get colId() {
        return this.domNode.dataset.colId;
    }
    get rowspan() {
        return Number(this.domNode.dataset.rowspan);
    }
    set rowspan(value) {
        this.parent && (this.parent.rowspan = value);
        this.domNode.dataset.rowspan = value;
    }
    get colspan() {
        return Number(this.domNode.dataset.colspan);
    }
    set colspan(value) {
        this.parent && (this.parent.colspan = value);
        this.domNode.dataset.colspan = value;
    }

    optimize() {
        super.optimize();

        const parent = this.parent;
        // 父级非表格，则将当前 blot 放入表格中
        const { tableId, colId, rowId, rowspan, colspan } = this.domNode.dataset;
        if (parent != null && parent.statics.blotName != blotName.tableCell) {
            // we will mark td position, put in table and replace mark
            const mark = Parchment.create('block');

            this.parent.insertBefore(mark, this.next);
            const tableWrapper = Parchment.create(blotName.tableWrapper, tableId);
            const table = Parchment.create(blotName.table, tableId);
            const tableBody = Parchment.create(blotName.tableBody);
            const tr = Parchment.create(blotName.tableRow, rowId);
            const td = Parchment.create(blotName.tableCell, {
                tableId,
                rowId,
                colId,
                rowspan,
                colspan,
            });

            td.appendChild(this);
            tr.appendChild(td);
            tableBody.appendChild(tr);
            table.appendChild(tableBody);
            tableWrapper.appendChild(table);

            tableWrapper.replace(mark);
        }

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
        super.deleteAt(index, length);
        this.parent.remove();
    }
}

TableCellInnerFormat.blotName = blotName.tableCellInner;
TableCellInnerFormat.tagName = 'p';
TableCellInnerFormat.className = 'ql-table-cell-inner';
TableCellInnerFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableCellInnerFormat;
