import Quill from 'quill';
import { blotName } from '../assets/const';
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
}
TableColgroupFormat.blotName = blotName.tableColGroup;
TableColgroupFormat.tagName = 'colgroup';
TableColgroupFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableColgroupFormat };
