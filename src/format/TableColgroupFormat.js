import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableColgroupFormat extends Container {
    optimize() {
        super.optimize();
        const next = this.next;
        if (
            next != null &&
            next.prev === this &&
            next.statics.blotName === this.statics.blotName &&
            next.domNode.tagName === this.domNode.tagName
        ) {
            next.moveChildren(this);
            next.remove();
        }
    }

    findCol(index) {
        const next = this.children.iterator();
        let i = 0;
        let cur;
        while ((cur = next())) {
            if (i === index) {
                break;
            }
            i++;
        }
        return cur;
    }

    deleteAt(index, length) {
        setTimeout(() => {
            if (this.next) return;
            super.deleteAt(index, length);
            // 删除所有 col, 清除完后 table 下没有任何子元素, table 元素会被删除
            this.children.forEach((c) => {
                c.deleteAt(0, 1);
            });
        }, 0);
    }
}
TableColgroupFormat.blotName = 'colgroup';
TableColgroupFormat.tagName = 'colgroup';
// 嵌套必须有 scope
TableColgroupFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableColgroupFormat;
