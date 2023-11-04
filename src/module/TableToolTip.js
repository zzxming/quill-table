import Emitter from 'quill/core/emitter';
import { Range } from 'quill/core/selection';

import TableWrapperFormat from '../format/TableWrapperFormat';
import TableBodyFormat from '../format/TableBodyFormat';
import TableColgroupFormat from '../format/TableColgroupFormat';

const TIPHEIGHT = 12;
const CELLMINWIDTH = 26;

export default class TableTooltip {
	constructor(quill, options) {
		this.quill = quill;
		this.options = options;
		this.bounds = options.bounds;
		this.boundsContainer = document.body;

		this.tableWrapper = null;
		this.table = null;
		this.curTableId = '';
		this.focusTableChange = false;
		// this.rowCount = 0;
		this.tableCols = [];
		this.scrollHandler = [];

		this.tableDisableToolHandlers = {};

		this.root = quill.addContainer('ql-table-tooltip');
		this.root.style.height = TIPHEIGHT + 'px';

		const resizeObserver = new ResizeObserver((entries) => {
			this.hide();
		});
		resizeObserver.observe(this.quill.root);

		this.hide();
		this.listen();
	}

	listen() {
		this.quill.on(Emitter.events.SELECTION_CHANGE, (range, oldRange, source) => {
			if (range == null) return;
			if (range.length === 0 && source === Emitter.sources.USER) {
				let [tableWrapper, offset] = this.quill.scroll.descendant(TableWrapperFormat, range.index);
				if (tableWrapper !== null) {
					// 此时在 table 内, 禁用部分功能
					this.disableFromTable();

					this.tableWrapper = tableWrapper;
					this.table = tableWrapper.children.head;
					// 找到 tbody
					let tbody = tableWrapper.children.tail;
					while (tbody && tbody.statics.blotName !== TableBodyFormat.blotName) {
						tbody = tbody.children?.tail;
					}

					let tableCols = tableWrapper.children.head?.children?.head;
					if (tableCols.statics.blotName === TableColgroupFormat.blotName && tableCols.children.length) {
						this.tableCols = tableCols.children.map((col) => col);
					}

					let curTableId = tableWrapper.children.head.tableId();
					if (this.curTableId !== curTableId) {
						this.clearScrollEvent();
						this.focusTableChange = true;
						// 表格滚动同步事件
						this.addScrollEvent(
							this.tableWrapper.domNode,
							this.scrollSync.bind(this, this.tableWrapper.domNode)
						);
					}
					this.curTableId = curTableId;

					this.tableRange = new Range(range.index - offset, tableWrapper.length());
					this.show();
					this.position(this.quill.getBounds(this.tableRange));
					return;
				} else {
					delete this.tableRange;
				}
			}
			this.hide();
			this.enableFromTable();
		});
	}

	disableFromTable() {
		const toolbar = this.quill.getModule('toolbar');
		// 防止重复触发覆盖保存事件
		if (toolbar.disableByTable) return;
		toolbar.disableByTable = true;
		toolbar.container.classList.add('ql-disabled-table');
		// 去除 toolbar 对应 module 的 handler 事件, 保存在 tableDisableToolHandlers
		for (let i = 0; i < TableTooltip.disableToolNames.length; i++) {
			this.tableDisableToolHandlers[TableTooltip.disableToolNames[i]] =
				toolbar.handlers[TableTooltip.disableToolNames[i]];
			// 不要使用 delete 删除属性
			toolbar.handlers[TableTooltip.disableToolNames[i]] = () => {};
		}
	}

	enableFromTable() {
		const toolbar = this.quill.getModule('toolbar');
		toolbar.container.classList.remove('ql-disabled-table');
		// 根据 tableDisableToolHandlers 恢复 handler
		for (let k in this.tableDisableToolHandlers) {
			toolbar.handlers[k] = this.tableDisableToolHandlers[k];
		}
		this.tableDisableToolHandlers = {};
		toolbar.disableByTable = false;
	}

