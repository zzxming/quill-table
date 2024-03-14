import { css, isFunction, isString } from '../utils';
import { moduleName } from '../assets/const';

const MENU_ITEMS_DEFAULT = {
    insertColumnLeft: {
        text: '在左侧插入一列',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.appendCol();
            tableModule.hideTableTools();
        },
    },
    insertColumnRight: {
        text: '在右侧插入一列',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.appendCol(true);
            tableModule.hideTableTools();
        },
    },
    insertRowTop: {
        text: '在上方插入一行',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.appendRow();
            tableModule.hideTableTools();
        },
    },
    insertRowBottom: {
        text: '在下方插入一行',
        groupEnd: true,
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.appendRow(true);
            tableModule.hideTableTools();
        },
    },
    removeCol: {
        text: '删除所在列',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.removeCol();
            tableModule.hideTableTools();
        },
    },
    removeRow: {
        text: '删除所在行',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.removeRow();
            tableModule.hideTableTools();
        },
    },
    removeTable: {
        text: '删除表格',
        groupEnd: true,
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.removeTable();
            tableModule.hideTableTools();
        },
    },
    mergeCell: {
        text: '合并单元格',
        groupEnd: true,
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.mergeCells();
            tableModule.hideTableTools();
        },
    },
    setBackgroundColor: {
        subTitle: '设置背景颜色',
        text() {
            const tableModule = this.quill.getModule(moduleName.table);
            const input = document.createElement('input');
            input.type = 'color';
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            input.addEventListener('input', () => {
                tableModule.setBackgroundColor(input.value);
            });
            input.style.width = '100%';
            return input;
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
                iconSrc: string,    // icon url
                groupEnd: boolean, // 是否显示分隔线
                subTitle: '显示子标题',
            }
        }
    }
*/
export default class TableOperationMenu {
    constructor(params, quill, options = {}) {
        this.table = params.table;
        this.quill = quill;
        this.options = options;
        const tableModule = this.quill.getModule(moduleName.table);
        this.tableSelection = tableModule.tableSelection;
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
        if (this.options?.replaceItems) {
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

                if (this.menuItems[name].groupEnd) {
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

        if (isString(text)) {
            const textSpan = document.createElement('span');
            textSpan.classList.add('ql-table-operation-menu-text');
            textSpan.innerText = text;
            node.appendChild(textSpan);
        } else if (isFunction(text)) {
            node.appendChild(text.call(this));
        }

        isFunction(handler) && node.addEventListener('click', handler.bind(this), false);
        return node;
    }
}
