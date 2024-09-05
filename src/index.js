import Quill from 'quill';
import { TableOperationMenu, TableSelection, TableTooltip } from './module';
import {
  ContainerFormat,
  ListItemRewrite,
  TableBodyFormat,
  TableCellFormat,
  TableCellInnerFormat,
  TableColFormat,
  TableColgroupFormat,
  TableFormat,
  TableRowFormat,
  TableWrapperFormat,
} from './format';
import { debounce, findParentBlot, isFunction, isUndefined, randomId, showTableSelector } from './utils';
import { CELL_MIN_PRE, CELL_MIN_WIDTH, CREATE_TABLE, blotName, moduleName, toolName } from './assets/const';
import TableSvg from './assets/icons/table.svg';

const Parchment = Quill.import('parchment');
const Delta = Quill.import('delta');
const Break = Quill.import('blots/break');
const BlockEmbed = Quill.import('blots/block/embed');
const Block = Quill.import('blots/block');
const Container = Quill.import('blots/container');
const icons = Quill.import('ui/icons');

ContainerFormat.allowedChildren = [Block, BlockEmbed, Container];

TableWrapperFormat.allowedChildren = [TableFormat];

TableFormat.allowedChildren = [TableBodyFormat, TableColgroupFormat];
TableFormat.requiredContainer = TableWrapperFormat;

TableBodyFormat.allowedChildren = [TableRowFormat];
TableBodyFormat.requiredContainer = TableFormat;

TableColgroupFormat.allowedChildren = [TableColFormat];
TableColgroupFormat.requiredContainer = TableFormat;

TableRowFormat.allowedChildren = [TableCellFormat];
TableRowFormat.requiredContainer = TableBodyFormat;

// Break to handle user select mutiple line cell to delete. MutationObserver will have `a addNodes: [br]` for td
TableCellFormat.allowedChildren = [TableCellInnerFormat, Break];
TableCellFormat.requiredContainer = TableRowFormat;

TableCellInnerFormat.requiredContainer = TableCellFormat;
TableCellInnerFormat.defaultChild = 'block';

export { ListItemRewrite };

Quill.register(
  {
    [`formats/${ContainerFormat.blotName}`]: ContainerFormat,

    [`formats/${TableCellInnerFormat.blotName}`]: TableCellInnerFormat,
    [`formats/${TableCellFormat.blotName}`]: TableCellFormat,
    [`formats/${TableRowFormat.blotName}`]: TableRowFormat,
    [`formats/${TableBodyFormat.blotName}`]: TableBodyFormat,
    [`formats/${TableFormat.blotName}`]: TableFormat,
    [`formats/${TableWrapperFormat.blotName}`]: TableWrapperFormat,

    [`formats/${TableColgroupFormat.blotName}`]: TableColgroupFormat,
    [`formats/${TableColFormat.blotName}`]: TableColFormat,
  },
  true,
);

// 不可插入至表格的 blot
export const tableCantInsert = [blotName.tableCell, 'code-block'];
export function isForbidInTableBlot(blot) {
  return tableCantInsert.includes(blot.statics.blotName);
};

