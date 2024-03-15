(function (Quill) {
    'use strict';

    const CREATE_TABLE = 'createTable';

    const blotName = {
        contain: 'contain',
        tableWrapper: 'tableWrapper',
        table: 'table',
        tableColGroup: 'colgroup',
        tableCol: 'col',
        tableBody: 'tbody',
        tableRow: 'tr',
        tableCell: 'td',
        tableCellInner: 'tableCellInner',
    };
    const moduleName = {
        table: 'table',
    };
    const toolName = {
        table: 'table',
    };

    // col 最小百分比宽度
    const CELL_MIN_PRE = 3;
    // col 最小 px 宽度
    const CELL_MIN_WIDTH = 26;

    const Container$7 = Quill.import('blots/container');
    const Parchment$a = Quill.import('parchment');

    class TableWrapperFormat extends Container$7 {
        static create(value) {
            const node = super.create();

            node.dataset.tableId = value;

            node.addEventListener(
                'dragstart',
                (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                },
                true
            );
            // 不允许拖拽进 table
            node.ondrop = (e) => {
                e.preventDefault();
            };
            // 修改拖拽进入时的鼠标样式
            node.ondragover = (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'none';
            };
            return node;
        }

        get tableId() {
            return this.domNode.dataset.tableId;
        }

        insertBefore(blot, ref) {
            if (blot.statics.blotName == this.statics.blotName) {
                // 合并
                super.insertBefore(blot.children.head, ref);
            } else if (this.statics.allowedChildren.find((child) => child.blotName === blot.statics.blotName)) {
                // 允许子 blot
                super.insertBefore(blot, ref);
            } else {
                // 非允许子 blot, ref 为 null 是插入头, 否则插入尾
                if (ref) {
                    this.prev ? this.prev.insertBefore(blot, null) : this.parent.insertBefore(blot, this);
                } else {
                    this.next ? this.next.insertBefore(blot, ref) : this.parent.appendChild(blot);
                }
            }
        }

        optimize() {
            super.optimize();
            let next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.tagName === this.domNode.tagName &&
                next.domNode.dataset.tableId === this.domNode.dataset.tableId
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }

        deleteAt(index, length) {
            super.deleteAt(index, length);
            // 删除 table 时隐藏当前 table 的 tooltip
            document.querySelector(`.ql-table-tooltip[data-table-id="${this.tableId}"]`)?.classList?.add('ql-hidden');
        }
    }
    TableWrapperFormat.blotName = blotName.tableWrapper;
    TableWrapperFormat.tagName = 'p';
    TableWrapperFormat.className = 'ql-table-wrapper';
    TableWrapperFormat.scope = Parchment$a.Scope.BLOCK_BLOT;

    const randomId = () => Math.random().toString(36).slice(2);

    let zindex = 8000;
    const dialog = ({ child, target = document.body, beforeClose = () => {} } = {}) => {
        const appendTo = target;
        const dialog = document.createElement('div');
        dialog.classList.add('dialog');
        dialog.style.zIndex = zindex;
        const overlay = document.createElement('div');
        overlay.classList.add('dialog_overlay');
        dialog.appendChild(overlay);
        if (child) {
            const content = document.createElement('div');
            content.classList.add('dialog_content');
            content.appendChild(child);
            overlay.appendChild(content);
            content.onclick = (e) => {
                e.stopPropagation();
            };
        }

        const originOverflow = getComputedStyle(appendTo).overflow;
        appendTo.style.overflow = 'hidden';

        appendTo.appendChild(dialog);
        const close = () => {
            beforeClose();
            dialog.remove();
            appendTo.style.overflow = originOverflow;
        };
        dialog.onclick = close;
        zindex += 1;

        return { dialog, close };
    };

    /**
     * 创建一个带 label 的输入框
     *
     * @param {string} label - The label for the input item.
     * @param {object} options - The options for the input item.
     * @param {string} options.type - The type of the input.
     * @param {string} options.value - The initial value of the input.
     * @param {number} options.max - The maximum value allowed for the input.
     * @param {number} options.min - The minimum value allowed for the input.
     * @return {object} An object containing the input item, the input element, and an error tip function.
     */
    const createInputItem = (label, options) => {
        options.type || (options.type = 'text');
        options.value || (options.value = '');

        const inputItem = document.createElement('div');
        inputItem.classList.add('input_item');

        if (label) {
            const inputLabel = document.createElement('span');
            inputLabel.classList.add('input_label');
            inputLabel.innerText = label;
            inputItem.appendChild(inputLabel);
        }

        const inputInput = document.createElement('div');
        inputInput.classList.add('input_input');
        const input = document.createElement('input');
        for (const key in options) {
            input.setAttribute(key, options[key]);
        }
        if (options.max || options.min) {
            input.addEventListener('blur', () => {
                if (options.max && options.max <= input.value) {
                    input.value = options.max;
                }
                if (options.min && options.min >= input.value) {
                    input.value = options.min;
                }
            });
        }

        inputInput.appendChild(input);
        inputItem.appendChild(inputInput);

        input.onfocus = () => {
            inputInput.classList.add('focus');
        };
        input.onblur = () => {
            inputInput.classList.remove('focus');
        };

        const errorTip = (msg) => {
            if (inputInput.classList.contains('error')) {
                inputInput.querySelector('.error_tip').innerText = msg;
            } else {
                const errorTip = document.createElement('span');
                errorTip.classList.add('error_tip');
                errorTip.innerText = msg;
                inputInput.appendChild(errorTip);
            }

            inputInput.classList.add('error');

            const removeError = () => {
                inputInput.classList.remove('error');
                errorTip.remove();
            };
            return { removeError };
        };

        return { item: inputItem, input, errorTip };
    };

    /**
     * 创建具有指定行数和列数的表格
     *
     * @param {number} row - The number of rows for the table (optional, default: 3)
     * @param {number} col - The number of columns for the table (optional, default: 3)
     * @return {Promise} A promise that resolves with an object containing the row and column values when the table creation is confirmed, or rejects if the dialog is closed without confirmation.
     */
    const showTableCreator = async (row = 3, col = 3) => {
        const box = document.createElement('div');
        box.classList.add('create_box');
        const inputContent = document.createElement('div');
        inputContent.classList.add('create_input_content');

        const {
            item: rowItem,
            input: rowInput,
            errorTip: rowErrorTip,
        } = createInputItem('row', { type: 'number', value: row, max: 99 });
        const {
            item: colItem,
            input: colInput,
            errorTip: colErrorTip,
        } = createInputItem('col', { type: 'number', value: col, max: 99 });

        inputContent.appendChild(rowItem);
        inputContent.appendChild(colItem);
        box.appendChild(inputContent);

        const control = document.createElement('div');
        control.classList.add('create_control');

        const confirmBtn = document.createElement('button');
        confirmBtn.classList.add('create_control_btn', 'confirm');
        confirmBtn.innerText = 'Confirm';

        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('create_control_btn', 'cancel');
        cancelBtn.innerText = 'Cancel';

        control.appendChild(confirmBtn);
        control.appendChild(cancelBtn);
        box.appendChild(control);

        return new Promise((resolve, reject) => {
            const { close } = dialog({ child: box, beforeClose: reject });

            confirmBtn.onclick = async () => {
                const row = Number(rowInput.value);
                const col = Number(colInput.value);

                if (isNaN(row) || row <= 0) {
                    return rowErrorTip('Invalid number');
                }
                if (isNaN(col) || col <= 0) {
                    return colErrorTip('Invalid number');
                }
                resolve({ row, col });
                close();
            };
            cancelBtn.onclick = () => {
                close();
            };
        });
    };

    /**
     * 显示表格选择器
     */
    const showTableSelector = () => {
        const selectDom = document.createElement('div');
        selectDom.classList.add('create_select');

        const selectBlock = document.createElement('div');
        selectBlock.classList.add('create_select_block');

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const selectItem = document.createElement('div');
                selectItem.classList.add('create_select_block_item');
                selectItem.dataset.row = r + 1;
                selectItem.dataset.col = c + 1;
                selectBlock.appendChild(selectItem);
            }
        }

        const selectCustom = document.createElement('div');
        selectCustom.classList.add('create_select_custom');
        selectCustom.innerText = '自定义行列数';

        selectDom.appendChild(selectBlock);
        selectDom.appendChild(selectCustom);

        const sendTableData = ({ row, col }) => {
            selectDom.dispatchEvent(new CustomEvent(CREATE_TABLE, { detail: { row: Number(row), col: Number(col) } }));
        };
        const updateSelectBlockItems = () => {
            const { row, col } = selectDom.dataset;
            [].forEach.call(selectBlock.querySelectorAll('.active'), (item) => {
                item.classList.remove('active');
            });
            if (!row || !col) return;
            const childs = Array.from(selectBlock.children);
            for (let i = 0; i < childs.length; i++) {
                if (childs[i].dataset.row > row && childs[i].dataset.col > col) {
                    return;
                }
                if (childs[i].dataset.row <= row && childs[i].dataset.col <= col) {
                    childs[i].classList.add('active');
                } else {
                    childs[i].classList.remove('active');
                }
            }
        };
        selectBlock.addEventListener('mousemove', (e) => {
            const { row, col } = e.target.dataset;
            if (!row || !col) return;
            selectDom.dataset.row = row;
            selectDom.dataset.col = col;
            updateSelectBlockItems();
        });
        selectBlock.addEventListener('mouseleave', (e) => {
            selectDom.removeAttribute('data-row');
            selectDom.removeAttribute('data-col');
            updateSelectBlockItems();
        });
        selectBlock.addEventListener('click', () => {
            const { row, col } = selectDom.dataset;
            if (!row || !col) return;
            sendTableData({ row, col });
        });

        selectCustom.addEventListener('click', () => {
            showTableCreator().then(({ row, col }) => {
                sendTableData({ row, col });
            });
        });

        return selectDom;
    };

    function css(domNode, rules) {
        if (typeof rules === 'object') {
            for (let prop in rules) {
                domNode.style[prop] = rules[prop];
            }
        }
    }

    function getRelativeRect(targetRect, container) {
        let containerRect = container.getBoundingClientRect();

        return {
            x: targetRect.x - containerRect.x - container.scrollLeft,
            y: targetRect.y - containerRect.y - container.scrollTop,
            x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
            y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
            width: targetRect.width,
            height: targetRect.height,
        };
    }

    function computeBoundaryFromRects(startRect, endRect) {
        let x = Math.min(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
        let x1 = Math.max(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
        let y = Math.min(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);
        let y1 = Math.max(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);

        let width = x1 - x;
        let height = y1 - y;

        return { x, x1, y, y1, width, height };
    }

    function isString(val) {
        return typeof val === 'string';
    }
    function isFunction(val) {
        return typeof val === 'function';
    }

    let TIP_HEIGHT = 12;
    /*
    	options = {
    		tipHeight: 12,	// tooltip height
    		disableToolNames: [],	// 表格内禁用项， toolbar 的 name
    	}
    */
    class TableTooltip {
        constructor(quill, options = {}) {
            this.quill = quill;
            this.options = options;
            this.optionsMerge();

            this.tableDisableToolHandlers = {};
            this.tableWrapper = null;
            this.table = null;
            this.curTableId = '';
            this.focusTableChange = false;
            this.tableCols = [];
            this.scrollHandler = [];

            this.root = this.quill.addContainer('ql-table-tooltip');
            this.root.style.height = TIP_HEIGHT + 'px';

            const resizeObserver = new ResizeObserver((entries) => {
                this.hide();
                this.focusTableChange = true;
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
            this.options?.tipHeight && (TIP_HEIGHT = this.options.tipHeight);
            TableTooltip.disableToolNames = Array.from(
                new Set([...TableTooltip.disableToolNames, ...(this.options?.disableToolNames || [])])
            );
        }

        listen() {
            this.quill.on(Quill.events.EDITOR_CHANGE, (eventName) => {
                if (eventName === Quill.events.TEXT_CHANGE) {
                    return this.hide();
                }
                const range = this.quill.getSelection();
                if (range == null) return;
                const [tableWrapper] = this.quill.scroll.descendant(TableWrapperFormat, range.index);
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
                    this.position();
                    return;
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
                // 不要设置为 null
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
            const toolbar = this.quill.getModule('toolbar');
            toolbar.controls.map(([name, btn]) => {
                if (TableTooltip.disableToolNames.includes(name)) {
                    if (btn.tagName.toLowerCase() === 'select') {
                        toolbar.container
                            .querySelector(`.ql-picker.${btn.className}`)
                            ?.classList[type]('ql-disabled-table');
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

        position = () => {
            const rect = getRelativeRect(this.table.domNode.getBoundingClientRect(), this.quill.root);
            const tableTop = this.table.domNode.offsetTop;
            const rootScrollTop = this.quill.root.scrollTop;
            css(this.root, {
                top: `${tableTop - rootScrollTop - TIP_HEIGHT}px`,
                left: rect.x + 'px', // table 距离 editor 的 padding
            });
        };

        show() {
            // 若没有 colgroup col 元素，不显示
            if (!this.tableCols.length) {
                return;
            }

            if (this.focusTableChange) {
                const tableWrapperRect = this.tableWrapper.domNode.getBoundingClientRect();
                // 加 tableId 用于 table 删除时隐藏 tooltip
                this.root.dataset.tableId = this.tableWrapper.tableId;
                this.root.innerHTML = [...this.tableCols]
                    .map((col) => {
                        let width = col.width + (this.table.full ? '%' : 'px');
                        if (!col.width) {
                            width = col.domNode.getBoundingClientRect().width + 'px';
                        }
                        return `<div class="ql-table-col-header" style="width: ${width}">
            			<div class="ql-table-col-separator" style="height: ${tableWrapperRect.height + TIP_HEIGHT - 3}px"></div>
            		</div>`; // -3 为 border-width: 2, top: 1
                    })
                    .join('');

                this.focusTableChange = false;
                Object.assign(this.root.style, {
                    width: tableWrapperRect.width + 'px',
                });

                this.bindDrag();
            }
            setTimeout(() => {
                this.scrollSync(this.tableWrapper.domNode);
            }, 0);
            this.root.classList.remove('ql-hidden');

            const srcollHide = () => {
                this.hide();
                this.quill.root.removeEventListener('scroll', srcollHide);
            };
            this.quill.root.addEventListener('scroll', srcollHide);
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
            // 根据当前的 col left 配合 clientX 计算, 使保证最小宽度
            const handleMousemove = (e) => {
                // getBoundingClientRect 的 top/bottom/left/right, 这是根据视口距离
                const rect = tableColHeads[curColIndex].getBoundingClientRect();
                const tableWidth = this.table.domNode.getBoundingClientRect().width;
                let resX = this.isMobile ? e.changedTouches[0].clientX : e.clientX;

                if (this.table.full) {
                    // 拖拽的最大宽度是当前 col 宽度 + next col 宽度, 最后一个 col 最大宽度是当前宽度
                    const minWidth = (CELL_MIN_PRE / 100) * tableWidth;
                    const maxRange =
                        resX > rect.right
                            ? tableColHeads[curColIndex + 1]
                                ? tableColHeads[curColIndex + 1].getBoundingClientRect().right - minWidth
                                : rect.right - minWidth
                            : Infinity;
                    const minRange = rect.x + minWidth;

                    resX = Math.min(Math.max(resX, minRange), maxRange);
                } else {
                    if (resX - rect.x < CELL_MIN_WIDTH) {
                        resX = rect.x + CELL_MIN_WIDTH;
                    }
                }
                resX = Math.floor(resX);
                tipColBreak.style.left = resX + 'px';
                tipColBreak.dataset.w = resX - rect.x;
            };
            const handleMouseup = (e) => {
                let w = parseInt(tipColBreak.dataset.w);
                // table full 时处理不同
                if (this.table.full) {
                    // 在调整一个后把所有 col 都变成百分比
                    let pre = (w / this.table.domNode.getBoundingClientRect().width) * 100;
                    let oldWidthPre = this.tableCols[curColIndex].width;
                    if (pre < oldWidthPre) {
                        // 缩小时若不是最后一个, 则把减少的量加在后面一个
                        // 若是最后一个则把减少的量加在前面一个
                        pre = Math.max(CELL_MIN_PRE, pre);
                        const last = oldWidthPre - pre;
                        if (this.tableCols[curColIndex + 1]) {
                            this.tableCols[curColIndex + 1].width = `${this.tableCols[curColIndex + 1].width + last}%`;
                        } else if (this.tableCols[curColIndex - 1]) {
                            this.tableCols[curColIndex - 1].width = `${this.tableCols[curColIndex - 1].width + last}%`;
                        } else {
                            pre = 100;
                        }
                        this.tableCols[curColIndex].width = `${pre}%`;
                    } else {
                        // 增大时若不是最后一个, 则与后面一个的宽度合并, 最大不能超过合并的宽度, 增加的量来自后面一个的减少量
                        // 若是最后一个则不处理
                        if (this.tableCols[curColIndex + 1]) {
                            const totalWidthNextPre = oldWidthPre + this.tableCols[curColIndex + 1].width;
                            pre = Math.min(totalWidthNextPre - CELL_MIN_PRE, pre);
                            this.tableCols[curColIndex].width = `${pre}%`;
                            this.tableCols[curColIndex + 1].width = `${totalWidthNextPre - pre}%`;
                        }
                    }
                } else {
                    this.table.domNode.style.width =
                        parseFloat(this.table.domNode.style.width) -
                        parseFloat(tableColHeads[curColIndex].style.width) +
                        w +
                        'px';
                    tableColHeads[curColIndex].style.width = `${w}px`;
                    this.tableCols[curColIndex].width = `${w}px`;
                }
                this.table.formatTableWidth();

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
                    top: `${tableRect.y - TIP_HEIGHT}px`,
                    left: `${this.isMobile ? e.changedTouches[0].clientX : e.clientX}px`,
                    height: `${tableRect.height + TIP_HEIGHT}px`,
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

    const Container$6 = Quill.import('blots/container');
    const Parchment$9 = Quill.import('parchment');

    class ContainBlot extends Container$6 {
        static create() {
            const node = super.create();
            return node;
        }

        insertBefore(blot, ref) {
            if (blot.statics.blotName == this.statics.blotName) {
                super.insertBefore(blot.children.head, ref);
            } else {
                super.insertBefore(blot, ref);
            }
        }

        format(name, value) {
            this.children.tail.format(name, value);
        }

        replace(target) {
            if (target.statics.blotName !== this.statics.blotName) {
                const item = Parchment$9.create(this.statics.defaultChild);
                target.moveChildren(item);
                this.appendChild(item);
            }
            if (target.parent == null) return;
            super.replace(target);
        }
    }

    ContainBlot.blotName = blotName.contain;
    ContainBlot.tagName = 'contain';
    ContainBlot.scope = Parchment$9.Scope.BLOCK_BLOT;
    ContainBlot.defaultChild = 'block';

    const Parchment$8 = Quill.import('parchment');

    class TableCellInnerFormat extends ContainBlot {
        static create(value) {
            const { tableId, rowId, colId, rowspan, colspan, style } = value;
            const node = super.create();
            node.dataset.tableId = tableId;
            node.dataset.rowId = rowId;
            node.dataset.colId = colId;
            node.dataset.rowspan = rowspan || 1;
            node.dataset.colspan = colspan || 1;
            node._style = style;
            return node;
        }

        // 仅 Block 存在 cache, 存在 cache 时不会获取最新 delta, cache 还会保存父级 format(bubbleFormats 函数), 需要清除以获取最新 delta
        clearDeltaCache() {
            this.children.forEach((child) => {
                child.cache = {};
            });
        }

        get rowId() {
            return this.domNode.dataset.rowId;
        }
        get colId() {
            return this.domNode.dataset.colId;
        }
        get rowspan() {
            return Number(this.domNode.dataset.rowspan);
        }
        set rowspan(value) {
            this.parent && (this.parent.rowspan = value);
            this.domNode.dataset.rowspan = value;
            this.clearDeltaCache();
        }
        get colspan() {
            return Number(this.domNode.dataset.colspan);
        }
        set colspan(value) {
            this.parent && (this.parent.colspan = value);
            this.domNode.dataset.colspan = value;
            this.clearDeltaCache();
        }
        set style(value) {
            this.domNode._style = value;
            this.parent.style = value;
            this.clearDeltaCache();
        }

        replace(target) {
            if (target.statics.blotName !== this.statics.blotName) {
                const cloneTarget = target.clone();
                target.moveChildren(cloneTarget);
                this.appendChild(cloneTarget);
                target.parent.insertBefore(this, target.next);
                target.remove();
            } else {
                super.replace(target);
            }
        }

        format(name, value) {
            super.format(name, value);
            this.clearDeltaCache();
        }

        formats() {
            const { tableId, rowId, colId, rowspan, colspan } = this.domNode.dataset;
            return {
                [this.statics.blotName]: {
                    tableId,
                    rowId,
                    colId,
                    rowspan,
                    colspan,
                    style: this.domNode._style,
                },
            };
        }

        optimize() {
            super.optimize();

            const parent = this.parent;
            // 父级非表格，则将当前 blot 放入表格中
            const { tableId, colId, rowId, rowspan, colspan } = this.domNode.dataset;
            if (parent != null && parent.statics.blotName != blotName.tableCell) {
                const mark = Parchment$8.create('block');

                this.parent.insertBefore(mark, this.next);
                const tableWrapper = Parchment$8.create(blotName.tableWrapper, tableId);
                const table = Parchment$8.create(blotName.table, tableId);
                const tableBody = Parchment$8.create(blotName.tableBody);
                const tr = Parchment$8.create(blotName.tableRow, rowId);
                const td = Parchment$8.create(blotName.tableCell, {
                    tableId,
                    rowId,
                    colId,
                    rowspan,
                    colspan,
                    style: this.domNode._style,
                });

                td.appendChild(this);
                tr.appendChild(td);
                tableBody.appendChild(tr);
                table.appendChild(tableBody);
                tableWrapper.appendChild(table);

                tableWrapper.replace(mark);
            }

            const next = this.next;
            // cell 下有多个 cellInner 全部合并
            if (next != null && next.prev === this && next.statics.blotName === this.statics.blotName) {
                next.moveChildren(this);
                next.remove();
            }
        }
    }

    TableCellInnerFormat.blotName = blotName.tableCellInner;
    TableCellInnerFormat.tagName = 'p';
    TableCellInnerFormat.className = 'ql-table-cell-inner';

    const Parchment$7 = Quill.import('parchment');
    const Container$5 = Quill.import('blots/container');

    class TableCellFormat extends Container$5 {
        static create(value) {
            const { rowId, colId, rowspan, colspan, style } = value;
            const node = super.create();
            node.dataset.rowId = rowId;
            node.dataset.colId = colId;
            node.setAttribute('rowspan', rowspan || 1);
            node.setAttribute('colspan', colspan || 1);
            node.setAttribute('style', style || '');
            return node;
        }

        get rowId() {
            return this.domNode.dataset.rowId;
        }
        get colId() {
            return this.domNode.dataset.colId;
        }
        get rowspan() {
            return Number(this.domNode.getAttribute('rowspan'));
        }
        set rowspan(value) {
            this.domNode.setAttribute('rowspan', value);
        }
        get colspan() {
            return Number(this.domNode.getAttribute('colspan'));
        }
        set colspan(value) {
            this.domNode.setAttribute('colspan', value);
        }
        set style(value) {
            this.domNode.setAttribute('style', value);
        }

        getCellInner() {
            return this.descendants(TableCellInnerFormat)[0];
        }

        optimize() {
            super.optimize();
            const { colId, rowId } = this.domNode.dataset;
            const next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.dataset.rowId === rowId &&
                next.domNode.dataset.colId === colId
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }

        deleteAt(index, length) {
            if (index === 0 && length === this.length()) {
                const cell = this.next || this.prev;
                const cellInner = cell && cell.getCellInner();
                if (cellInner) {
                    cellInner.colspan += this.colspan;
                }
                return this.remove();
            }
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.deleteAt(offset, length);
            });
        }
    }

    TableCellFormat.blotName = blotName.tableCell;
    TableCellFormat.tagName = 'td';
    TableCellFormat.className = 'ql-table-cell';
    TableCellFormat.scope = Parchment$7.Scope.BLOCK_BLOT;

    // 以 ql-better-table 的 table-selection.js 为修改基础


    let PRIMARY_COLOR = '#0589f3';
    const ERROR_LIMIT = 2;

    /*
    	options = {
    		primaryColor: Hex color code
    	}
    */
    class TableSelection {
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

            const srcollHide = () => {
                this.clearSelection();
                this.quill.root.removeEventListener('scroll', srcollHide);
            };
            this.quill.root.addEventListener('scroll', srcollHide);
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
                const tempCells = tableModule.tableSelection.selectedTds;
                input.addEventListener('input', () => {
                    tableModule.setBackgroundColor(input.value, tempCells);
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
    class TableOperationMenu {
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

    const Container$4 = Quill.import('blots/container');
    const Parchment$6 = Quill.import('parchment');

    class TableRowFormat extends Container$4 {
        static create(value) {
            const node = super.create();
            node.dataset.rowId = value;
            return node;
        }

        optimize() {
            super.optimize();
            const next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.dataset.rowId === this.domNode.dataset.rowId
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }

        get rowId() {
            return this.domNode.dataset.rowId;
        }

        foreachCellInner(func) {
            const next = this.children.iterator();
            let i = 0;
            let cur;
            while ((cur = next())) {
                const [tableCell] = cur.descendants(TableCellInnerFormat);
                if (func(tableCell, i++)) break;
            }
        }
    }

    TableRowFormat.blotName = blotName.tableRow;
    TableRowFormat.tagName = 'tr';
    TableRowFormat.className = 'ql-table-row';
    TableRowFormat.scope = Parchment$6.Scope.BLOCK_BLOT;

    const Parchment$5 = Quill.import('parchment');
    const BlockEmbed$1 = Quill.import('blots/block/embed');

    class TableColFormat extends BlockEmbed$1 {
        static create(value) {
            const { width, tableId, colId, full } = value;
            const node = super.create();
            node.setAttribute('width', width);
            full && node.setAttribute('data-full', full);
            node.dataset.tableId = tableId;
            node.dataset.colId = colId;

            return node;
        }

        static value(domNode) {
            const { tableId, colId } = domNode.dataset;
            return {
                tableId,
                colId,
                width: domNode.getAttribute('width'),
                full: domNode.hasAttribute('data-full'),
            };
        }

        get width() {
            const width = this.domNode.getAttribute('width');
            if (isNaN(width) && !width.endsWith('%')) return null;
            return parseFloat(width);
        }
        set width(value) {
            return this.domNode.setAttribute('width', value);
        }

        get colId() {
            return this.domNode.dataset.colId;
        }

        get full() {
            return this.domNode.hasAttribute('data-full');
        }

        optimize() {
            super.optimize();

            const parent = this.parent;
            if (parent != null && parent.statics.blotName != blotName.tableColGroup) {
                const mark = Parchment$5.create('block');
                this.parent.insertBefore(mark, this.next);

                const tableWrapper = Parchment$5.create(blotName.tableWrapper, this.domNode.dataset.tableId);
                const table = Parchment$5.create(blotName.table, this.domNode.dataset.tableId);

                this.full && (table.full = true);

                const tableColgroup = Parchment$5.create(blotName.tableColGroup);

                tableColgroup.appendChild(this);
                table.appendChild(tableColgroup);
                tableWrapper.appendChild(table);

                tableWrapper.replace(mark);
            }
            const next = this.next;
            const { tableId: ttableId, colId: tcolId } = this.domNode.dataset;
            if (
                next != null &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.tagName === this.domNode.tagName &&
                next.domNode.dataset.tableId === ttableId &&
                next.domNode.dataset.colId === tcolId
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }
    }
    TableColFormat.blotName = blotName.tableCol;
    TableColFormat.tagName = 'col';
    TableColFormat.scope = Parchment$5.Scope.BLOCK_BLOT;

    const Container$3 = Quill.import('blots/container');
    const Parchment$4 = Quill.import('parchment');

    class TableFormat extends Container$3 {
        constructor(domNode, value) {
            super(domNode, value);

            this.formatTableWidth();
        }

        static create(value) {
            const node = super.create();

            node.dataset.tableId = value;
            node.classList.add('ql-table');
            node.setAttribute('cellpadding', 0);
            node.setAttribute('cellspacing', 0);

            return node;
        }

        colWidthFillTable() {
            if (this.full) return;
            const colgroup = this.children.head;
            if (!colgroup || colgroup.statics.blotName !== blotName.tableColGroup) return;

            const colsWidth = colgroup.children.reduce((sum, col) => col.width + sum, 0);
            if (colsWidth === 0 || isNaN(colsWidth) || this.full) return null;
            this.domNode.style.width = colsWidth + 'px';
            return colsWidth;
        }

        formatTableWidth() {
            setTimeout(() => {
                this.colWidthFillTable();
            }, 0);
        }

        get tableId() {
            return this.domNode.dataset.tableId;
        }
        get full() {
            return this.domNode.hasAttribute('data-full');
        }
        set full(value) {
            this.domNode[value ? 'setAttribute' : 'removeAttribute']('data-full', '');
        }

        getRows() {
            return this.descendants(TableRowFormat);
        }
        getRowIds() {
            return this.getRows().map((d) => d.rowId);
        }

        getCols() {
            return this.descendants(TableColFormat);
        }
        getColIds() {
            return this.getCols().map((d) => d.colId);
        }

        optimize() {
            super.optimize();
            let next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.tagName === this.domNode.tagName &&
                next.domNode.dataset.tableId === this.domNode.dataset.tableId
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }
    }

    TableFormat.blotName = blotName.table;
    TableFormat.tagName = 'table';
    TableFormat.scope = Parchment$4.Scope.BLOCK_BLOT;

    const Container$2 = Quill.import('blots/container');
    const Parchment$3 = Quill.import('parchment');

    class TableBodyFormat extends Container$2 {
        optimize() {
            super.optimize();
            const next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.tagName === this.domNode.tagName
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }

        deleteAt(index, length) {
            if (index === 0 && length === this.length()) {
                this.parent.remove();
            }
            this.children.forEachAt(index, length, function (child, offset, length) {
                child.deleteAt(offset, length);
            });
        }
    }
    TableBodyFormat.blotName = blotName.tableBody;
    TableBodyFormat.tagName = 'tbody';
    TableBodyFormat.scope = Parchment$3.Scope.BLOCK_BLOT;

    const Container$1 = Quill.import('blots/container');
    const Parchment$2 = Quill.import('parchment');

    class TableColgroupFormat extends Container$1 {
        optimize() {
            super.optimize();
            const next = this.next;
            if (
                next != null &&
                next.prev === this &&
                next.statics.blotName === this.statics.blotName &&
                next.domNode.tagName === this.domNode.tagName
            ) {
                next.moveChildren(this);
                next.remove();
            }
        }

        findCol(index) {
            const next = this.children.iterator();
            let i = 0;
            let cur;
            while ((cur = next())) {
                if (i === index) {
                    break;
                }
                i++;
            }
            return cur;
        }
    }
    TableColgroupFormat.blotName = blotName.tableColGroup;
    TableColgroupFormat.tagName = 'colgroup';
    TableColgroupFormat.scope = Parchment$2.Scope.BLOCK_BLOT;

    const Parchment$1 = Quill.import('parchment');
    const ListItem = Quill.import('formats/list/item');

    class ListRewrite extends ListItem {
        replaceWith(name, value) {
            this.parent.isolate(this.offset(this.parent), this.length());
            if (name === this.parent.statics.blotName) {
                this.parent.replaceWith(name, value);
                return this;
            } else {
                if (name === blotName.tableCellInner) {
                    let replacement = typeof name === 'string' ? Parchment$1.create(name, value) : name;
                    replacement.replace(this.parent);
                    this.attributes.copy(replacement);
                    return replacement;
                }
                return super.replaceWith(name, value);
            }
        }
    }

    var TableSvg = "<svg viewBox=\"0 0 24 24\"><path class=\"ql-stroke\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm0 5h18M10 3v18\"/></svg>";

    const Parchment = Quill.import('parchment');
    const Delta = Quill.import('delta');
    const BlockEmbed = Quill.import('blots/block/embed');
    const Block = Quill.import('blots/block');
    const Container = Quill.import('blots/container');
    const icons = Quill.import('ui/icons');

    ContainBlot.allowedChildren = [Block, BlockEmbed, Container];

    TableWrapperFormat.allowedChildren = [TableFormat];

    TableFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
    TableFormat.requiredContainer = TableWrapperFormat;

    TableBodyFormat.allowedChildren = [TableRowFormat];
    TableBodyFormat.requiredContainer = TableFormat;

    TableColgroupFormat.allowedChildren = [TableColFormat];
    TableColgroupFormat.requiredContainer = TableFormat;

    TableRowFormat.allowedChildren = [TableCellFormat];
    TableRowFormat.requiredContainer = TableBodyFormat;

    TableCellFormat.allowedChildren = [TableCellInnerFormat];

    TableCellInnerFormat.defaultChild = 'block';

    Quill.register(
        {
            [`formats/${ContainBlot.blotName}`]: ContainBlot,

            [`formats/${TableCellInnerFormat.blotName}`]: TableCellInnerFormat,
            [`formats/${TableCellFormat.blotName}`]: TableCellFormat,
            [`formats/${TableRowFormat.blotName}`]: TableRowFormat,
            [`formats/${TableBodyFormat.blotName}`]: TableBodyFormat,
            [`formats/${TableFormat.blotName}`]: TableFormat,
            [`formats/${TableWrapperFormat.blotName}`]: TableWrapperFormat,

            [`formats/${TableColgroupFormat.blotName}`]: TableColgroupFormat,
            [`formats/${TableColFormat.blotName}`]: TableColFormat,
        },
        true
    );

    class TableModule {
        constructor(quill, options) {
            this.quill = quill;
            this.options = options;

            this.controlItem = null;
            this.tableInsertSelectCloseHandler = null;

            const toolbar = this.quill.getModule('toolbar');
            if (toolbar) {
                const control = toolbar.controls.find(([name]) => name === TableModule.toolName);
                if (control) {
                    this.controlItem = control[1].parentNode.querySelector('.ql-table.ql-picker');
                    // 使用 button 时会在点击后立刻聚焦输入, 若有横向滚动条会时视口锁定到 focus, 使用 select 就不会
                    if (this.controlItem) {
                        const label = this.controlItem.getElementsByClassName('ql-picker-label')?.[0];
                        label.innerHTML = TableSvg;
                    } else {
                        this.controlItem = control[1];
                    }
                    this.buildCustomSelect(this.options.customSelect, control[1].tagName.toLowerCase());
                    toolbar.addHandler(TableModule.toolName, this.handleSelectDisplay.bind(this));
                }
            }
            this.pasteTableHandler();

            // 绑定 table 的选择事件
            this.quill.root.addEventListener(
                'click',
                (evt) => {
                    const path = evt.path || (evt.composedPath && evt.composedPath());
                    if (!path || path.length <= 0) return;

                    const tableNode = path.filter((node) => {
                        return (
                            node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table')
                        );
                    })?.[0];
                    // 结束位置位处于表格内不显示
                    if (tableNode) {
                        if (this.table === tableNode) return;
                        if (this.table) this.hideTableTools();
                        this.showTableTools(tableNode, quill, this.options.selection);
                    } else if (this.table) {
                        this.hideTableTools();
                    }
                },
                false
            );
            // 绑定 table 的右键插入、删除事件
            this.quill.root.addEventListener('contextmenu', (evt) => {
                if (!this.table) return true;
                evt.preventDefault();

                const path = evt.path || (evt.composedPath && evt.composedPath());
                if (!path || path.length <= 0) return;

                const tableNode = path.filter(
                    (node) => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table')
                )[0];
                // 如果没有选中任何单元格，不显示右键菜单
                if (tableNode && this.tableSelection?.selectedTds?.length) {
                    if (this.tableOperationMenu) this.tableOperationMenu = this.tableOperationMenu.destroy();

                    const rowNode = path.filter(
                        (node) => node.tagName && node.tagName.toUpperCase() === 'TR' && node.getAttribute('data-row-id')
                    )[0];

                    const cellNode = path.filter(
                        (node) => node.tagName && node.tagName.toUpperCase() === 'TD' && node.getAttribute('data-row-id')
                    )[0];

                    this.tableOperationMenu = new TableOperationMenu(
                        {
                            table: tableNode,
                            row: rowNode,
                            cell: cellNode,
                            left: evt.pageX,
                            top: evt.pageY,
                        },
                        quill,
                        this.options.operationMenu
                    );
                }
            });

            this.quill.theme.tableToolTip = new TableTooltip(this.quill, this.options.tableToolTip);
        }

        showTableTools(table, quill, options) {
            this.table = table;
            this.tableSelection = new TableSelection(table, quill, options);
        }

        hideTableTools() {
            this.tableSelection && this.tableSelection.destroy();
            this.tableOperationMenu && this.tableOperationMenu.destroy();
            if (this.quill.theme.tableToolTip) {
                this.quill.theme.tableToolTip.curTableId = null;
                this.quill.theme.tableToolTip.hide();
            }
            this.tableSelection = null;
            this.tableOperationMenu = null;
            this.table = null;
        }

        // 粘贴表格处理
        // 需要带上 col 的 width, 处理 px 和 %
        pasteTableHandler() {
            let tableId = randomId();
            let rowId = randomId();
            let colIds = [];
            let cellCount = 0;

            // 重新生成 table 里的所有 id, cellFormat 和 colFormat 进行 table 的添加
            // addMatcher 匹配的是标签字符串, 不是 blotName, 只是这些 blotName 设置的是标签字符串
            this.quill.clipboard.addMatcher(blotName.table, (node, delta) => {
                const hasCol = !!delta.ops[0].insert?.col;
                let colDelta;
                // 粘贴表格若原本存在 col, 仅改变 id, 否则重新生成
                const { width: originTableWidth } = node.getBoundingClientRect();
                let isFull = this.options.fullWidth;
                if (hasCol) isFull = !!delta.ops[0].insert?.col?.full;
                const defaultColWidth = isFull
                    ? Math.max(100 / colIds.length, CELL_MIN_PRE) + '%'
                    : Math.max(originTableWidth / colIds.length, CELL_MIN_WIDTH) + 'px';

                if (!hasCol) {
                    colDelta = colIds.reduce((colDelta, id) => {
                        colDelta.insert({
                            [blotName.tableCol]: {
                                colId: id,
                                tableId,
                                width: defaultColWidth,
                                full: isFull,
                            },
                        });
                        return colDelta;
                    }, new Delta());
                } else {
                    for (let i = 0; i < delta.ops.length; i++) {
                        if (!delta.ops[i].insert[blotName.tableCol]) {
                            break;
                        }
                        delta.ops[i].insert[blotName.tableCol].tableId = tableId;
                        delta.ops[i].insert[blotName.tableCol].colId = colIds[i];
                        delta.ops[i].insert[blotName.tableCol].full = isFull;
                        if (!delta.ops[i].insert[blotName.tableCol].width) {
                            delta.ops[i].insert[blotName.tableCol].width = defaultColWidth;
                        } else {
                            delta.ops[i].insert[blotName.tableCol].width =
                                parseFloat(delta.ops[i].insert[blotName.tableCol].width) + (isFull ? '%' : 'px');
                        }
                    }
                }
                tableId = randomId();
                colIds = [];
                cellCount = 0;
                return colDelta ? colDelta.concat(delta) : delta;
            });

            this.quill.clipboard.addMatcher(blotName.tableRow, (node, delta) => {
                rowId = randomId();
                cellCount = 0;
                return delta;
            });

            this.quill.clipboard.addMatcher(blotName.tableCell, (node, delta) => {
                const rowspan = node.getAttribute('rowspan') || 1;
                const colspan = node.getAttribute('colspan') || 1;
                const colIndex = +cellCount + +colspan - 1;
                if (!colIds[colIndex]) {
                    for (let i = colIndex; i >= 0; i--) {
                        if (!colIds[i]) colIds[i] = randomId();
                    }
                }
                const colId = colIds[colIndex];
                cellCount += 1;

                if (delta.slice(delta.length() - 1).ops[0]?.insert !== '\n') {
                    delta.insert('\n');
                }

                return delta.compose(
                    new Delta().retain(delta.length(), {
                        [blotName.tableCellInner]: {
                            tableId,
                            rowId,
                            colId,
                            rowspan,
                            colspan,
                            style: node.getAttribute('style'),
                        },
                    })
                );
            });
        }

        async buildCustomSelect(customSelect, tagName) {
            const dom = document.createElement('div');
            dom.classList.add('ql-custom-select');
            const selector = customSelect && isFunction(customSelect) ? await customSelect() : this.createSelect();
            dom.appendChild(selector);

            let appendTo = this.controlItem;
            if (tagName === 'select') {
                appendTo = this.controlItem.querySelector('.ql-picker-options');
            }
            if (!appendTo) return;
            selector.addEventListener(CREATE_TABLE, (e) => {
                const { row, col } = e.detail;
                if (!row || !col) return;
                this.insertTable(row, col);
            });
            appendTo.appendChild(dom);
        }

        async handleSelectDisplay() {
            this.controlItem.classList.add('ql-expanded');
            this.controlItem.dataset.active = true;
            window.removeEventListener('click', this.tableInsertSelectCloseHandler);
            this.tableInsertSelectCloseHandler = (e) => {
                const path = (e.composedPath && e.composedPath()) || e.path;
                const i = path.findIndex((el) => el === this.controlItem);
                if (i > 2 || i === -1) {
                    this.closeSelecte();
                }
            };
            window.addEventListener('click', this.tableInsertSelectCloseHandler);
        }

        createSelect() {
            return showTableSelector();
        }

        closeSelecte() {
            this.controlItem.classList.remove('ql-expanded');
            this.controlItem.dataset.active = false;
            window.removeEventListener('click', this.tableInsertSelectCloseHandler);
        }

        // 以上为 toolbar table 按钮的选择生成器相关
        // 以下为 table module 生成表格相关功能函数

        insertTable(rows, columns) {
            if (rows >= 100 || columns >= 100) {
                throw new Error('Both rows and columns must be less than 100.');
            }

            this.quill.focus();
            this.range = this.quill.getSelection();
            const range = this.range;
            if (range == null) return;
            const currentBlot = this.quill.getLeaf(range.index)[0];

            if (isForbidInTable(currentBlot)) {
                throw new Error('Not supported nesting of ' + currentBlot.type + ' type object within a table.');
            }

            setTimeout(() => {
                let delta = new Delta().retain(range.index);
                delta.insert('\n');
                const tableId = randomId();
                const colId = new Array(columns).fill(0).map(() => randomId());

                let { width, paddingLeft, paddingRight } = getComputedStyle(this.quill.root);
                width = parseInt(width);
                paddingLeft = parseInt(paddingLeft);
                paddingRight = parseInt(paddingRight);
                width = width - paddingLeft - paddingRight;

                delta = new Array(columns).fill('\n').reduce((memo, text, i) => {
                    memo.insert(text, {
                        [blotName.tableCol]: {
                            width: !this.options.fullWidth ? `${Math.floor(width / columns)}px` : `${(1 / columns) * 100}%`,
                            tableId,
                            colId: colId[i],
                            full: this.options.fullWidth,
                        },
                    });
                    return memo;
                }, delta);

                // 直接生成 delta 的数据格式并插入
                delta = new Array(rows).fill(0).reduce((memo) => {
                    const rowId = randomId();
                    return new Array(columns).fill('\n').reduce((memo, text, i) => {
                        memo.insert(text, {
                            [blotName.tableCellInner]: {
                                tableId,
                                rowId,
                                colId: colId[i],
                                rowspan: 1,
                                colspan: 1,
                            },
                        });
                        return memo;
                    }, memo);
                }, delta);
                // console.log(columns, rows);
                this.quill.updateContents(delta, Quill.sources.USER);
                this.quill.setSelection(range.index + columns + columns * rows + 1, Quill.sources.API);
                this.quill.focus();

                this.closeSelecte();
            }, 0);
        }

        findTable(blot) {
            let cur = blot;
            while (cur.statics.blotName !== blotName.table && cur !== null) {
                cur = cur.parent;
            }
            return cur;
        }

        /*
            基准行
                向上: 选中 cell 的第一行
                向下: 选中 cell 的最后一行
            有无跨行单元格跨过选中基准行
                找到所有 colId, 根据若遍历行内的某 colId 跨行至基准行, 则添加至新的 cell 中, 否则:
                    向上: 从当前行向前查找所有 cell, 若 cell rowspan + index > 基准行 index, 则此 cell rowspan + 1
                    向下: 从当前行向后查找所有 cell, 若 cell rowspan - index < 基准行 index, 则此 cell rowspan + 1
                直到所有 colId 都遍历完, 则生成新的 cell 并插入到当前行的下方/上方
         */
        appendRow(isDown) {
            const selectTds = this.tableSelection.selectedTds;
            if (!selectTds.length) return;
            const table = this.findTable(selectTds[0]);
            const findTd = selectTds[isDown ? selectTds.length - 1 : 0];
            let baseTr = Quill.find(findTd.domNode.parentNode.parentNode);
            if (isDown) {
                let baseTrRowspan = findTd.rowspan;
                while (baseTrRowspan > 1) {
                    baseTr = baseTr.next;
                    baseTrRowspan -= 1;
                }
            }

            const colIds = table.getColIds();
            // 用于判断有哪些 col 已被遍历
            const allColIds = new Set(colIds);
            let foreachTr = isDown ? baseTr : baseTr.prev;
            let newCellColId = new Array();
            let indexDiff = 0;
            // 第一行向上插入时 baseTr 是 null, 不需要判断
            if (!foreachTr) {
                allColIds.clear();
                newCellColId = colIds;
            }
            while (allColIds.size) {
                indexDiff += 1;
                if (!foreachTr) {
                    break;
                }
                foreachTr.foreachCellInner((cell) => {
                    if (!allColIds.has(cell.colId)) return;
                    // 找到当前 cell 跨列的所有 colId
                    let curCellColIds = [cell.colId];
                    if (cell.colspan > 1) {
                        let index = colIds.findIndex((id) => id === cell.colId);
                        if (index === -1) {
                            index = 0;
                        }
                        curCellColIds = colIds.slice(index, index + cell.colspan);
                    }
                    // 若跨行过基准行, 则更新 rowspan
                    if (cell.rowspan > indexDiff) {
                        cell.rowspan += 1;
                    } else {
                        // 未包含基准行, 要添加所有的包含的 col
                        newCellColId.push(...curCellColIds);
                    }
                    curCellColIds.map((id) => allColIds.delete(id));
                });
                foreachTr = foreachTr.prev;
            }
            // 生成新的 cell
            const tableId = table.tableId;
            const newRowId = randomId();
            const newRow = Parchment.create(blotName.tableRow, newRowId);
            const insertColId = new Set(newCellColId);
            // 保持 colId 顺序
            for (let i = 0; i < colIds.length; i++) {
                if (!insertColId.size) break;
                if (insertColId.has(colIds[i])) {
                    const td = Parchment.create(blotName.tableCell, {
                        rowId: newRowId,
                        colId: colIds[i],
                        rowspan: 1,
                        colspan: 1,
                    });
                    const tdInner = Parchment.create(blotName.tableCellInner, {
                        tableId,
                        rowId: newRowId,
                        colId: colIds[i],
                        rowspan: 1,
                        colspan: 1,
                    });
                    const block = Parchment.create('block');
                    block.appendChild(Parchment.create('break'));
                    tdInner.appendChild(block);
                    td.appendChild(tdInner);
                    newRow.appendChild(td);
                    insertColId.delete(colIds[i]);
                }
            }

            baseTr.parent.insertBefore(newRow, isDown ? baseTr.next : baseTr);
        }

        /*
            第一种情况选中行中没有跨行, 或跨行没有超出选中范围. 
                直接删除
            第二种情况选中行内有跨行, 且跨行结束行在选中范围外.
                遍历选中行, 找到所有跨行超出范围的 cell 记录 colId 与超出 rowspan, 之后在选中最后一行的后一行插入对应的 cell
            第三种情况选中行之前有跨行, 且跨行结束行在选中范围内. 
                从选中行前一行开始遍历 cell, 找到所有的 col, 若 cell 跨行进入了选中范围(rowsapn - index > 0), rowspan = index
            第四种情况选中行之前有跨行, 且跨行范围包含选中范围.
                选中行前一行开始遍历 cell, 找到所有的 col, 若 cell 跨行进入了选中范围(rowsapn - index > 0), rowspan = rowspan - deleteTrs.length
                
        */
        removeRow() {
            if (!this.tableSelection.selectedTds.length) return;
            const selectTds = this.tableSelection.selectedTds;
            let [rowIds, rows] = selectTds.reduce(
                (pre, td) => {
                    if (!pre[0].has(td.rowId)) {
                        pre[0].add(td.rowId);
                        pre[1].push(td.parent.parent);
                    }
                    return pre;
                },
                [new Set(), []]
            );
            rowIds = Array.from(rowIds);

            const afterCell = new Map();
            rows.map((tr) => {
                tr.foreachCellInner((cell) => {
                    const rowIndexInSelected = rowIds.findIndex((id) => id === cell.rowId);
                    if (cell.rowspan > rowIds.length - rowIndexInSelected) {
                        afterCell.set(cell.colId, {
                            cell,
                            rowspan: cell.rowspan - rowIds.length + rowIndexInSelected,
                        });
                    }
                });
                tr.remove();
            });

            const table = this.findTable(selectTds[0]);
            const tableId = table.tableId;
            // 需要添加的跨行 cell
            if (afterCell.size) {
                const nextRow = rows[rows.length - 1].next;

                const colIds = table.getColIds();
                // 标记插入位置
                let lastTd = null;
                for (let i = 0; i < colIds.length; ) {
                    const td = nextRow.domNode.querySelector(`td[data-col-id="${colIds[i]}"]`);
                    if (td) {
                        const tdBlot = Quill.find(td);
                        i += tdBlot.colspan;
                        lastTd = tdBlot.next;
                    } else {
                        const { cell, rowspan } = afterCell.get(colIds[i]);
                        const newTd = Parchment.create(blotName.tableCell, {
                            rowId: nextRow.rowId,
                            colId: colIds[i],
                            rowspan,
                            colspan: cell.colspan,
                        });
                        const newTdInner = Parchment.create(blotName.tableCellInner, {
                            tableId,
                            rowId: nextRow.rowId,
                            colId: colIds[i],
                            rowspan,
                            colspan: cell.colspan,
                        });
                        cell.moveChildren(newTdInner);
                        newTd.appendChild(newTdInner);
                        nextRow.insertBefore(newTd, lastTd);
                        i += cell.colspan;
                    }
                }
            }
        }

        /*
            基准列
                向左: 选中 cell 的第一列 id, index
                向右: 选中 cell 的最后一列 id, index
            找到所有 rowId, 开始遍历行内 cell 至(向右: 基准行 colId)(向左: 基准行前一行 colId) 
                有无单元格跨列超过基准列
                    // 因为 colspan 最少为 1, 判断时需要 + 1
                    向右: 若 colspan + i > 1 + index, 则 colspan + 1 
                    向左: 若 colspan + i > 1 + index, 则 colspan + 1 
                    colspan + 1 后判断是否跨行, 若跨行则之后 rowspan 行不进行循环
                    break
                无 
                    找到 index 所在 cell，insertBefore
        */
        appendCol(isRight) {
            if (!this.tableSelection.selectedTds.length) return;
            const selectTds = this.tableSelection.selectedTds;
            const table = this.findTable(selectTds[0]);
            const cols = table.getCols();
            const colIds = table.getColIds();
            const rows = table.getRows();
            const newColId = randomId();

            let baseColId;
            if (isRight) {
                const lastTd = selectTds[selectTds.length - 1];
                const i = colIds.findIndex((id) => id === lastTd.colId);
                baseColId = colIds[i + lastTd.colspan - 1];
            } else {
                baseColId = selectTds[0].colId;
            }
            // 找到对应 col 下标，同时插入 col 元素
            const baseColIndex = cols.findIndex((col) => {
                if (col.colId === baseColId) {
                    const newCol = Parchment.create(blotName.tableCol, {
                        width: !this.options.fullWidth ? '160px' : '6%',
                        full: this.options.fullWidth,
                        tableId: table.tableId,
                        colId: newColId,
                    });
                    let beforeTarget = isRight ? col.next : col;
                    col.parent.insertBefore(newCol, beforeTarget);
                    if (this.options.fullWidth) {
                        if (!beforeTarget) {
                            beforeTarget = isRight ? col : col.prev;
                        }
                        beforeTarget.width = Math.max(beforeTarget.width - 6, CELL_MIN_PRE) + '%';
                    }
                }
                return col.colId === baseColId;
            });
            table.formatTableWidth();

            const stopIndex = isRight ? baseColIndex + 1 : baseColIndex;
            let skipRow = 0;
            rows.map((tr) => {
                let colspanIncrease = false;
                let beforeCell = null;
                tr.foreachCellInner((cell) => {
                    // 之前行有跨行且跨列的 cell 处理过, 直接跳过
                    if (skipRow > 0) {
                        skipRow -= 1;
                        colspanIncrease = true;
                        return true;
                    }
                    const colIndexInSelected = colIds.findIndex((id) => id === cell.colId);
                    if (cell.colspan + colIndexInSelected > stopIndex) {
                        beforeCell = cell.parent;

                        // 当前 cell 跨列且不是终止位
                        if (cell.colspan !== 1 && colIndexInSelected !== stopIndex) {
                            cell.colspan += 1;
                            colspanIncrease = true;
                            skipRow = cell.rowspan - 1;
                            return true;
                        }
                    }

                    if (colIndexInSelected >= stopIndex) {
                        return true;
                    }
                });

                if (!colspanIncrease) {
                    const newTd = Parchment.create(blotName.tableCell, {
                        rowId: tr.rowId,
                        colId: newColId,
                        rowspan: 1,
                        colspan: 1,
                    });
                    const newTdInner = Parchment.create(blotName.tableCellInner, {
                        tableId: table.tableId,
                        rowId: tr.rowId,
                        colId: newColId,
                        rowspan: 1,
                        colspan: 1,
                    });
                    newTd.appendChild(newTdInner);
                    tr.insertBefore(newTd, beforeCell);
                }
            });
        }

        /*
            找到需要删除的所有 colId
                获取所有 colIds, 遍历选中 cell, 找到 cell 在 colIds 下标, while cell 的 colspan, 将对应 colId 加入 set. 同时保存第一个 col 的 index (first)和最后一个 col 的 index(last)
            遍历所有 row, 遍历 row 中的 cell, 直到 cell i == index
                if i > first && i + colspan > last
                    cell.colspan - (last - i + 1)
                if i < first && i + colsapn > last
                    cell.colspan - (last - first + 1)
                if i < first && i + colspan > first && i + colspan <= last
                    cell.colspan - (i + colspan - first)
                if i >= first && i + colspan <= last
                    cell.remove
        */
        removeCol() {
            if (!this.tableSelection.selectedTds.length) return;
            const tds = this.tableSelection.selectedTds;
            const table = this.findTable(this.tableSelection.selectedTds[0]);
            const colIds = table.getColIds();

            const [firstSelectColIndex, lastSelectColIndex] = tds.reduce(
                (n, cellInner) => {
                    const i = colIds.findIndex((id) => id === cellInner.colId);
                    return [Math.min(n[0], i), Math.max(n[1], i + cellInner.colspan - 1)];
                },
                [Infinity, -Infinity]
            );

            const rows = table.getRows();
            rows.map((row) => {
                let i = 0;
                row.foreachCellInner((cell) => {
                    if (i > lastSelectColIndex) return true;
                    const colspan = cell.colspan;
                    if (i + colspan - 1 > lastSelectColIndex) {
                        cell.colspan -= lastSelectColIndex - Math.max(i, firstSelectColIndex) + 1;
                    } else if (i < firstSelectColIndex && i + colspan - 1 >= firstSelectColIndex) {
                        cell.colspan -= i + colspan - firstSelectColIndex;
                    } else if (i >= firstSelectColIndex) {
                        cell.remove();
                    }

                    i += colspan;
                });
            });

            const cols = table.getCols();
            for (let i = 0; i < cols.length; i++) {
                if (i >= firstSelectColIndex && i <= lastSelectColIndex) {
                    cols[i].remove();
                }
                if (i > lastSelectColIndex) {
                    break;
                }
            }
            table.formatTableWidth();
        }

        removeTable() {
            const selectTds = this.tableSelection.selectedTds;
            if (!selectTds.length) return;
            this.findTable(selectTds[0]).remove();
        }

        mergeCells() {
            if (!this.tableSelection.selectedTds.length) return;
            const selectTds = this.tableSelection.selectedTds;

            // 计算需要合并的单元格的行列数
            const counts = selectTds.reduce(
                (pre, cellInner) => {
                    // 此单元格所在列需要跨的行数
                    const colId = cellInner.colId;
                    if (!pre[0][colId]) pre[0][colId] = 0;
                    pre[0][colId] += cellInner.rowspan;
                    // 此单元格所在行需要跨的列数
                    const rowId = cellInner.rowId;
                    if (!pre[1][rowId]) pre[1][rowId] = 0;
                    pre[1][rowId] += cellInner.colspan;
                    return pre;
                },
                [{}, {}]
            );
            // counts[0] 记录的是 colId 对应的跨行数
            // counts[1] 记录的是 rowId 对应的跨列数
            const rowCount = Math.max(...Object.values(counts[0]));
            const colCount = Math.max(...Object.values(counts[1]));

            // console.log(counts);
            // console.log('row', rowCount);
            // console.log('col', colCount);
            // 注意清除 block 的 cache.detla
            // 若不清除 cache.detla 导致显示正常但在获取 quill.getContents() 时会有原 cellInner 未改变的情况
            // 防止这种情况直接 clone
            const mergedCell = selectTds[0].clone();
            selectTds[0].parent.appendChild(mergedCell);
            mergedCell.colspan = colCount;
            mergedCell.rowspan = rowCount;
            for (let i = 0; i < selectTds.length; i++) {
                selectTds[i].moveChildren(mergedCell);
                selectTds[i].remove();
            }
            const table = this.findTable(selectTds[0]);
            // 当合并后的单元格跨列等于 table 的列数, row 可以合并为 1
            const tableColLength = table.getColIds().length;
            if (tableColLength === colCount) {
                mergedCell.rowspan = 1;
            }
            // 当合并后的单元格跨行等于 table 的行数, col 可以合并为 1
            const tableRowLength = table.getRowIds().length;
            if (tableRowLength <= rowCount) {
                // 最终将 colspan 合并为 1, 所以要删除 colspan - 1 个 col
                // 遍历到合并单元格的 colId 后开始进行删除
                const tableCols = table.descendants(TableColFormat);
                let deleteCount = mergedCell.colspan - 1;
                let startDeleteIndex = null;
                for (let i = 0; i < tableCols.length; i++) {
                    if (deleteCount <= 0) break;
                    // 先删再判断, 防止删除合并后的最后一个单元格
                    if (startDeleteIndex !== null) {
                        // 若合并 col 中存在 width 为 null, 则合并后的 col 为 null
                        if (tableCols[startDeleteIndex].width === null || tableCols[i].width === null) {
                            tableCols[startDeleteIndex].width = null;
                        } else {
                            tableCols[startDeleteIndex].width += tableCols[i].width;
                        }
                        tableCols[i].remove();
                        deleteCount -= 1;
                    }
                    if (tableCols[i].colId === mergedCell.colId) {
                        startDeleteIndex = i;
                    }
                }
                mergedCell.colspan = 1;
            }
        }

        setBackgroundColor(color, cells) {
            if (!cells.length) return;
            cells.map((cellInner) => (cellInner.style = `background-color: ${color};`));
        }
    }

    // 不可插入至表格的 blot
    const tableCantInsert = [blotName.tableCell];
    const isForbidInTableBlot = (blot) => {
        return tableCantInsert.includes(blot.statics.blotName);
    };

    const isForbidInTable = (current) => {
        return current && current.parent
            ? isForbidInTableBlot(current.parent)
                ? true
                : isForbidInTable(current.parent)
            : false;
    };

    TableModule.moduleName = moduleName.table;
    TableModule.toolName = toolName.table;

    TableModule.createEventName = CREATE_TABLE;
    icons[TableModule.toolName] = TableSvg;

    const rewirteFormats = () =>
        Quill.register(
            {
                [`formats/list/item`]: ListRewrite,
            },
            true
        );

    Quill.register(
        {
            [`modules/${TableModule.moduleName}`]: TableModule,
        },
        true
    );
    rewirteFormats();

    const quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                [{ script: 'sub' }, { script: 'super' }],
                [{ indent: '-1' }, { indent: '+1' }],
                [{ direction: 'rtl' }],
                [{ size: ['small', false, 'large', 'huge'] }],
                [{ header: [1, 2, 3, 4, 5, 6, false] }],
                [{ color: [] }, { background: [] }],
                [{ font: [] }],
                [{ align: ['', 'center', 'right', 'justify'] }],
                ['clean'],
                ['image', 'video'],

                [{ table: [] }],
            ],
            [`${TableModule.moduleName}`]: {
                fullWidth: true,
                tableToolTip: {
                    tipHeight: 12,
                    disableToolNames: ['bold', 'color'],
                },
                operationMenu: {},
                selection: {
                    primaryColor: '#0589f3',
                },
            },
        },
    });

    quill.setContents([
        // { insert: '\n' },
        // {
        //     attributes: { col: { tableId: 'w9tilwkgm1e', colId: '7arx3sf4z5v', width: '33.333333%', full: true } },
        //     insert: '\n',
        // },
        // {
        //     attributes: { col: { tableId: 'w9tilwkgm1e', colId: 'klrrpz1qhhr', width: '33.333333%', full: true } },
        //     insert: '\n',
        // },
        // {
        //     attributes: { col: { tableId: 'w9tilwkgm1e', colId: 'k9yw1zl8lyg', width: '33.333333%', full: true } },
        //     insert: '\n',
        // },
        // { insert: '1' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: '44kczjr1q8v',
        //             colId: '7arx3sf4z5v',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '2' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: '44kczjr1q8v',
        //             colId: 'klrrpz1qhhr',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '3' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: '44kczjr1q8v',
        //             colId: 'k9yw1zl8lyg',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '4' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'c74r2a835vl',
        //             colId: '7arx3sf4z5v',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '5' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'c74r2a835vl',
        //             colId: 'klrrpz1qhhr',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '6' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'c74r2a835vl',
        //             colId: 'k9yw1zl8lyg',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '7' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'bljhr2ww5ac',
        //             colId: '7arx3sf4z5v',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '8' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'bljhr2ww5ac',
        //             colId: 'klrrpz1qhhr',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '9' },
        // {
        //     attributes: {
        //         tableCellInner: {
        //             tableId: 'w9tilwkgm1e',
        //             rowId: 'bljhr2ww5ac',
        //             colId: 'k9yw1zl8lyg',
        //             rowspan: '1',
        //             colspan: '1',
        //         },
        //     },
        //     insert: '\n',
        // },
        // { insert: '\n' },
    ]);

    const contentDisplay = document.getElementsByClassName('contentDisplay')[0];
    document.getElementsByClassName('getContent')[0].onclick = () => {
        const content = quill.getContents();
        console.log(content);
        contentDisplay.innerHTML = '';

        content.map((content) => {
            const item = document.createElement('li');
            item.innerText = JSON.stringify(content) + ',';
            contentDisplay.appendChild(item);
        });
    };

})(Quill);
//# sourceMappingURL=demo.js.map
