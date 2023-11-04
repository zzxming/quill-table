import { css } from '../utils';

const MENU_ITEMS_DEFAULT = {
	isnertColumnLeft: {
		text: '在左侧插入一列',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.appendCol();
			this.quill.theme.tableToolTip.curTableId = null;
			this.quill.theme.tableToolTip.hide();
		},
	},
	isnertColumnRight: {
		text: '在右侧插入一列',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.appendCol(true);
			this.quill.theme.tableToolTip.curTableId = null;
			this.quill.theme.tableToolTip.hide();
		},
	},
	insertRowTop: {
		text: '在上方插入一行',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.appendRow();
		},
	},
	insertRowBottom: {
		text: '在下方插入一行',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.appendRow(true);
		},
	},
	removeRow: {
		text: '删除所在行',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.removeRow();
		},
	},
	removeCol: {
		text: '删除所在列',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.removeCol();
			this.quill.theme.tableToolTip.curTableId = null;
			this.quill.theme.tableToolTip.hide();
		},
	},
	removeTable: {
		text: '删除表格',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.removeTable();
			this.quill.theme.tableToolTip.hide();
		},
	},
	mergeCell: {
		text: '合并单元格',
		handler() {
			const tableModule = this.quill.getModule('table');
			tableModule.mergeCells();
			this.quill.theme.tableToolTip.hide();
			this.tableSelection.clearSelection();
		},
	},
};
const MENU_MIN_HEIHGT = 150;
const MENU_WIDTH = 200;

export default class TableOperationMenu {
	constructor(params, quill, options) {
		const tableModule = quill.getModule('table');
		this.tableSelection = tableModule.tableSelection;
		this.table = params.table;
		this.quill = quill;
		this.options = options;
		this.menuItems = Object.assign({}, MENU_ITEMS_DEFAULT, options?.items ?? {});
		// this.tableColumnTool = tableModule.columnTool
		this.boundary = this.tableSelection.boundary;
		this.selectedTds = this.tableSelection.selectedTds;
		this.destroyHandler = this.destroy.bind(this);

		this.destroyHandler = this.destroy.bind(this);
		this.menuInitial(params);
		this.mount();

		document.addEventListener('click', this.destroyHandler, false);
	}

	mount() {
		document.body.appendChild(this.domNode);
	}

	menuInitial({ table, left, top }) {
		this.domNode = document.createElement('div');
		this.domNode.classList.add('ql-table-operation-menu');

		css(this.domNode, {
			position: 'absolute',
			left: `${left}px`,
			top: `${top}px`,
			'min-height': `${MENU_MIN_HEIHGT}px`,
			width: `${MENU_WIDTH}px`,
		});

		for (let name in this.menuItems) {
			if (this.menuItems[name]) {
				this.domNode.appendChild(
					this.menuItemCreator(Object.assign({}, MENU_ITEMS_DEFAULT[name], this.menuItems[name]))
				);

				if (['insertRowBottom', 'removeTable'].indexOf(name) > -1) {
					this.domNode.appendChild(dividingCreator());
				}
			}
		}

		// create dividing line
		function dividingCreator() {
			const dividing = document.createElement('div');
			dividing.classList.add('ql-table-operation-menu-dividing');
			return dividing;
		}

		// create subtitle for menu
		function subTitleCreator(title) {
			const subTitle = document.createElement('div');
			subTitle.classList.add('ql-table-operation-menu-subtitle');
			subTitle.innerText = title;
			return subTitle;
		}
	}

	destroy() {
		this.domNode.remove();
		document.removeEventListener('click', this.destroyHandler, false);
		return null;
	}

	menuItemCreator({ text, iconSrc, handler }) {
		const node = document.createElement('div');
		node.classList.add('ql-table-operation-menu-item');

		const textSpan = document.createElement('span');
		textSpan.classList.add('ql-table-operation-menu-text');
		textSpan.innerText = text;

		node.appendChild(textSpan);
		node.addEventListener('click', handler.bind(this), false);
		return node;
	}
}
