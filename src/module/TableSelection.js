// 以 ql-better-table 的 table-selection.js 为修改基础

import Quill from 'quill';
import { TableCellFormat } from '../format';
import { css, getRelativeRect, isRectanglesIntersect } from '../utils';

let PRIMARY_COLOR = '#0589f3';
const ERROR_LIMIT = 2;

/*
	options = {
		primaryColor: Hex color code
	}
*/
export class TableSelection {
  constructor(table, quill, options = {}) {
    if (!table) return null;
    this.table = table;
    this.quill = quill;
    this.options = options;
    this.optionsMerge();

    this.startScrollX = 0;
    this.boundary = {};
    // 选中的 cell
    this.selectedTds = [];
    this.dragging = false;
    this.selectingHandler = this.mouseDownHandler.bind(this);
    this.cellSelect = null; // selection 显示边框
    this.scrollHandler = [];
    this.helpLinesInitial();

    const resizeObserver = new ResizeObserver(() => {
      this.hideSelection();
    });
    resizeObserver.observe(this.quill.root);

    this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
    this.closeHandler = this.hideSelection.bind(this);
    this.quill.on(Quill.events.TEXT_CHANGE, this.closeHandler);
  }

  optionsMerge() {
    this.options?.primaryColor && (PRIMARY_COLOR = this.options.primaryColor);
  }

  addScrollEvent(dom, handle) {
    dom.addEventListener('scroll', handle);
    this.scrollHandler.push([dom, handle]);
  }

  clearScrollEvent() {
    for (let i = 0; i < this.scrollHandler.length; i++) {
      const [dom, handle] = this.scrollHandler[i];
      dom.removeEventListener('scroll', handle);
    }
    this.scrollHandler = [];
  }

  // 初始化边框 dom
  helpLinesInitial() {
    this.cellSelect = this.quill.addContainer('ql-table-selection_line');
    css(this.cellSelect, {
      'border-color': PRIMARY_COLOR,
    });
  }

  mouseDownHandler(e) {
    if (e.button !== 0 || !e.target.closest('.ql-table')) return;

    const startTableId = e.target.closest('.ql-table').dataset.tableId;
    this.dragging = true;
    const startPoint = { x: e.clientX, y: e.clientY };
    this.startScrollX = this.table.parentNode.scrollLeft;
    this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
    this.showSelection();

    const mouseMoveHandler = (e) => {
      if (this.selectedTds.length > 1) {
        e.preventDefault();
      }
      if (
        e.button !== 0
        || !e.target.closest('.ql-table')
        || e.target.closest('.ql-table').dataset.tableId !== startTableId
      ) {
        return;
      }
      const movePoint = { x: e.clientX, y: e.clientY };
      this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
      this.updateSelection();
    };
    const mouseUpHandler = () => {
      document.body.removeEventListener('mousemove', mouseMoveHandler, false);
      document.body.removeEventListener('mouseup', mouseUpHandler, false);
      this.dragging = false;
    };
    document.body.addEventListener('mousemove', mouseMoveHandler, false);
    document.body.addEventListener('mouseup', mouseUpHandler, false);
  }

  computeSelectedTds(startPoint, endPoint) {
    const tableContainer = Quill.find(this.table);
    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableCells = tableContainer.descendants(TableCellFormat);

    // Find the cell that intersects with the rectangle enclosed from startPoint to movePoint
    const tempSelectCells = tableCells.reduce((selectedCells, tableCell) => {
      const rect = tableCell.domNode.getBoundingClientRect();
      const { x, y, width, height } = rect;
      tableCell.__rect = rect;
      if (isRectanglesIntersect(startPoint, endPoint, { x, y }, { x: x + width, y: y + height })) {
        selectedCells.push(tableCell);
      }
      return selectedCells;
    }, []);
    // Find the maximum enclosing edge based on intersecting cells
    const [y, x1, y1, x] = tempSelectCells.reduce((position, { __rect: rect }) => {
      position[0] = Math.min(position[0], rect.y);
      position[1] = Math.max(position[1], rect.x + rect.width);
      position[2] = Math.max(position[2], rect.y + rect.height);
      position[3] = Math.min(position[3], rect.x);
      return position;
    }, [Infinity, 0, 0, Infinity]);
    this.boundary = getRelativeRect({ x, y, width: x1 - x, height: y1 - y }, this.quill.root.parentNode);
    // Recalculate selected cells by boundary
    return tableCells.reduce((selectedCells, tableCell) => {
      const { x, y, width, height } = getRelativeRect(
        tableCell.domNode.getBoundingClientRect(),
        this.quill.root.parentNode,
      );
      const isCellIncluded = x + ERROR_LIMIT >= this.boundary.x
        && x - ERROR_LIMIT + width <= this.boundary.x1
        && y + ERROR_LIMIT >= this.boundary.y
        && y - ERROR_LIMIT + height <= this.boundary.y1;

      if (isCellIncluded) {
        selectedCells.push(tableCell.getCellInner());
      }
      return selectedCells;
    }, []);
  }

  updateSelection() {
    const tableViewScrollLeft = this.table.parentNode.scrollLeft;
    const scrollTop = this.quill.root.parentNode.scrollTop;

    css(this.cellSelect, {
      left: `${this.boundary.x + (this.startScrollX - tableViewScrollLeft) - 1}px`,
      top: `${scrollTop * 2 + this.boundary.y}px`,
      width: `${this.boundary.width + 1}px`,
      height: `${this.boundary.height + 1}px`,
    });
  }

  showSelection() {
    this.clearScrollEvent();

    css(this.cellSelect, { display: 'block' });
    this.updateSelection();

    this.addScrollEvent(this.table.parentNode, () => {
      this.updateSelection();
    });
    const srcollHide = () => {
      this.hideSelection();
      this.quill.root.removeEventListener('scroll', srcollHide);
    };
    this.addScrollEvent(this.quill.root, srcollHide);
  }

  hideSelection() {
    this.boundary = {};
    this.selectedTds = [];

    this.cellSelect && css(this.cellSelect, {
      display: 'none',
    });
    this.clearScrollEvent();
  }

  destroy() {
    this.hideSelection();
    this.cellSelect.remove();
    this.cellSelect = null;
    this.clearScrollEvent();

    this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);
    this.quill.off(Quill.events.TEXT_CHANGE, this.closeHandler);

    return null;
  }
}
