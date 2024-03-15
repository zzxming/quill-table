import Quill from 'quill';
import { blotName } from '../../assets/const';
const Parchment = Quill.import('parchment');
const ListItem = Quill.import('formats/list/item');

class ListRewrite extends ListItem {
    replaceWith(name, value) {
        this.parent.isolate(this.offset(this.parent), this.length());
        if (name === this.parent.statics.blotName) {
            this.parent.replaceWith(name, value);
            return this;
        } else {
            if (name === blotName.tableCellInner) {
                let replacement = typeof name === 'string' ? Parchment.create(name, value) : name;
                replacement.replace(this.parent);
                this.attributes.copy(replacement);
                return replacement;
            }
            return super.replaceWith(name, value);
        }
    }
}
export default ListRewrite;
