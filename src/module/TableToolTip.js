import Quill from 'quill';
import TableWrapperFormat from '../format/TableWrapperFormat';
import { css, getRelativeRect } from '../utils';
import { blotName, toolName } from '../assets/const/name';

let TIPHEIGHT = 12;
const CELLMINWIDTH = 26;

/*
	options = {
		tipHeight: 12,	// tooltip height
		disableToolNames: [],	// 表格内禁用项， toolbar 的 name
	}
*/
export default class TableTooltip {
    constructor(quill, options = {}) {
        this.quill = quill;
        this.options = options;
        this.optionsMerge();

        this.tableWrapper = null;
        this.table = null;
        this.curTableId = '';
        this.focusTableChange = false;
        this.tableCols = [];
        this.scrollHandler = [];

        this.tableDisableToolHandlers = {};

        this.root = this.quill.addContainer('ql-table-tooltip');
        this.root.style.height = TIPHEIGHT + 'px';

        const resizeObserver = new ResizeObserver((entries) => {
            this.hide();
            this.curTableId = '';
        });
        resizeObserver.observe(this.quill.root);

        this.isMobile = 'ontouchstart' in window;
        this.handledEvents = this.isMobile
            ? { down: 'touchstart', move: 'touchmove', up: 'touchend' }
            : { down: 'mousedown', move: 'mousemove', up: 'mouseup' };

        this.hide();
        this.listen();
    }

    optionsMerge() {
        this.options?.tipHeight && (TIPHEIGHT = this.options.tipHeight);
        TableTooltip.disableToolNames = Array.from(
            new Set([...TableTooltip.disableToolNames, ...(this.options?.disableToolNames || [])])
        );
    }

    listen() {
        this.quill.on(Quill.events.SELECTION_CHANGE, (range, oldRange, source) => {
            if (range == null) return;
            if (range.length === 0) {
                const [tableWrapper, offset] = this.quill.scroll.descendant(TableWrapperFormat, range.index);
                if (tableWrapper !== null) {
                    // 此时在 table 内, 禁用部分功能
                    this.disableFromTable();

                    this.tableWrapper = tableWrapper;
                    this.table = tableWrapper.children.head;
                    // 找到 tbody
                    let tbody = tableWrapper.children.tail;
                    while (tbody && tbody.statics.blotName !== blotName.tableBody) {
                        tbody = tbody.children?.tail;
                    }

                    const tableCols = tableWrapper.children.head?.children?.head;
                    if (tableCols.statics.blotName === blotName.tableColGroup && tableCols.children.length) {
                        this.tableCols = tableCols.children.map((col) => col);
                    } else {
                        this.tableCols = [];
                    }

                    let curTableId = tableWrapper.children.head.tableId;
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

                    this.show();
                    const referencePosition = getRelativeRect(
                        this.tableWrapper.domNode.getBoundingClientRect(),
                        this.quill.container
                    );
                    referencePosition.top = referencePosition.y;
                    referencePosition.left = referencePosition.x;
                    this.position(referencePosition);
                    return;
                }
            }
            this.hide();
        });
    }

    disableFromTable() {
        this.toggleDisableToolbarTools('add');

        const toolbar = this.quill.getModule('toolbar');
        // 防止重复触发覆盖保存事件
        if (toolbar.disableByTable) return;
        toolbar.disableByTable = true;

        // 去除 toolbar 对应 module 的 handler 事件, 保存在 tableDisableToolHandlers
        for (const toolName of TableTooltip.disableToolNames) {
            this.tableDisableToolHandlers[toolName] = toolbar.handlers[toolName];
            // 不要使用 delete 删除属性
            toolbar.handlers[toolName] = () => {};
        }
    }

    enableFromTable() {
        this.toggleDisableToolbarTools('remove');

        const toolbar = this.quill.getModule('toolbar');
        // 根据 tableDisableToolHandlers 恢复 handler
        for (const toolName in this.tableDisableToolHandlers) {
            toolbar.handlers[toolName] = this.tableDisableToolHandlers[toolName];
        }
        this.tableDisableToolHandlers = {};
        toolbar.disableByTable = false;
    }

