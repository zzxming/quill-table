import Quill from 'quill';
const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');
const BlockEmbed = Quill.import('blots/block/embed');
const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');
const icons = Quill.import('ui/icons');

import TableTooltip from './module/TableToolTip';
import TableSelection from './module/TableSelection';
import TableOperationMenu from './module/TableOperationMenu';

import ContainBlot from './blot/contain';

import TableCellFormat from './format/TableCellFormat';
import TableRowFormat from './format/TableRowFormat';
import TableFormat from './format/TableFormat';
import TableWrapper from './format/TableWrapperFormat';
import TableBodyFormat from './format/TableBodyFormat';
import TableColgroupFormat from './format/TableColgroupFormat';
import TableColFormat from './format/TableColFormat';
import TableCellInnerFormat from './format/TableCellInnerFormat';

ContainBlot.allowedChildren = [Block, BlockEmbed, Container];

TableWrapper.allowedChildren = [TableFormat];

TableFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
TableFormat.requiredContainer = TableWrapper;

TableBodyFormat.allowedChildren = [TableRowFormat];
TableBodyFormat.requiredContainer = TableFormat;

TableColgroupFormat.allowedChildren = [TableColFormat];
TableColgroupFormat.requiredContainer = TableFormat;

TableRowFormat.allowedChildren = [TableCellFormat];
TableRowFormat.requiredContainer = TableBodyFormat;

TableCellFormat.allowedChildren = [Block, BlockEmbed, Container];

TableCellFormat.allowedChildren = [TableCellInnerFormat];

TableCellInnerFormat.defaultChild = 'block';
TableCellInnerFormat.allowedChildren = [Block, BlockEmbed, Container];

Quill.register(
    {
        [`formats/${ContainBlot.blotName}`]: ContainBlot,

        [`formats/${TableCellInnerFormat.blotName}`]: TableCellInnerFormat,
        [`formats/${TableCellFormat.blotName}`]: TableCellFormat,
        [`formats/${TableRowFormat.blotName}`]: TableRowFormat,
        [`formats/${TableBodyFormat.blotName}`]: TableBodyFormat,
        [`formats/${TableFormat.blotName}`]: TableFormat,
        [`formats/${TableWrapper.blotName}`]: TableWrapper,

        [`formats/${TableColgroupFormat.blotName}`]: TableColgroupFormat,
        [`formats/${TableColFormat.blotName}`]: TableColFormat,
    },
    true
);

import { isFunction, randomId, showTableSelector } from './utils';
import { CREATE_TABLE } from './assets/const/event';

