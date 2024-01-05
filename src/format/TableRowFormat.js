import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableRowFormat extends Container {
    static create(value) {
        let tagName = 'tr';
        let node = super.create(tagName);
        node.dataset.rowId = value;
        node.classList.add('ql-table-row');

        return node;
    }

    optimize() {
        super.optimize();
        let next = this.next;
        if (
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName &&
            next.domNode.dataset.tableId === this.domNode.dataset.tableId &&
            next.domNode.dataset.rowId === this.domNode.dataset.rowId
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }

    findTdByCol(index) {
        const table = this.parent.parent;
        const colsId = table.colsId();

        let next = this.children.iterator();
        let i;
        let cur;
        while ((cur = next())) {
            i = colsId.findIndex((id) => id === cur.domNode.dataset.colId);
            let curSpanCol = Number(cur.domNode.getAttribute('colspan')) || 1;
            if (i + curSpanCol - 1 >= index) {
                break;
            }
        }
        return cur;
    }

    exacFindTdByCol(index) {
        const table = this.parent.parent;
        const colsId = table.colsId();
        const targetColId = colsId[index];

        let next = this.children.iterator();
        let cur = null;
        while ((cur = next())) {
            if (cur.domNode.dataset.colId === targetColId) {
                return cur;
            }
        }
        return null;
    }

    rowId() {
        return this.domNode.dataset.rowId;
    }

    deleteAt(index, length) {
        super.deleteAt(index, length);
        // 删除此行前面的所有行, 从表格最后一行删就会把表格全部删除
        if (this.prev?.statics?.blotName === this.statics.blotName) {
            this.prev.deleteAt(index, length);
        }
        // 如果是表格第一行, 删除 tbody, 会使得无论从哪一行删除都会删除整个表格
        // else if (this.parent?.statics?.blotName === TableBodyFormat.blotName) {
        // 	this.parent.deleteAt(0, 1)
        // }
    }
}

TableRowFormat.blotName = 'tr';
TableRowFormat.tagName = 'tr';
TableRowFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableRowFormat;
