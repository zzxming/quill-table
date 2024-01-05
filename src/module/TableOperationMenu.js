import { css } from '../utils';

const MENU_ITEMS_DEFAULT = {
    insertColumnLeft: {
        text: '在左侧插入一列',
        handler() {
            const tableModule = this.quill.getModule('table');
            tableModule.appendCol();
            this.quill.theme.tableToolTip.curTableId = null;
            this.quill.theme.tableToolTip.hide();
        },
    },
    insertColumnRight: {
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

/*
    options = {
        items: {
           functionName: {
                text: '显示文字',
                handle() {},    // 触发事件
                groupEnd: boolean, // 是否显示分隔线，最后一项即使指定了此项也不会显示
                subTitle: '显示子标题',
            }
        }
    }
*/
export default class TableOperationMenu {
    constructor(params, quill, options) {
        const tableModule = quill.getModule('table');
        this.tableSelection = tableModule.tableSelection;
        this.table = params.table;
        this.quill = quill;
        this.options = options;
        this.menuItems = {};
        this.optionsMerge();

        this.boundary = this.tableSelection.boundary;
        this.selectedTds = this.tableSelection.selectedTds;

        this.destroyHandler = this.destroy.bind(this);
        this.menuInitial(params);
        this.mount();

        document.addEventListener('click', this.destroyHandler, false);
    }

    optionsMerge() {
        if (this.options.replaceItems) {
            this.menuItems = this.options?.items ?? {};
        } else {
            this.menuItems = Object.assign({}, MENU_ITEMS_DEFAULT, this.options?.items ?? {});
        }
    }

    mount() {
        document.body.appendChild(this.domNode);
    }

    menuInitial({ table, row, cell, left, top }) {
        this.domNode = document.createElement('div');
        this.domNode.classList.add('ql-table-operation-menu');

        const style = {
            position: 'absolute',
            'min-height': `${MENU_MIN_HEIHGT}px`,
            width: `${MENU_WIDTH}px`,
        };
        const { innerWidth: width, innerHeight: height } = window;
        left > width - MENU_WIDTH ? (style.right = `${width - left}px`) : (style.left = `${left}px`);
        top > height - MENU_MIN_HEIHGT ? (style.bottom = `${height - top}px`) : (style.top = `${top}px`);
        css(this.domNode, style);

        for (const name in this.menuItems) {
            if (this.menuItems[name]) {
                if (this.menuItems[name].subTitle) {
                    this.domNode.appendChild(subTitleCreator(this.menuItems[name].subTitle));
                }

                this.domNode.appendChild(
                    this.menuItemCreator(Object.assign({}, MENU_ITEMS_DEFAULT[name], this.menuItems[name]))
                );

                if (
                    ['insertRowBottom', 'removeTable', 'mergeCell'].indexOf(name) > -1 ||
                    this.menuItems[name].groupEnd
                ) {
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

        if (iconSrc) {
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('ql-table-operation-menu-icon');
            iconSpan.innerHTML = iconSrc;
            node.appendChild(iconSpan);
        }

        const textSpan = document.createElement('span');
        textSpan.classList.add('ql-table-operation-menu-text');
        textSpan.innerText = text;

        node.appendChild(textSpan);
        node.addEventListener('click', handler.bind(this), false);
        return node;
    }
}