class TableModule {
    constructor(quill, options) {
        this.quill = quill;
        this.options = options;

        this.tableBtn = null;
        this.tableInsertSelectCloseHandler = null;

        const toolbar = this.quill.getModule('toolbar');
        if (toolbar) {
            const control = toolbar.controls.find(([name]) => name === TableModule.toolName);
            if (control) {
                this.tableBtn = control[1];
            }
            this.buildCustomSelect(this.options.customSelect);
            toolbar.addHandler(TableModule.toolName, this.handleSelectDisplay.bind(this));
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
        this.tableSelection = null;
        this.tableOperationMenu = null;
        this.table = null;
    }

    // 粘贴表格处理
    pasteTableHandler() {
        let tableId = randomId();
        let rowId = randomId();
        let colId = [];
        let countColOver = false;
        let cellCount = 0;

        // 重新生成 table 里的所有 id, cellFormat 和 colFormat 进行 table 的添加
        // addMatcher 匹配的是标签字符串, 不是 blotName, 只是这些 blotName 设置的是标签字符串
        this.quill.clipboard.addMatcher(blotName.table, (node, delta) => {
            // 添加 col
            const tdWidth = Array.from(node.getElementsByTagName('tr')).reduce((pre, cur) => {
                const w = Array.from(cur.getElementsByTagName('td')).map((td) => td.getBoundingClientRect().width);
                if (w.length < pre.length) return pre;
                return w.map((width, i) => Math.max(width, pre[i] ?? 0)).concat(pre.slice(w.length));
            }, []);

            const colDelta = new Delta();
            colId.map((id, i) => {
                colDelta.insert('\n', {
                    [blotName.tableCol]: {
                        colId: id,
                        tableId,
                        width: tdWidth[i] ?? 150,
                    },
                });
            });

            tableId = randomId();
            colId = [];
            countColOver = false;
            cellCount = 0;
            return colDelta.concat(delta);
        });

        this.quill.clipboard.addMatcher(blotName.tableRow, (node, delta) => {
            rowId = randomId();
            countColOver = true;
            return delta;
        });

        this.quill.clipboard.addMatcher(blotName.tableCell, (node, delta) => {
            if (!countColOver) {
                colId.push(randomId());
            }
            cellCount += 1;
            return delta.compose(
                new Delta().retain(delta.length(), {
                    [blotName.tableCellInner]: {
                        tableId,
                        rowId,
                        colId: colId[(cellCount - 1) % colId.length],
                        rowspan: node.getAttribute('rowspan'),
                        colspan: node.getAttribute('colspan'),
                        style: node.getAttribute('style'),
                    },
                })
            );
        });
    }

    async buildCustomSelect(customSelect) {
        if (!this.tableBtn) return;

        const dom = document.createElement('div');
        dom.classList.add('ql-custom-select');
        const selector = customSelect && isFunction(customSelect) ? await customSelect() : this.createSelect();
        dom.appendChild(selector);
        selector.addEventListener(CREATE_TABLE, (e) => {
            const { row, col } = e.detail;
            if (!row || !col) return;
            this.insertTable(row, col);
        });
        this.tableBtn.appendChild(dom);
        this.tableBtn.style.position = 'relative';
    }

    async handleSelectDisplay() {
        this.quill.focus();
        this.range = this.quill.getSelection();

        this.tableBtn.classList.add('ql-expanded');
        this.tableBtn.dataset.active = true;
        window.removeEventListener('click', this.tableInsertSelectCloseHandler);
        this.tableInsertSelectCloseHandler = this.closeSelecte.bind(this);
        window.addEventListener('click', this.tableInsertSelectCloseHandler);
    }

    createSelect() {
        return showTableSelector();
    }

    closeSelecte(e) {
        const path = (e.composedPath && e.composedPath()) || e.path;
        const i = path.findIndex((el) => el === this.tableBtn);
        if (i > 2 || i === -1) {
            this.tableBtn.classList.remove('ql-expanded');
            this.tableBtn.dataset.active = false;
            window.removeEventListener('click', this.tableInsertSelectCloseHandler);
        }
    }

    // 以上为 toolbar table 按钮的选择生成器相关
    // 以下为 table module 生成表格相关功能函数

    insertTable(rows, columns) {
        if (rows >= 100 || columns >= 100) {
            throw new Error('Both rows and columns must be less than 100.');
        }

        // const range = this.quill.getSelection(true);
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

            delta = new Array(columns).fill('\n').reduce((memo, text, i) => {
                memo.insert(text, {
                    [blotName.tableCol]: {
                        width: Math.floor((width - paddingLeft - paddingRight - 1) / columns), // 1px border
                        tableId,
                        colId: colId[i],
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
                向右: 若 colspan + i > index, 则 colspan + 1 
                向左: 若 colspan + i >= index, 则 colspan + 1 
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
                    width: 160,
                    tableId: table.tableId,
                    colId: newColId,
                });
                col.parent.insertBefore(newCol, isRight ? col.next : col);
            }
            return col.colId === baseColId;
        });
        table.formatTableWidth();

        const stopIndex = isRight ? baseColIndex : Math.max(baseColIndex - 1, 0);
        let skipRow = 0;
        rows.map((tr) => {
            let colspanIncrease = false;
            let beforeCell = null;
            tr.foreachCellInner((cell) => {
                if (skipRow > 0) {
                    skipRow -= 1;
                    colspanIncrease = true;
                    return true;
                }
                const colIndexInSelected = colIds.findIndex((id) => id === cell.colId);
                if (cell.colspan + colIndexInSelected > stopIndex) {
                    beforeCell = cell.parent;
                    isRight && colIndexInSelected <= stopIndex && (beforeCell = beforeCell.next);
                }

                if (cell.colspan !== 1) {
                    if (
                        (isRight && cell.colspan + colIndexInSelected > stopIndex + 1) ||
                        (!isRight && cell.colspan + colIndexInSelected >= stopIndex)
                    ) {
                        cell.colspan += 1;
                        colspanIncrease = true;
                        skipRow = cell.rowspan - 1;
                        return true;
                    }
                }

                if (colIndexInSelected > stopIndex) {
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
                    tableCols[startDeleteIndex].width += tableCols[i].width;
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

    setBackgroundColor(color) {
        if (!this.tableSelection.selectedTds.length) return;
        const selectTds = this.tableSelection.selectedTds;

        selectTds.map((cellInner) => (cellInner.style = `background-color: ${color};`));
    }
}

// 不可插入至表格的 blot
export const tableCantInsert = [blotName.tableCell];
export const isForbidInTableBlot = (blot) => {
    return tableCantInsert.includes(blot.statics.blotName);
};

export const isForbidInTable = (current) => {
    return current && current.parent
        ? isForbidInTableBlot(current.parent)
            ? true
            : isForbidInTable(current.parent)
        : false;
};

TableModule.moduleName = blotName.table;
TableModule.toolName = blotName.table;

TableModule.createEventName = CREATE_TABLE;

import TableSvg from './assets/icons/table.svg';
import { blotName } from './assets/const/name';
icons[TableModule.toolName] = TableSvg;
export default TableModule;
