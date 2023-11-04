import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableWrapper extends Container {
	static create(value) {
		const node = super.create();

		node.dataset.tableId = value;

		return node;
	}

	tableId() {
		return this.domNode.dataset.tableId;
	}

	insertBefore(blot, ref) {
		if (blot.statics.blotName == this.statics.blotName) {
			// 合并
			super.insertBefore(blot.children.head, ref);
		} else if (this.statics.allowedChildren.find((child) => child.blotName === blot.statics.blotName)) {
			// 允许子 blot
			super.insertBefore(blot, ref);
		} else {
			// 非允许子 blot, ref 为 null 是插入头, 否则插入尾
			if (ref) {
				this.prev ? this.prev.insertBefore(blot, null) : this.parent.insertBefore(blot, this);
			} else {
				this.next ? this.next.insertBefore(blot, ref) : this.parent.appendChild(blot);
			}
		}
	}

	optimize() {
		super.optimize();
		let next = this.next;
		if (
			next != null &&
			next.prev === this &&
			next.statics.blotName === this.statics.blotName &&
			next.domNode.tagName === this.domNode.tagName &&
			next.domNode.dataset.tableId === this.domNode.dataset.tableId
		) {
			next.moveChildren(this);
			next.remove();
		}
	}

	deleteAt(index, length) {
		super.deleteAt(index, length);
		// 删除 table 时隐藏当前 table 的 tooltip
		document.querySelector(`.ql-table-tooltip[data-table-id="${this.tableId()}"]`)?.classList?.add('ql-hidden');
	}
}
TableWrapper.blotName = 'tableWrapper';
TableWrapper.tagName = 'p';
TableWrapper.className = 'ql-table-wrapper';
// 嵌套必须有 scope
TableWrapper.scope = Parchment.Scope.BLOCK_BLOT;

export default TableWrapper;
