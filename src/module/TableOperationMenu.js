import { css, isFunction, isString, isArray } from '../utils';
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
        text() {
            const subTitle = document.createElement('span');
            subTitle.innerText = '设置背景颜色';

            const tableModule = this.quill.getModule(moduleName.table);
            const input = document.createElement('input');
            input.type = 'color';
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            const tempCells = tableModule.tableSelection.selectedTds;
            input.addEventListener('input', () => {
                tableModule.setStyle({ backgroundColor: input.value }, tempCells);
            });
            input.style.marginLeft = 'auto';
            return [subTitle, input];
        },
    },
    clearBackgroundColor: {
        text: '清除背景颜色',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.setStyle({ backgroundColor: null }, tableModule.tableSelection.selectedTds);
        },
    },
    setBorderColor: {
        text() {
            const subTitle = document.createElement('span');
            subTitle.innerText = '设置边框颜色';

            const tableModule = this.quill.getModule(moduleName.table);
            const input = document.createElement('input');
            input.type = 'color';
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
            const tempCells = tableModule.tableSelection.selectedTds;
            input.addEventListener('input', () => {
                tableModule.setStyle({ borderColor: input.value }, tempCells);
            });
            input.style.marginLeft = 'auto';
            return [subTitle, input];
        },
    },
    clearBorderColor: {
        text: '清除边框颜色',
        handler() {
            const tableModule = this.quill.getModule(moduleName.table);
            tableModule.setStyle({ borderColor: null }, tableModule.tableSelection.selectedTds);
        },
    },
};
const MENU_MIN_HEIHGT = 150;

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
export class TableOperationMenu {
    constructor(params, quill, options = {}) {
        this.table = params.table;
        this.quill = quill;
        this.options = options;
        const tableModule = this.quill.getModule(moduleName.table);
        this.tableSelection = tableModule.tableSelection;
        this.menuItems = {};
        this.optionsMerge();
        this.optionsModify();

        this.boundary = this.tableSelection.boundary;
        this.selectedTds = this.tableSelection.selectedTds;

        this.destroyHandler = this.destroy.bind(this);
        this.menuInitial(params);

        document.addEventListener('click', this.destroyHandler, false);
    }

    optionsMerge() {
        if (this.options?.replaceItems) {
            this.menuItems = this.options?.items ?? {};
        } else if (!this.options?.modifyItems) {
            this.menuItems = Object.assign({}, MENU_ITEMS_DEFAULT, this.options?.items ?? {});
        } // The menuItems for the other condition is managed through the optionsModify function.
    }
    /**
     * Rewrite the whole functionality in case of 'setBorderColor' and 'setBackgroundColor' buttons.
     * @param {string} item The type of the button
     * @param {object} itemNewOptions Contains the user-defined attributes get used to override the buttons' properties
     */
    overrideButton(item, itemNewOptions) {
        MENU_ITEMS_DEFAULT[item] = {
            text() {
                const subTitle = document.createElement('span');
                subTitle.innerText = itemNewOptions.text;
                const tableModule = this.quill.getModule(moduleName.table);
                const input = document.createElement('input');
                input.type = 'color';
                input.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
                const tempCells = tableModule.tableSelection.selectedTds;
                input.addEventListener('input', () => {
                    switch (item) {
                        case 'setBorderColor':
                            tableModule.setStyle({ borderColor: input.value }, tempCells);
                            break;
                        case 'setBackgroundColor':
                            tableModule.setStyle({ backgroundColor: input.value }, tempCells);
                            break;
                    }
                });
                input.style.marginLeft = 'auto';
                return [subTitle, input];
            },
        }
    }
    /**
     * Override the attributes of the context menu items if they exist;
     * otherwise, define a new one for them.
     */
    optionsModify() {
        if (!this.options?.modifyItems) return;
        for (const [item, itemNewOptions] of Object.entries(this.options?.items)) {
            if (!MENU_ITEMS_DEFAULT.hasOwnProperty(item)) continue;
            switch (item) {
                case 'setBorderColor':
                case 'setBackgroundColor':
                    this.overrideButton(item, itemNewOptions);
                    break;
                default:
                    const itemDefaultOptions = MENU_ITEMS_DEFAULT[item];
                    Object.keys(itemNewOptions).forEach(option => {
                        itemDefaultOptions[option] = itemNewOptions[option];
                    });
                    break;
            }
        }
        this.menuItems = Object.assign({}, MENU_ITEMS_DEFAULT);
    }

    setMenuPosition({ left, top }) {
        const containerRect = this.quill.container.getBoundingClientRect();
        const menuRect = this.domNode.getBoundingClientRect();
        let resLeft = left - containerRect.left;
        let resTop = top - containerRect.top;
        if (resLeft + menuRect.width > containerRect.width) {
            resLeft = containerRect.width - menuRect.width;
        }
        if (resTop + menuRect.height > containerRect.height) {
            resTop = containerRect.height - menuRect.height;
        }
        Object.assign(this.domNode.style, {
            left: `${resLeft}px`,
            top: `${resTop}px`,
        });
    }

    menuInitial({ table, row, cell, left, top }) {
        this.domNode = document.createElement('div');
        this.domNode.classList.add('ql-table-operation-menu');

        css(this.domNode, {
            position: 'absolute',
            'min-height': `${MENU_MIN_HEIHGT}px`,
        });

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

        this.quill.container.appendChild(this.domNode);
        this.setMenuPosition({ left, top });
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
            let nodes = text.call(this);
            if (!isArray(nodes)) {
                nodes = [nodes];
            }
            nodes.map((sub) => node.appendChild(sub));
        }

        isFunction(handler) && node.addEventListener('click', handler.bind(this), false);
        return node;
    }
}
