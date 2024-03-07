// 以 ql-better-table 的 table-selection.js 为修改基础

import Quill from 'quill';
import TableCellFormat from '../format/TableCellFormat';
import { css, getRelativeRect, computeBoundaryFromRects } from '../utils';

let PRIMARY_COLOR = '#0589f3';
const ERROR_LIMIT = 2;

/*
	options = {
		primaryColor: Hex color code
	}
*/
export default class TableSelection {
    constructor(table, quill, options = {}) {
        if (!table) return null;
        this.table = table;
        this.quill = quill;
        this.options = options;
        this.optionsMerge();

        this.boundary = {};
        // 选中的 cell
        this.selectedTds = [];
        this.dragging = false;
        this.selectingHandler = this.mouseDownHandler.bind(this);
        this.cellSelect = null; // selection 显示边框
        this.scrollHandler = [];
        this.helpLinesInitial();

        const resizeObserver = new ResizeObserver((entries) => {
            this.clearSelection();
        });
        resizeObserver.observe(this.quill.root);

        this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
        this.closeHandler = this.clearSelection.bind(this);
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
            let [dom, handle] = this.scrollHandler[i];
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

        const mouseMoveHandler = (e) => {
            // 根据 tableId 判断是否跨表格，跨表格不计算
            if (
                e.button !== 0 ||
                !e.target.closest('.ql-table') ||
                e.target.closest('.ql-table').dataset.tableId !== startTableId
            )
                return;

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
        // 选中范围计算任然使用 tableCell, tableCellInner 可滚动, width 会影响
        const tableCells = tableContainer.descendants(TableCellFormat);

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
                selectedCells.push(tableCell.getCellInner());
            }

            return selectedCells;
        }, []);
    }

    correctBoundary() {
        // 边框计算任然使用 tableCell, 有 padding 会影响
        const tableContainer = Quill.find(this.table);
        const tableCells = tableContainer.descendants(TableCellFormat);

        tableCells.forEach((tableCell) => {
            const { x, y, width, height } = getRelativeRect(
                tableCell.domNode.getBoundingClientRect(),
                this.quill.root.parentNode
            );

            const isCellIntersected =
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

        css(this.cellSelect, {
            display: 'block',
            left: `${this.boundary.x + (this.scrollX - tableViewScrollLeft) - 1}px`,
            top: `${scrollTop * 2 + this.boundary.y}px`,
            width: `${this.boundary.width + 1}px`,
            height: `${this.boundary.height + 1}px`,
        });
    }

    clearSelection() {
        this.boundary = {};
        this.selectedTds = [];

        this.cellSelect &&
            css(this.cellSelect, {
                display: 'none',
            });
        this.clearScrollEvent();
    }

    destroy() {
        this.clearSelection();
        this.cellSelect.remove();
        this.cellSelect = null;
        this.clearScrollEvent();

        this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);
        this.quill.off(Quill.events.TEXT_CHANGE, this.closeHandler);

        return null;
    }
}