export function isForbidInTable(current) {
  return current && current.parent
    ? isForbidInTableBlot(current.parent)
      ? true
      : isForbidInTable(current.parent)
    : false;
};
function createCell({ tableId, rowId, colId }) {
  const value = {
    tableId,
    rowId,
    colId,
    colspan: 1,
    rowspan: 1,
  };
  const tableCell = Parchment.create(blotName.tableCell, value);
  const tableCellInner = Parchment.create(blotName.tableCellInner, value);
  const block = Parchment.create('block');
  block.appendChild(Parchment.create('break'));
  tableCellInner.appendChild(block);
  tableCell.appendChild(tableCellInner);
  return tableCell;
};

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
        }
        else {
          this.controlItem = control[1];
        }
        this.buildCustomSelect(
          this.options.customSelect,
          control[1].tagName.toLowerCase(),
          this.options.customButton,
        );
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

        const tableNode = path.find((node) => {
          return (
            node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table')
          );
        });
        // 结束位置位处于表格内不显示
        if (tableNode) {
          if (this.table === tableNode) return;
          if (this.table) this.hideTableTools();
          this.showTableTools(tableNode, quill, this.options.selection);
        }
        else if (this.table) {
          this.hideTableTools();
        }
      },
      false,
    );
    // 绑定 table 的右键插入、删除事件
    this.quill.root.addEventListener('contextmenu', (evt) => {
      if (!this.table) return true;
      evt.preventDefault();

      const path = evt.path || (evt.composedPath && evt.composedPath());
      if (!path || path.length <= 0) return;

      const tableNode = path.find(
        node => node.tagName && node.tagName.toUpperCase() === 'TABLE' && node.classList.contains('ql-table'),
      );
      // 如果没有选中任何单元格，不显示右键菜单
      if (tableNode && this.tableSelection?.selectedTds?.length) {
        if (this.tableOperationMenu) this.tableOperationMenu = this.tableOperationMenu.destroy();

        const rowNode = path.find(
          node => node.tagName && node.tagName.toUpperCase() === 'TR' && node.dataset.rowId,
        );

        const cellNode = path.find(
          node => node.tagName && node.tagName.toUpperCase() === 'TD' && node.dataset.rowId,
        );

        this.tableOperationMenu = new TableOperationMenu(
          {
            table: tableNode,
            row: rowNode,
            cell: cellNode,
            left: evt.clientX,
            top: evt.clientY,
          },
          quill,
          this.options.operationMenu,
        );
      }
    });
    if (isUndefined(this.options.dragResize) || this.options.dragResize) {
      this.quill.theme.TableTooltip = new TableTooltip(this.quill, this.options.tableToolTip);
    }

    this.listenBalanceCells();
  }

  showTableTools(table, quill, options) {
    if (table) {
      this.table = table;
      this.tableSelection = new TableSelection(table, quill, options);
    }
  }

  hideTableTools() {
    this.tableSelection && this.tableSelection.destroy();
    this.tableOperationMenu && this.tableOperationMenu.destroy();
    if (this.quill.theme.TableTooltip) {
      this.quill.theme.TableTooltip.curTableId = null;
      this.quill.theme.TableTooltip.hide();
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
      if (delta.ops.length === 0) return delta;
      const hasCol = !!delta.ops[0].attributes?.col;
      let colDelta;
      // 粘贴表格若原本存在 col, 仅改变 id, 否则重新生成
      const { width: originTableWidth } = node.getBoundingClientRect();
      let isFull = this.options.fullWidth;
      if (hasCol) isFull = !!delta.ops[0].insert?.col?.full;
      const defaultColWidth = isFull
        ? `${Math.max(100 / colIds.length, CELL_MIN_PRE)}%`
        : `${Math.max(originTableWidth / colIds.length, CELL_MIN_WIDTH)}px`;

      if (!hasCol) {
        colDelta = colIds.reduce((colDelta, id) => {
          colDelta.insert('\n', {
            [blotName.tableCol]: {
              colId: id,
              tableId,
              width: defaultColWidth,
              full: isFull,
            },
          });
          return colDelta;
        }, new Delta());
      }
      else {
        for (let i = 0; i < delta.ops.length; i++) {
          if (!delta.ops[i].attributes[blotName.tableCol]) {
            break;
          }
          Object.assign(delta.ops[i].attributes[blotName.tableCol], {
            tableId,
            colId: colIds[i],
            full: isFull,
            width: !delta.ops[i].attributes[blotName.tableCol].width
              ? defaultColWidth
              : Number.parseFloat(delta.ops[i].attributes[blotName.tableCol].width) + (isFull ? '%' : 'px'),
          });
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
        }),
      );
    });
  }

  async buildCustomSelect(customSelect, tagName, customButton) {
    const dom = document.createElement('div');
    dom.classList.add('ql-custom-select');
    const selector = customSelect && isFunction(customSelect)
      ? await customSelect()
      : this.createSelect(customButton);
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
      const i = path.indexOf(this.controlItem);
      if (i > 2 || i === -1) {
        this.closeSelecte();
      }
    };
    window.addEventListener('click', this.tableInsertSelectCloseHandler);
  }

  createSelect(customButton) {
    return showTableSelector(customButton);
  }

  closeSelecte() {
    if (this.controlItem) {
      this.controlItem.classList.remove('ql-expanded');
      this.controlItem.dataset.active = false;
    }
    window.removeEventListener('click', this.tableInsertSelectCloseHandler);
  }

  // 以上为 toolbar table 按钮的选择生成器相关
  // 以下为 table module 生成表格相关功能函数

  insertTable(rows, columns) {
    if (rows >= 30 || columns >= 30) {
      throw new Error('Both rows and columns must be less than 30.');
    }

    this.quill.focus();
    this.range = this.quill.getSelection();
    const range = this.range;
    if (range == null) return;
    const currentBlot = this.quill.getLeaf(range.index)[0];

    if (isForbidInTable(currentBlot)) {
      throw new Error(`Not supported nesting of ${currentBlot.type} type object within a table.`);
    }

    let delta = new Delta().retain(range.index);
    delta.insert('\n');
    const tableId = randomId();
    const colId = new Array(columns).fill(0).map(() => randomId());

    let { width, paddingLeft, paddingRight } = getComputedStyle(this.quill.root);
    width = Number.parseInt(width);
    paddingLeft = Number.parseInt(paddingLeft);
    paddingRight = Number.parseInt(paddingRight);
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
  }

  removeTable() {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length === 0) return;
    const tableBlot = findParentBlot(selectedTds[0], blotName.table);
    tableBlot && tableBlot.remove();
  }

  setStyle(styles, cells) {
    if (cells.length === 0) return;
    cells.map(cellInner => (cellInner.style = styles));
  }

  /**
   * after insert or remove cell. handle cell colspan and rowspan merge
   */
  fixTableByRemove(tableBlot) {
    // calculate all cells
    // maybe will get empty tr
    const trBlots = tableBlot.getRows();
    const tableCols = tableBlot.getCols();
    const colIdMap = tableCols.reduce((idMap, col) => {
      idMap[col.colId] = 0;
      return idMap;
    }, {});
    // merge rowspan
    const reverseTrBlots = [...trBlots].reverse();
    const removeTr = [];
    for (const [index, tr] of reverseTrBlots.entries()) {
      const i = trBlots.length - index - 1;
      if (tr.children.length <= 0) {
        removeTr.push(i);
      }
      else {
        // if have td rowspan across empty tr. minus rowspan
        tr.foreachCellInner((td) => {
          const sum = removeTr.reduce((sum, val) => td.rowspan + i > val ? sum + 1 : sum, 0);
          td.rowspan -= sum;
          // count exist col
          colIdMap[td.colId] += 1;
        });
      }
    }
    // merge colspan
    let index = 0;
    for (const count of Object.values(colIdMap)) {
      if (count === 0) {
        const spanCols = [];
        let skipRowNum = 0;
        for (const tr of Object.values(trBlots)) {
          const spanCol = spanCols.shift() || 0;
          let nextSpanCols = [];
          if (skipRowNum > 0) {
            nextSpanCols = tr.getCellByColumIndex(index - spanCol)[2];
            skipRowNum -= 1;
          }
          else {
            nextSpanCols = tr.removeCell(index - spanCol);
            if (nextSpanCols.skipRowNum) {
              skipRowNum += nextSpanCols.skipRowNum;
            }
          }
          for (const [i, n] of nextSpanCols.entries()) {
            spanCols[i] = (spanCols[i] || 0) + n;
          }
        }
      }
      else {
        index += 1;
      }
    }
    // remove col
    for (const col of tableCols) {
      if (colIdMap[col.colId] === 0) {
        if (col.prev) {
          col.prev.width += col.width;
        }
        else if (col.next) {
          col.next.width += col.width;
        }
        col.remove();
      }
    }
  }

  appendRow(isDown) {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    // find baseTd and baseTr
    const baseTd = selectedTds[isDown ? selectedTds.length - 1 : 0];
    const tableBlot = findParentBlot(baseTd, blotName.table);
    const [tableBodyBlot] = tableBlot.descendants(TableBodyFormat);
    if (!tableBodyBlot) return;

    const baseTdParentTr = findParentBlot(baseTd, blotName.tableRow);
    const tableTrs = tableBlot.getRows();
    const i = tableTrs.indexOf(baseTdParentTr);
    const insertRowIndex = i + (isDown ? baseTd.rowspan : 0);

    tableBodyBlot.insertRow(insertRowIndex);
  }

  removeRow() {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.table);
    const trs = tableBlot.getRows();
    let endTrIndex = trs.length;
    let nextTrIndex = -1;
    for (const td of selectedTds) {
      const tr = findParentBlot(td, blotName.tableRow);
      const index = trs.indexOf(tr);
      if (index < endTrIndex) {
        endTrIndex = index;
      }
      if (index + td.rowspan > nextTrIndex) {
        nextTrIndex = index + td.rowspan;
      }
    }

    const patchTds = {};
    for (let i = endTrIndex; i < Math.min(trs.length, nextTrIndex); i++) {
      const tr = trs[i];
      tr.foreachCellInner((td) => {
        // find cells in rowspan that exceed the deletion range
        if (td.rowspan + i > nextTrIndex) {
          patchTds[td.colId] = {
            rowspan: td.rowspan + i - nextTrIndex,
            colspan: td.colspan,
            colIndex: td.getColumnIndex(),
          };
        }
        // only remove td. empty tr to calculate colspan and rowspan
        td.parent.remove();
      });
    }

    if (trs[nextTrIndex]) {
      const nextTr = trs[nextTrIndex];
      const tableId = tableBlot.tableId;
      // insert cell in nextTr to patch exceed cell
      for (const [colId, { colIndex, colspan, rowspan }] of Object.entries(patchTds)) {
        nextTr.insertCell(colIndex, {
          tableId,
          rowId: nextTr.rowId,
          colId,
          colspan,
          rowspan,
        });
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  appendCol(isRight) {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;

    // find insert column index in row
    const [baseTd] = selectedTds.reduce((pre, cur) => {
      const columnIndex = cur.getColumnIndex();
      if (!isRight && columnIndex <= pre[1]) {
        pre = [cur, columnIndex];
      }
      else if (isRight && columnIndex >= pre[1]) {
        pre = [cur, columnIndex];
      }
      return pre;
    }, [null, isRight ? 0 : Infinity]);
    const columnIndex = baseTd.getColumnIndex() + (isRight ? baseTd.colspan : 0);

    const tableBlot = findParentBlot(baseTd, blotName.table);
    const tableId = tableBlot.tableId;
    const newColId = randomId();

    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      colgroup.insertColByIndex(columnIndex, {
        tableId,
        colId: newColId,
        width: tableBlot.full ? '6%' : '160px',
        full: tableBlot.full,
      });
    }

    // loop tr and insert cell at index
    // if index is inner cell, skip next `rowspan` line
    // if there are cells both have column span and row span before index cell, minus `colspan` cell for next line
    const trs = tableBlot.descendants(TableRowFormat);
    const spanCols = [];
    let skipRowNum = 0;
    for (const tr of Object.values(trs)) {
      const spanCol = spanCols.shift() || 0;
      if (skipRowNum > 0) {
        skipRowNum -= 1;
        continue;
      }
      const nextSpanCols = tr.insertCell(columnIndex - spanCol, {
        tableId,
        rowId: tr.rowId,
        colId: newColId,
        rowspan: 1,
        colspan: 1,
      });
      if (nextSpanCols.skipRowNum) {
        skipRowNum += nextSpanCols.skipRowNum;
      }
      for (const [i, n] of nextSpanCols.entries()) {
        spanCols[i] = (spanCols[i] || 0) + n;
      }
    }
  }

  removeCol() {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 0) return;
    const baseTd = selectedTds[0];
    const tableBlot = findParentBlot(baseTd, blotName.table);
    const colspanMap = {};
    for (const td of selectedTds) {
      if (!colspanMap[td.rowId]) colspanMap[td.rowId] = 0;
      colspanMap[td.rowId] += td.colspan;
    }
    const colspanCount = Math.max(...Object.values(colspanMap));
    const columnIndex = baseTd.getColumnIndex();

    const trs = tableBlot.descendants(TableRowFormat);
    for (let i = 0; i < colspanCount; i++) {
      const spanCols = [];
      let skipRowNum = 0;
      for (const tr of Object.values(trs)) {
        const spanCol = spanCols.shift() || 0;
        if (skipRowNum > 0) {
          skipRowNum -= 1;
          continue;
        }
        const nextSpanCols = tr.removeCell(columnIndex - spanCol);
        if (nextSpanCols.skipRowNum) {
          skipRowNum += nextSpanCols.skipRowNum;
        }
        for (const [i, n] of nextSpanCols.entries()) {
          spanCols[i] = (spanCols[i] || 0) + n;
        }
      }
    }
    // delete col need after remove cell. remove cell need all column id
    // manual delete col. use fixTableByRemove to delete col will delete extra cells
    const [colgroup] = tableBlot.descendants(TableColgroupFormat);
    if (colgroup) {
      for (let i = 0; i < colspanCount; i++) {
        colgroup.removeColByIndex(columnIndex);
      }
    }

    this.fixTableByRemove(tableBlot);
  }

  splitCell() {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length !== 1) return;
    const baseTd = selectedTds[0];
    if (baseTd.colspan === 1 && baseTd.rowspan === 1) return;
    const baseTr = findParentBlot(baseTd, blotName.tableRow);
    const tableBlot = findParentBlot(baseTd, blotName.table);
    const tableId = tableBlot.tableId;
    const colIndex = baseTd.getColumnIndex();
    const colIds = tableBlot.getColIds().slice(colIndex, colIndex + baseTd.colspan).reverse();

    let curTr = baseTr;
    let rowspan = baseTd.rowspan;
    // reset span first. insertCell need colspan to judge insert position
    baseTd.colspan = 1;
    baseTd.rowspan = 1;
    while (curTr && rowspan > 0) {
      for (const id of colIds) {
        // keep baseTd. baseTr should insert at baseTd's column index + 1
        if (curTr === baseTr && id === baseTd.colId) continue;
        curTr.insertCell(colIndex + (curTr === baseTr ? 1 : 0), {
          tableId,
          rowId: curTr.rowId,
          colId: id,
          rowspan: 1,
          colspan: 1,
        });
      }

      rowspan -= 1;
      curTr = curTr.next;
    }
  }

  mergeCells() {
    const selectedTds = this.tableSelection.selectedTds;
    if (selectedTds.length <= 1) return;
    const counts = selectedTds.reduce(
      (pre, selectTd, index) => {
        // count column span
        const colId = selectTd.colId;
        if (!pre[0][colId]) pre[0][colId] = 0;
        pre[0][colId] += selectTd.rowspan;
        // count row span
        const rowId = selectTd.rowId;
        if (!pre[1][rowId]) pre[1][rowId] = 0;
        pre[1][rowId] += selectTd.colspan;
        // merge select cell
        if (index !== 0) {
          selectTd.moveChildren(pre[2]);
          selectTd.parent.remove();
        }
        return pre;
      },
      [{}, {}, selectedTds[0]],
    );

    const rowCount = Math.max(...Object.values(counts[0]));
    const colCount = Math.max(...Object.values(counts[1]));
    const baseTd = counts[2];
    baseTd.colspan = colCount;
    baseTd.rowspan = rowCount;

    const tableBlot = findParentBlot(baseTd, blotName.table);
    this.fixTableByRemove(tableBlot);
  }

  // handle unusual delete cell
  fixUnusuaDeletelTable(tableBlot) {
    // calculate all cells
    const trBlots = tableBlot.getRows();
    const tableColIds = tableBlot.getColIds();
    if (trBlots.length === 0 || tableColIds.length === 0) {
      return tableBlot.remove();
    }
    // append by col
    const cellSpanMap = new Array(trBlots.length).fill(0).map(() => new Array(tableColIds.length).fill(false));
    const tableId = tableBlot.tableId;
    for (const [indexTr, tr] of trBlots.entries()) {
      let indexTd = 0;
      let indexCol = 0;
      const curCellSpan = cellSpanMap[indexTr];
      const tds = tr.descendants(TableCellFormat);
      // loop every row and column
      while (indexCol < tableColIds.length) {
        // skip when rowspan or colspan
        if (curCellSpan[indexCol]) {
          indexCol += 1;
          continue;
        }
        const curTd = tds[indexTd];
        // if colId does not match. insert a new one
        if (!curTd || curTd.colId !== tableColIds[indexCol]) {
          tr.insertBefore(
            createCell(
              {
                tableId,
                colId: tableColIds[indexCol],
                rowId: tr.rowId,
              },
            ),
            curTd,
          );
        }
        else {
          if (indexTr + curTd.rowspan - 1 >= trBlots.length) {
            curTd.getCellInner().rowspan = trBlots.length - indexTr;
          }

          const { colspan, rowspan } = curTd;
          // skip next column cell
          if (colspan > 1) {
            for (let c = 1; c < colspan; c++) {
              curCellSpan[indexCol + c] = true;
            }
          }
          // skip next rowspan cell
          if (rowspan > 1) {
            for (let r = indexTr + 1; r < indexTr + rowspan; r++) {
              for (let c = 0; c < colspan; c++) {
                cellSpanMap[r][indexCol + c] = true;
              }
            }
          }
          indexTd += 1;
        }
        indexCol += 1;
      }

      // if td not match all exist td. Indicates that a cell has been inserted
      if (indexTd < tds.length) {
        for (let i = indexTd; i < tds.length; i++) {
          tds[i].remove();
        }
      }
    }
  }

  balanceTables() {
    for (const tableBlot of this.quill.scroll.descendants(TableFormat)) {
      this.fixUnusuaDeletelTable(tableBlot);
    }
  }

  listenBalanceCells() {
    this.fixTableByLisenter = debounce(this.balanceTables, 100);
    this.quill.on(
      Quill.events.SCROLL_OPTIMIZE,
      (mutations) => {
        mutations.some((mutation) => {
          if (
            // TODO: if need add ['COL', 'COLGROUP']
            ['TD', 'TR', 'TBODY', 'TABLE'].includes(mutation.target.tagName)
          ) {
            this.fixTableByLisenter();
            return true;
          }
          return false;
        });
      },
    );
  }
}