    /**
     * Toggles the disable state of toolbar tools.
     *
     * @param {'add' | 'remove'} type - The type of toggle action to perform.
     */
    toggleDisableToolbarTools(type) {
        this.quill.getModule('toolbar').controls.map(([name, btn]) => {
            if (TableTooltip.disableToolNames.includes(name)) {
                if (btn.tagName.toLowerCase() === 'select') {
                    document.querySelector(`.ql-select.${btn.className}`).classList[type]('ql-disabled-table');
                } else {
                    btn.classList[type]('ql-disabled-table');
                }
            }
        });
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
            const [dom, handle] = this.scrollHandler[i];
            dom.removeEventListener('scroll', handle);
        }
        this.scrollHandler = [];
    }

    position(reference) {
        const rootLRelativeLeft = getComputedStyle(this.quill.root).paddingLeft;
        css(this.root, {
            top: `${reference.top + this.quill.container.scrollTop - TIPHEIGHT}px`,
            left: rootLRelativeLeft, // editor 的 padding left
        });
    }

    show() {
        // 若没有 colgroup col 元素，不显示
        if (!this.tableCols.length) {
            return;
        }

        if (this.focusTableChange) {
            let tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
            // 加 tableId 用于 table 删除时隐藏 tooltip
            this.root.dataset.tableId = this.tableWrapper.tableId;
            const tableWidth = this.table.domNode.getBoundingClientRect().width;
            this.root.innerHTML = [...this.tableCols]
                .map((col) => {
                    // 百分比、null 判断
                    let width = col.width + 'px';
                    if (!col.width) {
                        const realWidth = col.domNode.getBoundingClientRect().width;
                        width = (realWidth / tableWidth) * 100 + '%';
                    } else if (col.width.endsWith('%')) {
                        width = col.width;
                    }
                    return `<div class="ql-table-col-header" style="width: ${width}">
            			<div class="ql-table-col-separator" style="height: ${tableWrapperRect.height + TIPHEIGHT - 3}px"></div>
            		</div>`; // -3 为 border-width: 2, top: 1
                })
                .join('');

            this.focusTableChange = false;

            this.bindDrag();
        }
        setTimeout(() => {
            this.scrollSync(this.tableWrapper.domNode);
        }, 0);
        this.root.classList.remove('ql-hidden');
    }

    hide() {
        this.root.classList.add('ql-hidden');
        this.enableFromTable();
    }

    bindDrag() {
        let tipColBreak = null;
        let curColIndex = -1;
        let tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header'));
        let tableColHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-col-separator'));
        const appendTo = document.body;
        // 设置每个 drag 下标对应 col 下标，最右会多一个 drag, 与 better-table 的类似
        // 根据当前的 col left 配合 pageX 计算, 使保证最小宽度
        const handleMousemove = (e) => {
            // getBoundingClientRect 的 top/bottom/left/right, 这是根据视口距离
            const rect = tableColHeads[curColIndex].getBoundingClientRect();
            let resX = this.isMobile ? e.changedTouches[0].pageX : e.pageX;
            if (resX - rect.x < CELLMINWIDTH) {
                resX = rect.x + CELLMINWIDTH;
            }
            resX = Math.floor(resX);
            tipColBreak.style.left = resX + 'px';
            tipColBreak.dataset.w = resX - rect.x;
        };
        const handleMouseup = (e) => {
            let w = parseInt(tipColBreak.dataset.w);
            // table full 时处理为百分比
            if (this.table.full) {
                this.tableCols[curColIndex].width = (w / this.table.domNode.getBoundingClientRect().width) * 100 + '%';
            } else {
                this.table.domNode.style.width =
                    parseFloat(this.table.domNode.style.width) -
                    parseFloat(tableColHeads[curColIndex].style.width) +
                    w +
                    'px';
                tableColHeads[curColIndex].style.width = w + 'px';
                this.tableCols[curColIndex].width = w;
            }

            appendTo.removeChild(tipColBreak);
            tipColBreak = null;
            curColIndex = -1;
            document.removeEventListener(this.handledEvents.up, handleMouseup);
            document.removeEventListener(this.handledEvents.move, handleMousemove);

            const tableModule = this.quill.getModule(toolName.table);
            tableModule.hideTableTools();
        };
        const handleMousedown = (i, e) => {
            document.addEventListener(this.handledEvents.up, handleMouseup);
            document.addEventListener(this.handledEvents.move, handleMousemove);
            curColIndex = i;

            const divDom = document.createElement('div');
            divDom.classList.add('ql-table-drag-line');

            const tableRect = this.tableWrapper.domNode.getBoundingClientRect();

            css(divDom, {
                top: `${tableRect.y - TIPHEIGHT}px`,
                left: `${this.isMobile ? e.changedTouches[0].pageX : e.pageX}px`,
                height: `${tableRect.height + TIPHEIGHT}px`,
            });
            appendTo.appendChild(divDom);

            if (tipColBreak) appendTo.removeChild(tipColBreak);
            tipColBreak = divDom;
        };
        tableColHeadSeparators.map((el, i) => {
            el.addEventListener(this.handledEvents.down, handleMousedown.bind(this, i));
            // 防止拖拽使触发 drag 导致可以使此元素被插入表格
            el.addEventListener('dragstart', (e) => {
                e.preventDefault();
            });
        });
    }
}

// 在 table 内时禁用的 tool 的 name
TableTooltip.disableToolNames = [toolName.table];
