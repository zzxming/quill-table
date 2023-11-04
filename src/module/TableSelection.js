// 以 ql-better-table 的 table-selection.js 为修改基础

import Quill from 'quill';
import TableCell from '../format/TableCellFormat';
import { css, getRelativeRect, computeBoundaryFromRects } from '../utils';

const PRIMARY_COLOR = '#0589f3';
const LINE_POSITIONS = ['left', 'right', 'top', 'bottom'];
const ERROR_LIMIT = 2;

export default class TableSelection {
	constructor(table, quill, options) {
		if (!table) return null;
		this.table = table;
		this.quill = quill;
		this.options = options;
		this.boundary = {};
		// 选中的 cell
		this.selectedTds = [];
		this.dragging = false;
		this.selectingHandler = this.mouseDownHandler.bind(this);
		this.clearSelectionHandler = this.clearSelection.bind(this);

		this.scrollHandler = [];

		this.helpLinesInitial();
		this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
		this.quill.on('text-change', this.clearSelectionHandler);
	}

	addScrollEvent(dom, handle) {
		dom.addEventListener('scroll', handle);
		this.scrollHandler.push([dom, handle]);
	}

	clearScrollEvent() {
		for (let i = 0; i < this.scrollHandler.length; i++) {
			let [dom, handle] = this.scrollHandler[i];
			dom.removeEventListener('scroll', handle);
		}
		this.scrollHandler = [];
	}

	// 初始化边框 dom
	helpLinesInitial() {
		let parent = this.quill.root.parentNode;
		LINE_POSITIONS.forEach((direction) => {
			this[direction] = document.createElement('div');
			this[direction].classList.add('qlbt-selection-line');
			this[direction].classList.add('qlbt-selection-line-' + direction);
			css(this[direction], {
				position: 'absolute',
				display: 'none',
				'background-color': PRIMARY_COLOR,
			});
			parent.appendChild(this[direction]);
		});
	}

	mouseDownHandler(e) {
		if (e.button !== 0 || !e.target.closest('.ql-table')) return;

		const mouseMoveHandler = (e) => {
			if (e.button !== 0 || !e.target.closest('.ql-table')) return;
			const endTd = e.target.closest('td[data-row-id]');
			const endTdRect = getRelativeRect(endTd.getBoundingClientRect(), this.quill.root.parentNode);
			this.boundary = computeBoundaryFromRects(startTdRect, endTdRect);
			this.correctBoundary();
			this.selectedTds = this.computeSelectedTds();
			this.repositionHelpLines();

			if (startTd !== endTd) {
				this.quill.blur();
			}
		};

		const mouseUpHandler = (e) => {
			document.body.removeEventListener('mousemove', mouseMoveHandler, false);
			document.body.removeEventListener('mouseup', mouseUpHandler, false);
			this.dragging = false;
		};

		document.body.addEventListener('mousemove', mouseMoveHandler, false);
		document.body.addEventListener('mouseup', mouseUpHandler, false);

		const startTd = e.target.closest('td[data-row-id]');
		const startTdRect = getRelativeRect(startTd.getBoundingClientRect(), this.quill.root.parentNode);
		this.dragging = true;
		this.boundary = computeBoundaryFromRects(startTdRect, startTdRect);
		this.correctBoundary();
		this.selectedTds = this.computeSelectedTds();
		this.repositionHelpLines();

		this.addScrollEvent(this.table.parentNode, () => {
			// 处理 boundary, 使滚动时 left 等跟随滚动
			this.repositionHelpLines();
		});
	}

	computeSelectedTds() {
		const tableContainer = Quill.find(this.table);
		const tableCells = tableContainer.descendants(TableCell);

		return tableCells.reduce((selectedCells, tableCell) => {
			let { x, y, width, height } = getRelativeRect(
				tableCell.domNode.getBoundingClientRect(),
				this.quill.root.parentNode
			);
			let isCellIncluded =
				x + ERROR_LIMIT >= this.boundary.x &&
				x - ERROR_LIMIT + width <= this.boundary.x1 &&
				y + ERROR_LIMIT >= this.boundary.y &&
				y - ERROR_LIMIT + height <= this.boundary.y1;

			if (isCellIncluded) {
				selectedCells.push(tableCell);
			}

			return selectedCells;
		}, []);
	}

	correctBoundary() {
		const tableContainer = Quill.find(this.table);
		const tableCells = tableContainer.descendants(TableCell);

		tableCells.forEach((tableCell) => {
			let { x, y, width, height } = getRelativeRect(
				tableCell.domNode.getBoundingClientRect(),
				this.quill.root.parentNode
			);

			let isCellIntersected =
				((x + ERROR_LIMIT >= this.boundary.x && x + ERROR_LIMIT <= this.boundary.x1) ||
					(x - ERROR_LIMIT + width >= this.boundary.x && x - ERROR_LIMIT + width <= this.boundary.x1)) &&
				((y + ERROR_LIMIT >= this.boundary.y && y + ERROR_LIMIT <= this.boundary.y1) ||
					(y - ERROR_LIMIT + height >= this.boundary.y && y - ERROR_LIMIT + height <= this.boundary.y1));

			if (isCellIntersected) {
				this.boundary = computeBoundaryFromRects(this.boundary, { x, y, width, height });
			}
		});
		this.scrollX = this.table.parentNode.scrollLeft;
	}
	// 边框样式显示
	repositionHelpLines() {
		const tableViewScrollLeft = this.table.parentNode.scrollLeft;
		const scrollTop = this.quill.root.parentNode.scrollTop;

		css(this.left, {
			display: 'block',
			left: `${this.boundary.x + (this.scrollX - tableViewScrollLeft) - 1}px`,
			top: `${scrollTop * 2 + this.boundary.y}px`,
			height: `${this.boundary.height + 1}px`,
			width: '1px',
		});

		css(this.right, {
			display: 'block',
			left: `${this.boundary.x1 + (this.scrollX - tableViewScrollLeft)}px`,
			top: `${scrollTop * 2 + this.boundary.y}px`,
			height: `${this.boundary.height + 1}px`,
			width: '1px',
		});

		css(this.top, {
			display: 'block',
			left: `${this.boundary.x + (this.scrollX - tableViewScrollLeft) - 1}px`,
			top: `${scrollTop * 2 + this.boundary.y}px`,
			width: `${this.boundary.width + 1}px`,
			height: '1px',
		});

		css(this.bottom, {
			display: 'block',
			left: `${this.boundary.x + (this.scrollX - tableViewScrollLeft) - 1}px`,
			top: `${scrollTop * 2 + this.boundary.y1 + 1}px`,
			width: `${this.boundary.width + 1}px`,
			height: '1px',
		});
	}

	clearSelection() {
		this.boundary = {};
		this.selectedTds = [];
		LINE_POSITIONS.forEach((direction) => {
			this[direction] &&
				css(this[direction], {
					display: 'none',
				});
		});
		this.clearScrollEvent();
	}

	destroy() {
		LINE_POSITIONS.forEach((direction) => {
			this[direction].remove();
			this[direction] = null;
		});
		this.clearScrollEvent();

		this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);

		this.quill.off('text-change', this.clearSelectionHandler);

		return null;
	}
}