TableModule.moduleName = moduleName.table;
TableModule.toolName = toolName.table;

TableModule.keyboradHandler = {
  'forbid remove table by backspace': {
    key: 'backspace',
    collapsed: true,
    offset: 0,
    handler(range, context) {
      const [blot] = this.quill.getLine(range.index);
      if (blot.prev instanceof TableWrapperFormat) return false;

      if (context.format[blotName.tableCellInner]) {
        const offset = blot.offset(findParentBlot(blot, blotName.tableCellInner));
        if (offset === 0) {
          return false;
        }
      }
      return true;
    },
  },
  'forbid remove table by delete': {
    key: 'delete',
    collapsed: true,
    handler(range, context) {
      const [blot, offsetInline] = this.quill.getLine(range.index);
      if (blot.next instanceof TableWrapperFormat && offsetInline === blot.length() - 1) return false;

      if (context.format[blotName.tableCellInner]) {
        const tableInnerBlot = findParentBlot(blot, blotName.tableCellInner);
        const offsetInTableInner = blot.offset(tableInnerBlot);
        if (offsetInTableInner + offsetInline === tableInnerBlot.length() - 1) {
          return false;
        }
      }
      return true;
    },
  },
};
TableModule.createEventName = CREATE_TABLE;
icons[TableModule.toolName] = TableSvg;

export const rewirteFormats = () =>
  Quill.register(
    {
      [`formats/list/item`]: ListItemRewrite,
    },
    true,
  );

export default TableModule;
export {
  TableOperationMenu,
  TableSelection,
  TableTooltip,
};

// TODO: redo and undo
// TODO: maybe col need change to EmbedBlock
// TODO: BlockEmbed can not setContents to insert table
// TODO: don't allow index at col
