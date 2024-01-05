import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

import { blotName } from '../assets/const/name';

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
        super.deleteAt(index, length);
        this.parent.remove();
    }
}
TableBodyFormat.blotName = blotName.tableBody;
TableBodyFormat.tagName = 'tbody';
// 嵌套必须有 scope
TableBodyFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableBodyFormat;
