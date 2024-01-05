import Quill from 'quill';
const Parchment = Quill.import('parchment');

import { blotName } from '../assets/const/name';

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

    get width() {
        return Number(this.domNode.getAttribute('width'));
    }
    set width(value) {
        return this.domNode.setAttribute('width', value);
    }

    get colId() {
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

    optimize() {
        super.optimize();

        const parent = this.parent;
        if (parent != null && parent.statics.blotName != blotName.tableColGroup) {
            // we will mark td position, put in table and replace mark
            const mark = Parchment.create('block');
            this.parent.insertBefore(mark, this.next);

            const tableWrapper = Parchment.create(blotName.tableWrapper, this.domNode.dataset.tableId);
            const table = Parchment.create(blotName.table, this.domNode.dataset.tableId);
            const tableColgroup = Parchment.create(blotName.tableColGroup);

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
TableColFormat.blotName = blotName.tableCol;
TableColFormat.tagName = 'col';
TableColFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableColFormat;
