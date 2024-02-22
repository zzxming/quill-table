import Quill from 'quill';
import { blotName } from '../assets/const/name';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableBodyFormat extends Container {
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

    deleteAt(index, length) {
        if (index === 0 && length === this.length()) {
            this.parent.remove();
        }
        this.children.forEachAt(index, length, function (child, offset, length) {
            child.deleteAt(offset, length);
        });
    }
}
TableBodyFormat.blotName = blotName.tableBody;
TableBodyFormat.tagName = 'tbody';
TableBodyFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableBodyFormat;
