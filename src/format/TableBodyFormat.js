import Quill from 'quill';
const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

import TableColgroupFormat from './TableColgroupFormat';

class TableBodyFormat extends Container {
	optimize() {
		super.optimize();
		let next = this.next;
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
		setTimeout(() => {
			// 所有行被删除后触发删除 body, 在此删除 colgroup, 继续清除 table 内元素
			if (!this.children.length && this.prev?.statics?.blotName === TableColgroupFormat.blotName) {
				this.prev.deleteAt(index, length);
			}
		}, 0);
	}
}
TableBodyFormat.blotName = 'tbody';
TableBodyFormat.tagName = 'tbody';
// 嵌套必须有 scope
TableBodyFormat.scope = Parchment.Scope.BLOCK_BLOT;

export default TableBodyFormat;
