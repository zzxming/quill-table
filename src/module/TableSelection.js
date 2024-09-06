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
    this.table = table;
    this.quill = quill;
    this.options = options;
    this.optionsMerge();
    if (!table) return null;

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

  // TODO: preventDefault select
  mouseDownHandler(mousedownEvent) {
    const { button, target, clientX, clientY } = mousedownEvent;
    const closestTable = target.closest('.ql-table');
    if (button !== 0 || !closestTable) return;

    const startTableId = closestTable.dataset.tableId;
    const startPoint = { x: clientX, y: clientY };
    this.startScrollX = this.table.parentNode.scrollLeft;
    this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
    this.showSelection();

    const mouseMoveHandler = (mousemoveEvent) => {
      const { button, target, clientX, clientY } = mousemoveEvent;
      if (this.selectedTds.length > 1) {
        mousemoveEvent.preventDefault();
      }
      const closestTable = target.closest('.ql-table');
      if (
        button !== 0
        || !closestTable
        || closestTable.dataset.tableId !== startTableId
      ) {
        return;
      }

      this.dragging = true;
      const movePoint = { x: clientX, y: clientY };
      this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
      if (this.selectedTds.length > 1) {
        this.quill.blur();
      }
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
    // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
    const tableContainer = Quill.find(this.table);
    if (!tableContainer) return [];
    const tableCells = new Set(tableContainer.descendants(TableCellFormat));

    // set boundary to initially mouse move rectangle
    let boundary = {
      x: Math.min(endPoint.x, startPoint.x),
      y: Math.min(endPoint.y, startPoint.y),
      x1: Math.max(endPoint.x, startPoint.x),
      y1: Math.max(endPoint.y, startPoint.y),
    };
    const selectedCells = new Set();
    let findEnd = true;
    // loop all cells to find correct boundary
    while (findEnd) {
      findEnd = false;
      for (const cell of tableCells) {
        if (!cell.__rect) {
          cell.__rect = cell.domNode.getBoundingClientRect();
        }
        // Determine whether the cell intersects with the current boundary
        const { x, y, right, bottom } = cell.__rect;
        if (isRectanglesIntersect(boundary, { x, y, x1: right, y1: bottom }, ERROR_LIMIT)) {
          // add cell to selected
          selectedCells.add(cell);
          tableCells.delete(cell);
          // update boundary
          boundary = {
            x: Math.min(boundary.x, x),
            y: Math.min(boundary.y, y),
            x1: Math.max(boundary.x1, right),
            y1: Math.max(boundary.y1, bottom),
          };
          // recalculate boundary last cells
          findEnd = true;
          break;
        }
      }
    }
    for (const cell of [...selectedCells, ...tableCells]) {
      delete cell.__rect;
    }
    // save result boundary relative to the editor
    this.boundary = getRelativeRect({
      ...boundary,
      width: boundary.x1 - boundary.x,
      height: boundary.y1 - boundary.y,
    }, this.quill.root.parentNode);
    return Array.from(selectedCells).map(cell => cell.getCellInner());
  }

  updateSelection() {
    if (this.selectedTds.length === 0) return;
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
