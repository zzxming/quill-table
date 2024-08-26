import Quill from 'quill';
import { blotName } from '../assets/const';

const Container = Quill.import('blots/container');
const Parchment = Quill.import('parchment');

class TableWrapperFormat extends Container {
  static create(value) {
    const node = super.create();

    node.dataset.tableId = value;

    node.addEventListener(
      'dragstart',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
      },
      true,
    );
    // 不允许拖拽进 table
    node.addEventListener('drop', (e) => {
      e.preventDefault();
    });
    // 修改拖拽进入时的鼠标样式
    node.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'none';
    });
    return node;
  }

  get tableId() {
    return this.domNode.dataset.tableId;
  }

  insertBefore(blot, ref) {
    if (blot.statics.blotName === this.statics.blotName) {
      // 合并
      super.insertBefore(blot.children.head, ref);
    }
    else if (this.statics.allowedChildren.some(child => child.blotName === blot.statics.blotName)) {
      // 允许子 blot
      super.insertBefore(blot, ref);
    }
    else {
      // 非允许子 blot, ref 为 null 是插入头, 否则插入尾
      if (ref) {
        this.prev ? this.prev.insertBefore(blot, null) : this.parent.insertBefore(blot, this);
      }
      else {
        this.next ? this.next.insertBefore(blot, ref) : this.parent.appendChild(blot);
      }
    }
  }

  optimize() {
    super.optimize();
    const next = this.next;
    if (
      next != null
      && next.prev === this
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
      && next.domNode.dataset.tableId === this.domNode.dataset.tableId
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }

  deleteAt(index, length) {
    super.deleteAt(index, length);
    // 删除 table 时隐藏当前 table 的 tooltip
    document.querySelector(`.ql-table-tooltip[data-table-id="${this.tableId}"]`)?.classList?.add('ql-hidden');
  }
}
TableWrapperFormat.blotName = blotName.tableWrapper;
TableWrapperFormat.tagName = 'p';
TableWrapperFormat.className = 'ql-table-wrapper';
TableWrapperFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableWrapperFormat };
