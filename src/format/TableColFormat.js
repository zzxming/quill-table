import Quill from 'quill';
const Parchment = Quill.import('parchment');

import TableFormat from './TableFormat';
import TableWrapperFormat from './TableWrapperFormat';
import TableColgroupFormat from './TableColgroupFormat';

const Block = Quill.import('blots/block');

class TableColFormat extends Block {
    static create(value) {
        const { width, tableId, colId } = value;
        const node = super.create();

        node.setAttribute('width', width);
        node.dataset.tableId = tableId;
        node.dataset.colId = colId;

        return node;
    }

    getWidth() {
        return Number(this.domNode.getAttribute('width'));
    }

    colId() {
        return this.domNode.dataset.colId;
    }

    formats() {
        const { tableId, colId } = this.domNode.dataset;
        return {
            [this.statics.blotName]: {
                tableId,
                colId,
                width: this.domNode.getAttribute('width'),
            },
        };
    }

    format(name, value) {
        if (name != null) {
            if (value) {
                this.domNode.setAttribute(name, value ?? 'auto');
            } else {
                this.domNode.removeAttribute(name);
            }
        } else {
            super.format(name, value);
        }
    }

    optimize() {
        super.optimize();

        const parent = this.parent;
        if (parent != null && parent.statics.blotName != TableColgroupFormat.blotName) {
            // we will mark td position, put in table and replace mark
            const mark = Parchment.create('block');

            this.parent.insertBefore(mark, this.next);
            const tableWrapper = Parchment.create(TableWrapperFormat.blotName, this.domNode.dataset.tableId);
            const table = Parchment.create(TableFormat.blotName, this.domNode.dataset.tableId);

            const tableColgroup = Parchment.create(TableColgroupFormat.blotName);

            tableColgroup.appendChild(this);
            table.appendChild(tableColgroup);
            tableWrapper.appendChild(table);

            // 最终显示 tableWrapper
            tableWrapper.replace(mark);
        }
        const next = this.next;
        const { tableId: ttableId, colId: tcolId } = this.domNode.dataset;
        if (
            next != null &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.dataset.tableId === ttableId &&
            next.domNode.dataset.colId === tcolId
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }

    html() {
        return this.domNode.outerHTML;
    }
}
TableColFormat.blotName = 'col';
TableColFormat.tagName = 'col';
// 嵌套合并必须有 scope
TableColFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableColFormat;