	scrollSync(dom, e) {
		this.root.scrollLeft = dom.scrollLeft;
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

	position(reference) {
		let left = 15; // editor 的左右 padding
		let top = reference.top + this.quill.container.scrollTop - 11;
		this.root.style.left = left + 1 + 'px';
		this.root.style.top = top + 'px';
	}

	show() {
		if (this.focusTableChange && this.tableCols) {
			let tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
			// 加 tableId 用于 table 删除时隐藏 tooltip
			this.root.dataset.tableId = this.tableWrapper.tableId();
			this.root.innerHTML = [...this.tableCols]
				.map((col) => {
					let curColWidth = col.getWidth();
					return `<div class="ql-table-col-header" style="width: ${curColWidth}px">
						<div class="ql-table-col-separator" style="height: ${tableWrapperRect.height + TIPHEIGHT - 3}px"></div>
					</div>`; // -3 为 border-width: 2, top: 1
				})
				.join('');
			// 同步表格宽度, 使便于滚动同步
			this.root.style.width = tableWrapperRect.width + 'px';
			setTimeout(() => {
				this.scrollSync(this.tableWrapper.domNode);
			}, 0);
			this.focusTableChange = false;

			this.bindDrag();
		}

		this.root.classList.remove('ql-hidden');
	}

	hide() {
		this.root.classList.add('ql-hidden');
	}

	bindDrag() {
		let tipColBreak = null;
		let curColIndex = -1;
		let tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header'));
		let tableColHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-col-separator'));

		// 设置每个 drag 下标对应 col 下标，最右会多一个 drag, 与 better-table 的类似
		// 根据当前的 col left 配合 pageX 计算, 使保证最小宽度
		const handleMousemove = (e) => {
			// getBoundingClientRect 的 top/bottom/left/right, 这是根据视口距离
			const rect = tableColHeads[curColIndex].getBoundingClientRect();
			let resX = e.pageX;
			if (e.pageX - rect.left < CELLMINWIDTH) {
				resX = rect.left + CELLMINWIDTH;
			}
			resX = Math.floor(resX);
			tipColBreak.style.left = resX + 'px';
			tipColBreak.dataset.w = resX - rect.left;
			// console.log(colHeadRect, curColIndex);
		};
		const handleMouseup = (e) => {
			console.log(e);
			const w = parseInt(tipColBreak.dataset.w);
			this.table.domNode.style.width =
				parseFloat(this.table.domNode.style.width) -
				parseFloat(tableColHeads[curColIndex].style.width) +
				w +
				'px';
			tableColHeads[curColIndex].style.width = w + 'px';
			this.tableCols[curColIndex].format('width', w);

			document.body.removeChild(tipColBreak);
			tipColBreak = null;

			curColIndex = -1;
			document.removeEventListener('mouseup', handleMouseup);
			document.removeEventListener('mousemove', handleMousemove);
		};
		const handleMousedown = (i, e) => {
			document.addEventListener('mouseup', handleMouseup);
			document.addEventListener('mousemove', handleMousemove);
			curColIndex = i;

			const tableRect = this.tableWrapper.domNode.getBoundingClientRect();
			const divDom = document.createElement('div');
			divDom.classList.add('ql-table-drag-line');
			divDom.style.top = tableRect.y - TIPHEIGHT + 'px';
			divDom.style.left = e.pageX + 'px';
			divDom.style.height = tableRect.height + TIPHEIGHT + 'px';
			document.body.appendChild(divDom);

			if (tipColBreak) document.body.removeChild(tipColBreak);
			tipColBreak = divDom;
		};
		tableColHeadSeparators.map((el, i) => el.addEventListener('mousedown', handleMousedown.bind(this, i)));
	}
}

// 在 table 内时禁用的 tool 的 name
TableTooltip.disableToolNames = ['table'];
