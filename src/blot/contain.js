import Quill from 'quill';
import { blotName } from '../assets/const/name';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class ContainBlot extends Container {
    static create(value) {
        const tagName = 'contain';
        const node = super.create(tagName);
        return node;
    }

    insertBefore(blot, ref) {
        if (blot.statics.blotName == this.statics.blotName) {
            super.insertBefore(blot.children.head, ref);
        } else {
            super.insertBefore(blot, ref);
        }
    }

    formats() {
        return { [this.statics.blotName]: this.statics.formats(this.domNode) };
    }

    replace(target) {
        if (target.statics.blotName !== this.statics.blotName) {
            const item = Parchment.create(this.statics.defaultChild);
            target.moveChildren(item);
            this.appendChild(item);
        }
        if (target.parent == null) return;
        super.replace(target);
    }
}

ContainBlot.blotName = blotName.contain;
ContainBlot.tagName = 'contain';
ContainBlot.scope = Parchment.Scope.BLOCK_BLOT;
ContainBlot.defaultChild = 'block';

export default ContainBlot;
