import Quill from 'quill';
import { blotName } from '../assets/const';
import { ContainerFormat } from './ContainerFormat';

const Parchment = Quill.import('parchment');

class TableColFormat extends ContainerFormat {
  static create(value) {
    const { width, tableId, colId, full } = value;
    const node = super.create();
    node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
    full && (node.dataset.full = full);
    node.dataset.tableId = tableId;
    node.dataset.colId = colId;
    node.setAttribute('contenteditable', false);
    return node;
  }

  get width() {
    const width = this.domNode.getAttribute('width');
    return Number.parseFloat(width);
  }

  set width(value) {
    const width = Number.parseFloat(value);
    return this.domNode.setAttribute('width', `${width}${this.full ? '%' : 'px'}`);
  }

  get colId() {
    return this.domNode.dataset.colId;
  }

  get full() {
    return Object.hasOwn(this.domNode.dataset, 'full');
  }

  formats() {
    const { tableId, colId } = this.domNode.dataset;
    return {
      [this.statics.blotName]: {
        tableId,
        colId,
        width: this.domNode.getAttribute('width'),
        full: Object.hasOwn(this.domNode.dataset, 'full'),
      },
    };
  }

  optimize() {
    super.optimize();

    const parent = this.parent;
    if (parent != null && parent.statics.blotName !== blotName.tableColGroup) {
      const mark = Parchment.create('block');
      this.parent.insertBefore(mark, this.next);

      const tableWrapper = Parchment.create(blotName.tableWrapper, this.domNode.dataset.tableId);
      const table = Parchment.create(blotName.table, this.domNode.dataset.tableId);

      this.full && (table.full = true);

      const tableColgroup = Parchment.create(blotName.tableColGroup);

      tableColgroup.appendChild(this);
      table.appendChild(tableColgroup);
      tableWrapper.appendChild(table);

      tableWrapper.replace(mark);
    }
    const next = this.next;
    const { tableId: ttableId, colId: tcolId } = this.domNode.dataset;
    if (
      next != null
      && next.statics.blotName === this.statics.blotName
      && next.domNode.tagName === this.domNode.tagName
      && next.domNode.dataset.tableId === ttableId
      && next.domNode.dataset.colId === tcolId
    ) {
      next.moveChildren(this);
      next.remove();
    }
  }
}
TableColFormat.blotName = blotName.tableCol;
TableColFormat.tagName = 'col';
TableColFormat.scope = Parchment.Scope.BLOCK_BLOT;

export { TableColFormat };
