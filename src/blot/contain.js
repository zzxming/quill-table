import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class ContainBlot extends Container {
	static create(value) {
		let tagName = 'contain';
		let node = super.create(tagName);
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

ContainBlot.blotName = 'contain';
ContainBlot.tagName = 'contain';
ContainBlot.scope = Parchment.Scope.BLOCK_BLOT;
// 这里需要 defaultChild, 否则无法插入 table
ContainBlot.defaultChild = 'block';

export default ContainBlot;
