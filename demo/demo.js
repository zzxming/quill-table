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

  /* eslint-disable unused-imports/no-unused-vars */

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
      content.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const originOverflow = getComputedStyle(appendTo).overflow;
    appendTo.style.overflow = 'hidden';

    appendTo.appendChild(dialog);
    const close = () => {
      beforeClose();
      dialog.remove();
      appendTo.style.overflow = originOverflow;
    };
    dialog.addEventListener('click', close);
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
      inputLabel.textContent = label;
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

    input.addEventListener('focus', () => {
      inputInput.classList.add('focus');
    });
    input.addEventListener('blur', () => {
      inputInput.classList.remove('focus');
    });

    const errorTip = (msg) => {
      if (inputInput.classList.contains('error')) {
        inputInput.querySelector('.error_tip').textContent = msg;
      }
      else {
        const errorTip = document.createElement('span');
        errorTip.classList.add('error_tip');
        errorTip.textContent = msg;
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
    confirmBtn.textContent = 'Confirm';

    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('create_control_btn', 'cancel');
    cancelBtn.textContent = 'Cancel';

    control.appendChild(confirmBtn);
    control.appendChild(cancelBtn);
    box.appendChild(control);

    return new Promise((resolve, reject) => {
      const { close } = dialog({ child: box, beforeClose: reject });

      confirmBtn.addEventListener('click', async () => {
        const row = Number(rowInput.value);
        const col = Number(colInput.value);

        if (Number.isNaN(row) || row <= 0) {
          return rowErrorTip('Invalid number');
        }
        if (Number.isNaN(col) || col <= 0) {
          return colErrorTip('Invalid number');
        }
        resolve({ row, col });
        close();
      });
      cancelBtn.addEventListener('click', () => {
        close();
      });
    });
  };

  /**
   * 显示表格选择器
   */
  const showTableSelector = (customButton) => {
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
    selectCustom.textContent = customButton || '自定义行列数';

    selectDom.appendChild(selectBlock);
    selectDom.appendChild(selectCustom);

    const sendTableData = ({ row, col }) => {
      selectDom.dispatchEvent(new CustomEvent(CREATE_TABLE, { detail: { row: Number(row), col: Number(col) } }));
    };
    const updateSelectBlockItems = () => {
      const { row, col } = selectDom.dataset;
      Array.prototype.forEach.call(selectBlock.querySelectorAll('.active'), (item) => {
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
        }
        else {
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
      delete selectDom.dataset.row;
      delete selectDom.dataset.col;
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
      for (const prop in rules) {
        domNode.style[prop] = rules[prop];
      }
    }
  }
  function isRectanglesIntersect(a, b, tolerance = 4) {
    const { x: minAx, y: minAy, x1: maxAx, y1: maxAy } = a;
    const { x: minBx, y: minBy, x1: maxBx, y1: maxBy } = b;
    const notOverlapX = maxAx <= minBx + tolerance || minAx + tolerance >= maxBx;
    const notOverlapY = maxAy <= minBy + tolerance || minAy + tolerance >= maxBy;
    return !(notOverlapX || notOverlapY);
  }

  function getRelativeRect(targetRect, container) {
    const containerRect = container.getBoundingClientRect();

    return {
      x: targetRect.x - containerRect.x - container.scrollLeft,
      y: targetRect.y - containerRect.y - container.scrollTop,
      x1: targetRect.x - containerRect.x - container.scrollLeft + targetRect.width,
      y1: targetRect.y - containerRect.y - container.scrollTop + targetRect.height,
      width: targetRect.width,
      height: targetRect.height,
    };
  }

  function findParentBlot(blot, targetBlotName) {
    let target = blot.parent;
    while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
      target = target.parent;
    }
    if (target === blot.scroll) {
      throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
    }
    return target;
  }

  function isString(val) {
    return typeof val === 'string';
  }
  function isFunction(val) {
    return typeof val === 'function';
  }
  function isUndefined(val) {
    return val === undefined;
  }
  function isArray(val) {
    return Array.isArray(val);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
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
      handler() {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.mergeCells();
        tableModule.hideTableTools();
      },
    },
    splitCell: {
      text: '拆分单元格',
      groupEnd: true,
      handler() {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.splitCell();
        tableModule.hideTableTools();
      },
    },
    setBackgroundColor: {
      text: '设置背景颜色',
      isColorChoose: true,
      handler(color) {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.setStyle({ backgroundColor: color }, this.selectedTds);
      },
    },
    clearBackgroundColor: {
      text: '清除背景颜色',
      handler() {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.setStyle({ backgroundColor: null }, this.selectedTds);
      },
    },
    setBorderColor: {
      text: '设置边框颜色',
      isColorChoose: true,
      handler(color) {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.setStyle({ borderColor: color }, this.selectedTds);
      },
    },
    clearBorderColor: {
      text: '清除边框颜色',
      handler() {
        const tableModule = this.quill.getModule(moduleName.table);
        tableModule.setStyle({ borderColor: null }, this.selectedTds);
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
  class TableOperationMenu {
    constructor(params, quill, options = {}) {
      this.table = params.table;
      this.quill = quill;
      this.options = options;
      const tableModule = this.quill.getModule(moduleName.table);
      this.tableSelection = tableModule.tableSelection;
      this.menuItems = {};
      this.mergeMenuItems();

      this.boundary = this.tableSelection.boundary;
      this.selectedTds = this.tableSelection.selectedTds;

      this.destroyHandler = this.destroy.bind(this);
      this.menuInitial(params);

      document.addEventListener('click', this.destroyHandler, false);
    }

    mergeMenuItems() {
      if (this.options?.replaceItems) {
        this.menuItems = this.options?.items ?? {};
      }
      else if (this.options?.modifyItems) {
        this.menuItems = this.modifyMenuItems(this.options?.items ?? {});
      }
      else {
        this.menuItems = MENU_ITEMS_DEFAULT;
      }
    }

    /**
       * Override the attributes of the context menu items
       */
    modifyMenuItems() {
      if (!this.options?.modifyItems) return MENU_ITEMS_DEFAULT;
      const newOptionsItems = { ...MENU_ITEMS_DEFAULT };
      for (const [item, itemNewOptions] of Object.entries(this.options?.items)) {
        newOptionsItems[item] = Object.assign({ ...newOptionsItems[item] }, itemNewOptions);
      }
      return newOptionsItems;
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

    menuInitial({ _table, _row, _cell, left, top }) {
      this.domNode = document.createElement('div');
      this.domNode.classList.add('ql-table-operation-menu');

      css(this.domNode, {
        'position': 'absolute',
        'min-height': `${MENU_MIN_HEIHGT}px`,
      });

      for (const [name, item] of Object.entries(this.menuItems)) {
        if (item.subTitle) {
          this.domNode.appendChild(subTitleCreator(item.subTitle));
        }

        this.domNode.appendChild(this.menuItemCreator(Object.assign({}, MENU_ITEMS_DEFAULT[name], item)));

        if (item.groupEnd) {
          this.domNode.appendChild(dividingCreator());
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
        subTitle.textContent = title;
        return subTitle;
      }
    }

    destroy() {
      this.domNode.remove();
      document.removeEventListener('click', this.destroyHandler, false);
      return null;
    }

    menuItemCreator({ text, iconSrc, handler, isColorChoose }) {
      const node = document.createElement(isColorChoose ? 'label' : 'div');
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
        textSpan.textContent = text;
        node.appendChild(textSpan);
      }
      else if (isFunction(text)) {
        let nodes = text.call(this);
        if (!isArray(nodes)) {
          nodes = [nodes];
        }
        nodes.map(sub => node.appendChild(sub));
      }

      // color choose handler will trigger when the color input event
      if (isColorChoose) {
        const input = document.createElement('input');
        input.type = 'color';
        Object.assign(input.style, {
          width: 0,
          height: 0,
          padding: 0,
          border: 0,
        });
        if (isFunction(handler)) {
          node.addEventListener('click', e => e.stopPropagation());
          input.addEventListener(
            'input',
            () => {
              handler.call(this, input.value);
            },
            false,
          );
        }
        node.appendChild(input);
      }
      else {
        isFunction(handler) && node.addEventListener('click', handler.bind(this), false);
      }
      return node;
    }
  }

  const Container$7 = Quill.import('blots/container');
  const Parchment$a = Quill.import('parchment');

  class ContainerFormat extends Container$7 {
    static create() {
      const node = super.create();
      return node;
    }

    insertBefore(blot, ref) {
      if (blot.statics.blotName === this.statics.blotName) {
        super.insertBefore(blot.children.head, ref);
      }
      else {
        super.insertBefore(blot, ref);
      }
    }

    format(name, value) {
      this.children.tail.format(name, value);
    }

    replace(target) {
      if (target.statics.blotName !== this.statics.blotName) {
        const item = Parchment$a.create(this.statics.defaultChild);
        target.moveChildren(item);
        this.appendChild(item);
      }
      if (target.parent == null) return;
      super.replace(target);
    }
  }

  ContainerFormat.blotName = blotName.contain;
  ContainerFormat.tagName = 'contain';
  ContainerFormat.scope = Parchment$a.Scope.BLOCK_BLOT;
  ContainerFormat.defaultChild = 'block';

  const Parchment$9 = Quill.import('parchment');

  class TableCellInnerFormat extends ContainerFormat {
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
      // eslint-disable-next-line unicorn/no-array-for-each
      this.children.forEach((child) => {
        child.cache = {};
      });
    }

    get rowId() {
      return this.domNode.dataset.rowId;
    }

    set rowId(value) {
      this.parent && (this.parent.rowId = value);
      this.domNode.dataset.rowId = value;
    }

    get colId() {
      return this.domNode.dataset.colId;
    }

    set colId(value) {
      this.parent && (this.parent.colId = value);
      this.domNode.dataset.colId = value;
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

    get style() {
      return this.parent.style;
    }

    set style(value) {
      this.parent.style = value;
      this.domNode._style = this.parent.style;
      this.clearDeltaCache();
    }

    getColumnIndex() {
      const table = findParentBlot(this, blotName.table);
      return table.getColIds().indexOf(this.colId);
    }

    replace(target) {
      if (target.statics.blotName !== this.statics.blotName) {
        const cloneTarget = target.clone();
        target.moveChildren(cloneTarget);
        this.appendChild(cloneTarget);
        target.parent.insertBefore(this, target.next);
        target.remove();
      }
      else {
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
      if (parent != null && parent.statics.blotName !== blotName.tableCell) {
        const mark = Parchment$9.create('block');

        this.parent.insertBefore(mark, this.next);
        const tableWrapper = Parchment$9.create(blotName.tableWrapper, tableId);
        const table = Parchment$9.create(blotName.table, tableId);
        const tableBody = Parchment$9.create(blotName.tableBody);
        const tr = Parchment$9.create(blotName.tableRow, rowId);
        const td = Parchment$9.create(blotName.tableCell, {
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

  const Container$6 = Quill.import('blots/container');
  const Parchment$8 = Quill.import('parchment');

  class TableRowFormat extends Container$6 {
    static create(value) {
      const node = super.create();
      node.dataset.rowId = value;
      return node;
    }

    optimize() {
      super.optimize();
      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.dataset.rowId === this.domNode.dataset.rowId
      ) {
        next.moveChildren(this);
        next.remove();
      }
    }

    get rowId() {
      return this.domNode.dataset.rowId;
    }

    // insert cell at index
    // return the minus skip column number
    // [2, 3]. means next line should skip 2 columns. next next line skip 3 columns
    insertCell(targetIndex, value) {
      const skip = [];
      const next = this.children.iterator();
      let index = 0;
      let cur;
      while ((cur = next())) {
        index += cur.colspan;
        if (index > targetIndex) break;
        if (cur.rowspan !== 1) {
          for (let i = 0; i < cur.rowspan - 1; i++) {
            skip[i] = (skip[i] || 0) + cur.colspan;
          }
        }
      }

      if (cur && index - cur.colspan < targetIndex) {
        const tableCell = cur.getCellInner();
        tableCell.colspan += 1;
        if (cur.rowspan !== 1) {
          skip.skipRowNum = cur.rowspan - 1;
        }
      }
      else {
        const tableCell = Parchment$8.create(blotName.tableCell, value);
        const tableCellInner = Parchment$8.create(blotName.tableCellInner, value);
        const block = Parchment$8.create('block');
        block.appendChild(Parchment$8.create('break'));
        tableCellInner.appendChild(block);
        tableCell.appendChild(tableCellInner);
        this.insertBefore(tableCell, cur);
      }
      return skip;
    }

    getCellByColumIndex(stopIndex) {
      const skip = [];
      let cur;
      let cellEndIndex = 0;
      if (stopIndex < 0) return [cur, cellEndIndex, skip];
      const next = this.children.iterator();
      while ((cur = next())) {
        cellEndIndex += cur.colspan;
        if (cur.rowspan !== 1) {
          for (let i = 0; i < cur.rowspan - 1; i++) {
            skip[i] = (skip[i] || 0) + cur.colspan;
          }
        }
        if (cellEndIndex > stopIndex) break;
      }
      return [cur, cellEndIndex, skip];
    }

    removeCell(targetIndex) {
      if (targetIndex < 0) return [];
      const [cur, index, skip] = this.getCellByColumIndex(targetIndex);
      if (!cur) return skip;
      if (index - cur.colspan < targetIndex || cur.colspan > 1) {
        const [tableCell] = cur.descendants(TableCellInnerFormat);

        if (cur.colspan !== 1 && targetIndex === index - cur.colspan) {
          // if delete index is cell start index. update cell colId to next colId
          const tableBlot = findParentBlot(this, blotName.table);
          const colIds = tableBlot.getColIds();
          tableCell.colId = colIds[colIds.indexOf(tableCell.colId) + 1];
        }
        if (cur.rowspan !== 1) {
          skip.skipRowNum = cur.rowspan - 1;
        }

        tableCell.colspan -= 1;
      }
      else {
        cur.remove();
      }
      return skip;
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
  TableRowFormat.scope = Parchment$8.Scope.BLOCK_BLOT;

  const Container$5 = Quill.import('blots/container');
  const Parchment$7 = Quill.import('parchment');

  class TableBodyFormat extends Container$5 {
    optimize() {
      super.optimize();
      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.tagName === this.domNode.tagName
      ) {
        next.moveChildren(this);
        next.remove();
      }
    }

    deleteAt(index, length) {
      if (index === 0 && length === this.length()) {
        return this.parent.remove();
      }
      this.children.forEachAt(index, length, (child, offset, length) => {
        child.deleteAt(offset, length);
      });
    }

    // insert row at index
    insertRow(targetIndex) {
      const tableBlot = findParentBlot(this, blotName.table);
      if (!tableBlot) return;
      // get all column id. exclude the columns of the target index row with rowspan
      const colIds = tableBlot.getColIds();
      const rows = this.descendants(TableRowFormat);
      const insertColIds = new Set(colIds);
      let index = 0;
      for (const row of rows) {
        if (index === targetIndex) break;
        row.foreachCellInner((cell) => {
          if (index + cell.rowspan > targetIndex) {
            cell.rowspan += 1;
            insertColIds.delete(cell.colId);
            // colspan cell need remove all includes colId
            if (cell.colspan !== 1) {
              const colIndex = colIds.indexOf(cell.colId);
              for (let i = 0; i < cell.colspan - 1; i++) {
                insertColIds.delete(colIds[colIndex + i + 1]);
              }
            }
          }
        });
        index += 1;
      }
      // append new row
      const rowId = randomId();
      const tr = Parchment$7.create(blotName.tableRow, rowId);
      for (const colId of insertColIds) {
        const td = Parchment$7.create(blotName.tableCell, {
          rowId,
          colId,
          rowspan: 1,
          colspan: 1,
        });
        const tdInner = Parchment$7.create(blotName.tableCellInner, {
          tableId: tableBlot.tableId,
          rowId,
          colId,
          rowspan: 1,
          colspan: 1,
        });
        const block = Parchment$7.create('block');
        block.appendChild(Parchment$7.create('break'));
        tdInner.appendChild(block);
        td.appendChild(tdInner);
        tr.appendChild(td);
      }
      this.insertBefore(tr, rows[targetIndex] || null);
    }
  }
  TableBodyFormat.blotName = blotName.tableBody;
  TableBodyFormat.tagName = 'tbody';
  TableBodyFormat.scope = Parchment$7.Scope.BLOCK_BLOT;

  const Parchment$6 = Quill.import('parchment');
  const Container$4 = Quill.import('blots/container');

  class TableCellFormat extends Container$4 {
    static create(value) {
      const { rowId, colId, rowspan, colspan, style } = value;
      const node = super.create();
      node.dataset.rowId = rowId;
      node.dataset.colId = colId;
      node.setAttribute('rowspan', rowspan || 1);
      node.setAttribute('colspan', colspan || 1);
      node.style.cssText = style;
      return node;
    }

    get rowId() {
      return this.domNode.dataset.rowId;
    }

    set rowId(value) {
      this.domNode.dataset.rowId = value;
    }

    get colId() {
      return this.domNode.dataset.colId;
    }

    set colId(value) {
      this.domNode.dataset.colId = value;
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

    get style() {
      return this.domNode.style.cssText;
    }

    set style(value) {
      Object.assign(this.domNode.style, value);
    }

    getCellInner() {
      return this.descendants(TableCellInnerFormat)[0];
    }

    optimize() {
      super.optimize();
      const { colId, rowId, colspan, rowspan } = this.domNode.dataset;

      // td need only child tableCellInner. but for MutationObserver. tableCell need allow break
      // make sure tableCellInner is only child
      const tableBlot = findParentBlot(this, blotName.table);
      const cellInner = this.getCellInner();
      if (!cellInner) {
        // eslint-disable-next-line unicorn/no-array-for-each
        this.children.forEach((child) => {
          child.remove();
        });
        const tableCellInner = Parchment$6.create(blotName.tableCellInner, {
          tableId: tableBlot.tableId,
          rowId,
          colId,
          colspan: colspan || 1,
          rowspan: rowspan || 1,
        });
        const block = Parchment$6.create('block');
        block.appendChild(Parchment$6.create('break'));
        tableCellInner.appendChild(block);
        this.appendChild(tableCellInner);
      }

      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.dataset.rowId === rowId
        && next.domNode.dataset.colId === colId
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
      this.children.forEachAt(index, length, (child, offset, length) => {
        child.deleteAt(offset, length);
      });
    }
  }

  TableCellFormat.blotName = blotName.tableCell;
  TableCellFormat.tagName = 'td';
  TableCellFormat.className = 'ql-table-cell';
  TableCellFormat.scope = Parchment$6.Scope.BLOCK_BLOT;

  const Parchment$5 = Quill.import('parchment');

  class TableColFormat extends ContainerFormat {
    static create(value) {
      const { width, tableId, colId, full } = value;
      const node = super.create();
      node.setAttribute('width', `${Number.parseFloat(width)}${full ? '%' : 'px'}`);
      full && (node.dataset.full = full);
      node.dataset.tableId = tableId;
      node.dataset.colId = colId;
      node.setAttribute('contenteditable', false);
      return node;
    }

    get width() {
      const width = this.domNode.getAttribute('width');
      return Number.parseFloat(width);
    }

    set width(value) {
      const width = Number.parseFloat(value);
      return this.domNode.setAttribute('width', `${width}${this.full ? '%' : 'px'}`);
    }

    get colId() {
      return this.domNode.dataset.colId;
    }

    get full() {
      return Object.hasOwn(this.domNode.dataset, 'full');
    }

    formats() {
      const { tableId, colId } = this.domNode.dataset;
      return {
        [this.statics.blotName]: {
          tableId,
          colId,
          width: this.domNode.getAttribute('width'),
          full: Object.hasOwn(this.domNode.dataset, 'full'),
        },
      };
    }

    optimize() {
      super.optimize();

      const parent = this.parent;
      if (parent != null && parent.statics.blotName !== blotName.tableColGroup) {
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
        next != null
        && next.statics.blotName === this.statics.blotName
        && next.domNode.tagName === this.domNode.tagName
        && next.domNode.dataset.tableId === ttableId
        && next.domNode.dataset.colId === tcolId
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
      const cols = this.descendants(TableColFormat);
      if (!cols) return;
      const colsWidth = cols.reduce((sum, col) => col.width + sum, 0);
      if (colsWidth === 0 || Number.isNaN(colsWidth) || this.full) return null;
      this.domNode.style.width = `${colsWidth}px`;
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
      return Object.hasOwn(this.domNode.dataset, 'full');
    }

    set full(value) {
      this.domNode[value ? 'setAttribute' : 'removeAttribute']('data-full', '');
    }

    getRows() {
      return this.descendants(TableRowFormat);
    }

    getRowIds() {
      return this.getRows().map(d => d.rowId);
    }

    getCols() {
      return this.descendants(TableColFormat);
    }

    getColIds() {
      return this.getCols().map(d => d.colId);
    }

    optimize() {
      super.optimize();
      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.tagName === this.domNode.tagName
        && next.domNode.dataset.tableId === this.domNode.dataset.tableId
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

  class TableColgroupFormat extends Container$2 {
    optimize() {
      super.optimize();
      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.tagName === this.domNode.tagName
      ) {
        next.moveChildren(this);
        next.remove();
      }
    }

    deleteAt(index, length) {
      if (index === 0 && length === this.length()) {
        return this.parent.remove();
      }
      this.children.forEachAt(index, length, (child, offset, length) => {
        child.deleteAt(offset, length);
      });
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

    insertColByIndex(index, value) {
      const table = this.parent;
      if (!(table instanceof TableFormat)) {
        throw new TypeError('TableColgroupFormat should be child of TableFormat');
      }
      const col = this.findCol(index);
      const tableCellInner = Parchment$3.create(blotName.tableCol, value);
      if (table.full) {
      // TODO: first minus column should be near by
        const next = this.children.iterator();
        let cur;
        while ((cur = next())) {
          if (cur.width - tableCellInner.width >= CELL_MIN_PRE) {
            cur.width -= tableCellInner.width;
            break;
          }
        }
      }
      this.insertBefore(tableCellInner, col);
    }

    removeColByIndex(index) {
      const table = this.parent;
      if (!(table instanceof TableFormat)) {
        throw new TypeError('TableColgroupFormat should be child of TableFormat');
      }
      const col = this.findCol(index);
      if (col.next) {
        col.next.width += col.width;
      }
      else if (col.prev) {
        col.prev.width += col.width;
      }
      col.remove();
    }
  }
  TableColgroupFormat.blotName = blotName.tableColGroup;
  TableColgroupFormat.tagName = 'colgroup';
  TableColgroupFormat.scope = Parchment$3.Scope.BLOCK_BLOT;

  const Container$1 = Quill.import('blots/container');
  const Parchment$2 = Quill.import('parchment');

  class TableWrapperFormat extends Container$1 {
    static create(value) {
      const node = super.create();

      node.dataset.tableId = value;

      node.addEventListener(
        'dragstart',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        true,
      );
      // 不允许拖拽进 table
      node.addEventListener('drop', (e) => {
        e.preventDefault();
      });
      // 修改拖拽进入时的鼠标样式
      node.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'none';
      });
      return node;
    }

    get tableId() {
      return this.domNode.dataset.tableId;
    }

    insertBefore(blot, ref) {
      if (blot.statics.blotName === this.statics.blotName) {
        // 合并
        super.insertBefore(blot.children.head, ref);
      }
      else if (this.statics.allowedChildren.some(child => child.blotName === blot.statics.blotName)) {
        // 允许子 blot
        super.insertBefore(blot, ref);
      }
      else {
        // 非允许子 blot, ref 为 null 是插入头, 否则插入尾
        if (ref) {
          this.prev ? this.prev.insertBefore(blot, null) : this.parent.insertBefore(blot, this);
        }
        else {
          this.next ? this.next.insertBefore(blot, ref) : this.parent.appendChild(blot);
        }
      }
    }

    optimize() {
      super.optimize();
      const next = this.next;
      if (
        next != null
        && next.prev === this
        && next.statics.blotName === this.statics.blotName
        && next.domNode.tagName === this.domNode.tagName
        && next.domNode.dataset.tableId === this.domNode.dataset.tableId
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
  TableWrapperFormat.scope = Parchment$2.Scope.BLOCK_BLOT;

  const Parchment$1 = Quill.import('parchment');
  const ListItem = Quill.import('formats/list/item');

  class ListItemRewrite extends ListItem {
    replaceWith(name, value) {
      this.parent.isolate(this.offset(this.parent), this.length());
      if (name === this.parent.statics.blotName) {
        this.parent.replaceWith(name, value);
        return this;
      }
      else {
        if (name === blotName.tableCellInner) {
          const replacement = typeof name === 'string' ? Parchment$1.create(name, value) : name;
          replacement.replace(this.parent);
          this.attributes.copy(replacement);
          return replacement;
        }
        return super.replaceWith(name, value);
      }
    }
  }

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
      this.table = table;
      this.quill = quill;
      this.options = options;
      this.optionsMerge();
      if (!table) return null;

      this.startScrollX = 0;
      this.boundary = {};
      // 选中的 cell
      this.selectedTds = [];
      this.dragging = false;
      this.selectingHandler = this.mouseDownHandler.bind(this);
      this.cellSelect = null; // selection 显示边框
      this.scrollHandler = [];
      this.helpLinesInitial();

      const resizeObserver = new ResizeObserver(() => {
        this.hideSelection();
      });
      resizeObserver.observe(this.quill.root);

      this.quill.root.addEventListener('mousedown', this.selectingHandler, false);
      this.closeHandler = this.hideSelection.bind(this);
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
        const [dom, handle] = this.scrollHandler[i];
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

    // TODO: preventDefault select
    mouseDownHandler(mousedownEvent) {
      const { button, target, clientX, clientY } = mousedownEvent;
      const closestTable = target.closest('.ql-table');
      if (button !== 0 || !closestTable) return;

      const startTableId = closestTable.dataset.tableId;
      const startPoint = { x: clientX, y: clientY };
      this.startScrollX = this.table.parentNode.scrollLeft;
      this.selectedTds = this.computeSelectedTds(startPoint, startPoint);
      this.showSelection();

      const mouseMoveHandler = (mousemoveEvent) => {
        const { button, target, clientX, clientY } = mousemoveEvent;
        if (this.selectedTds.length > 1) {
          mousemoveEvent.preventDefault();
        }
        const closestTable = target.closest('.ql-table');
        if (
          button !== 0
          || !closestTable
          || closestTable.dataset.tableId !== startTableId
        ) {
          return;
        }

        this.dragging = true;
        const movePoint = { x: clientX, y: clientY };
        this.selectedTds = this.computeSelectedTds(startPoint, movePoint);
        this.updateSelection();
      };
      const mouseUpHandler = () => {
        document.body.removeEventListener('mousemove', mouseMoveHandler, false);
        document.body.removeEventListener('mouseup', mouseUpHandler, false);
        this.dragging = false;
      };

      document.body.addEventListener('mousemove', mouseMoveHandler, false);
      document.body.addEventListener('mouseup', mouseUpHandler, false);
    }

    computeSelectedTds(startPoint, endPoint) {
      // Use TableCell to calculation selected range, because TableCellInner is scrollable, the width will effect calculate
      const tableContainer = Quill.find(this.table);
      if (!tableContainer) return [];
      const tableCells = new Set(tableContainer.descendants(TableCellFormat));

      // set boundary to initially mouse move rectangle
      let boundary = {
        x: Math.min(endPoint.x, startPoint.x),
        y: Math.min(endPoint.y, startPoint.y),
        x1: Math.max(endPoint.x, startPoint.x),
        y1: Math.max(endPoint.y, startPoint.y),
      };
      const selectedCells = new Set();
      let findEnd = true;
      // loop all cells to find correct boundary
      while (findEnd) {
        findEnd = false;
        for (const cell of tableCells) {
          if (!cell.__rect) {
            cell.__rect = cell.domNode.getBoundingClientRect();
          }
          // Determine whether the cell intersects with the current boundary
          const { x, y, right, bottom } = cell.__rect;
          if (isRectanglesIntersect(boundary, { x, y, x1: right, y1: bottom }, ERROR_LIMIT)) {
            // add cell to selected
            selectedCells.add(cell);
            tableCells.delete(cell);
            // update boundary
            boundary = {
              x: Math.min(boundary.x, x),
              y: Math.min(boundary.y, y),
              x1: Math.max(boundary.x1, right),
              y1: Math.max(boundary.y1, bottom),
            };
            // recalculate boundary last cells
            findEnd = true;
            break;
          }
        }
      }
      for (const cell of [...selectedCells, ...tableCells]) {
        delete cell.__rect;
      }
      // save result boundary relative to the editor
      this.boundary = getRelativeRect({
        ...boundary,
        width: boundary.x1 - boundary.x,
        height: boundary.y1 - boundary.y,
      }, this.quill.root.parentNode);
      return Array.from(selectedCells).map(cell => cell.getCellInner());
    }

    updateSelection() {
      if (this.selectedTds.length === 0) return;
      const tableViewScrollLeft = this.table.parentNode.scrollLeft;
      const scrollTop = this.quill.root.parentNode.scrollTop;

      css(this.cellSelect, {
        left: `${this.boundary.x + (this.startScrollX - tableViewScrollLeft) - 1}px`,
        top: `${scrollTop * 2 + this.boundary.y}px`,
        width: `${this.boundary.width + 1}px`,
        height: `${this.boundary.height + 1}px`,
      });
    }

    showSelection() {
      this.clearScrollEvent();

      css(this.cellSelect, { display: 'block' });
      this.updateSelection();

      this.addScrollEvent(this.table.parentNode, () => {
        this.updateSelection();
      });
      const srcollHide = () => {
        this.hideSelection();
        this.quill.root.removeEventListener('scroll', srcollHide);
      };
      this.addScrollEvent(this.quill.root, srcollHide);
    }

    hideSelection() {
      this.boundary = {};
      this.selectedTds = [];

      this.cellSelect && css(this.cellSelect, {
        display: 'none',
      });
      this.clearScrollEvent();
    }

    destroy() {
      this.hideSelection();
      this.cellSelect.remove();
      this.cellSelect = null;
      this.clearScrollEvent();

      this.quill.root.removeEventListener('mousedown', this.selectingHandler, false);
      this.quill.off(Quill.events.TEXT_CHANGE, this.closeHandler);
      return null;
    }
  }

  /* eslint-disable unused-imports/no-unused-vars */

  let TIP_HEIGHT = 12;
  /*
    options = {
      tipHeight: 12,  // tooltip height
      disableToolNames: [],   // 表格内禁用项， toolbar 的 name
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
      this.root.style.height = `${TIP_HEIGHT}px`;

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
        new Set([...TableTooltip.disableToolNames, ...(this.options?.disableToolNames || [])]),
      );
    }

    listen() {
      this.quill.on(Quill.events.EDITOR_CHANGE, (eventName) => {
        if (eventName === Quill.events.TEXT_CHANGE) {
          return this.hide();
        }
        const range = this.quill.getSelection();

        if (range == null) {
          this.hide();
          this.enableFromTable();
          return;
        }
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
          this.tableCols = tableCols.statics.blotName === blotName.tableColGroup && tableCols.children.length > 0 ? tableCols.children.map(col => col) : [];

          const curTableId = tableWrapper.children.head.tableId;
          if (this.curTableId !== curTableId) {
            this.clearScrollEvent();
            this.focusTableChange = true;
            // 表格滚动同步事件
            this.addScrollEvent(
              this.tableWrapper.domNode,
              this.scrollSync.bind(this, this.tableWrapper.domNode),
            );
          }
          this.curTableId = curTableId;

          this.show();
          this.position();
          return;
        }
        else {
          this.enableFromTable();
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
      for (const [name, btn] of toolbar.controls) {
        if (TableTooltip.disableToolNames.includes(name)) {
          if (btn.tagName.toLowerCase() === 'select') {
            toolbar.container
              .querySelector(`.ql-picker.${btn.className}`)
              ?.classList[type]('ql-disabled-table');
          }
          else {
            btn.classList[type]('ql-disabled-table');
          }
        }
      }
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
        left: `${rect.x + this.tableWrapper.domNode.scrollLeft}px`,
      });
    };

    show() {
      // 若没有 colgroup col 元素，不显示
      if (this.tableCols.length === 0) {
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
              width = `${col.domNode.getBoundingClientRect().width}px`;
            }
            return `<div class="ql-table-col-header" style="width: ${width}">
            <div class="ql-table-col-separator" style="height: ${tableWrapperRect.height + TIP_HEIGHT - 3}px"></div>
          </div>`; // -3 为 border-width: 2, top: 1
          })
          .join('');

        this.focusTableChange = false;
        Object.assign(this.root.style, {
          width: `${tableWrapperRect.width}px`,
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
    }

    bindDrag() {
      let tipColBreak = null;
      let curColIndex = -1;
      const tableColHeads = Array.from(this.root.getElementsByClassName('ql-table-col-header'));
      const tableColHeadSeparators = Array.from(this.root.getElementsByClassName('ql-table-col-separator'));
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
          const maxRange
                      = resX > rect.right
                        ? tableColHeads[curColIndex + 1]
                          ? tableColHeads[curColIndex + 1].getBoundingClientRect().right - minWidth
                          : rect.right - minWidth
                        : Infinity;
          const minRange = rect.x + minWidth;

          resX = Math.min(Math.max(resX, minRange), maxRange);
        }
        else {
          if (resX - rect.x < CELL_MIN_WIDTH) {
            resX = rect.x + CELL_MIN_WIDTH;
          }
        }
        tipColBreak.style.left = `${resX}px`;
        tipColBreak.dataset.w = resX - rect.x;
      };
      const handleMouseup = (e) => {
        const w = Number.parseInt(tipColBreak.dataset.w);
        // table full 时处理不同
        if (this.table.full) {
          // 在调整一个后把所有 col 都变成百分比
          let pre = (w / this.table.domNode.getBoundingClientRect().width) * 100;
          const oldWidthPre = this.tableCols[curColIndex].width;
          if (pre < oldWidthPre) {
            // 缩小时若不是最后一个, 则把减少的量加在后面一个
            // 若是最后一个则把减少的量加在前面一个
            pre = Math.max(CELL_MIN_PRE, pre);
            const last = oldWidthPre - pre;
            if (this.tableCols[curColIndex + 1]) {
              this.tableCols[curColIndex + 1].width = `${this.tableCols[curColIndex + 1].width + last}%`;
            }
            else if (this.tableCols[curColIndex - 1]) {
              this.tableCols[curColIndex - 1].width = `${this.tableCols[curColIndex - 1].width + last}%`;
            }
            else {
              pre = 100;
            }
            this.tableCols[curColIndex].width = `${pre}%`;
          }
          else {
            // 增大时若不是最后一个, 则与后面一个的宽度合并, 最大不能超过合并的宽度, 增加的量来自后面一个的减少量
            // 若是最后一个则不处理
            if (this.tableCols[curColIndex + 1]) {
              const totalWidthNextPre = oldWidthPre + this.tableCols[curColIndex + 1].width;
              pre = Math.min(totalWidthNextPre - CELL_MIN_PRE, pre);
              this.tableCols[curColIndex].width = `${pre}%`;
              this.tableCols[curColIndex + 1].width = `${totalWidthNextPre - pre}%`;
            }
          }
        }
        else {
          this.table.domNode.style.width = `${
          Number.parseFloat(this.table.domNode.style.width)
          - Number.parseFloat(tableColHeads[curColIndex].style.width)
          + w
        }px`;
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

        // set drag init width
        const fullWidth = this.table.domNode.getBoundingClientRect().width;
        const colWidthAttr = Number.parseFloat(tableColHeads[curColIndex].style.width);
        const width = this.table.full ? colWidthAttr / 100 * fullWidth : colWidthAttr;
        divDom.dataset.w = width;

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
      for (const [i, el] of tableColHeadSeparators.entries()) {
        el.addEventListener(this.handledEvents.down, handleMousedown.bind(this, i));
        // 防止拖拽使触发 drag 导致可以使此元素被插入表格
        el.addEventListener('dragstart', (e) => {
          e.preventDefault();
        });
      }
    }
  }

  // 在 table 内时禁用的 tool 的 name
  TableTooltip.disableToolNames = [toolName.table, 'code-block'];

  var TableSvg = "<svg viewBox=\"0 0 24 24\"><path class=\"ql-stroke\" fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm0 5h18M10 3v18\"/></svg>";

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
  const tableCantInsert = [blotName.tableCell, 'code-block'];
  function isForbidInTableBlot(blot) {
    return tableCantInsert.includes(blot.statics.blotName);
  }
  function isForbidInTable(current) {
    return current && current.parent
      ? isForbidInTableBlot(current.parent)
        ? true
        : isForbidInTable(current.parent)
      : false;
  }function createCell({ tableId, rowId, colId }) {
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
  }
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
        // insert cell in nextTr to patch exceed cell
        for (const [colId, { colIndex, colspan, rowspan }] of Object.entries(patchTds)) {
          nextTr.insertCell(colIndex, {
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
      const newColId = randomId();

      const [colgroup] = tableBlot.descendants(TableColgroupFormat);
      if (colgroup) {
        colgroup.insertColByIndex(columnIndex, {
          tableId: tableBlot.tableId,
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

  const rewirteFormats = () =>
    Quill.register(
      {
        [`formats/list/item`]: ListItemRewrite,
      },
      true,
    );

  // TODO: redo and undo
  // TODO: maybe col need change to EmbedBlock

  Quill.register(
    {
      [`modules/${TableModule.moduleName}`]: TableModule,
    },
    true,
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
      keyboard: {
        bindings: {
          ...TableModule.keyboradHandler,
        },
      },
      [`${TableModule.moduleName}`]: {
        fullWidth: true,
        tableToolTip: {
          tipHeight: 12,
          disableToolNames: ['code-block'],
        },
        operationMenu: {
          items: {
            insertColumnLeft: {
              text: 'insert column left',
            },
            insertColumnRight: {
              text: 'insert column right',
            },
            insertRowTop: {
              text: 'insert row up',
            },
            insertRowBottom: {
              text: 'insert row down',
            },
            removeCol: {
              text: 'remove column',
            },
            removeRow: {
              text: 'remove row',
            },
            removeTable: {
              text: 'remove table',
            },
            mergeCell: {
              text: 'merge cell',
            },
            splitCell: {
              text: 'split cell',
            },
            setBackgroundColor: {
              text: 'set background color',
            },
            clearBackgroundColor: {
              text: 'clear background color',
            },
            setBorderColor: {
              text: 'set border color',
            },
            clearBorderColor: {
              text: 'clear border color',
            },
            otherBtn: {
              text: 'other color',
              isColorChoose: true,
              handler(color) {
                console.log('get color', color);
              },
            },
          },
          modifyItems: true,
        },
        selection: {
          primaryColor: '#0589f3',
        },
        customButton: 'Custom Table',
        // dragResize: false,
      },
    },
  });

  quill.setContents([
    { insert: '\n' },
    { attributes: { col: { tableId: '3f9v65d1jea', colId: 'dm2iv5nk59i', width: '20%', full: true } }, insert: '\n' },
    { attributes: { col: { tableId: '3f9v65d1jea', colId: '110vmas75gg', width: '20%', full: true } }, insert: '\n' },
    { attributes: { col: { tableId: '3f9v65d1jea', colId: 'xngnqidm9qq', width: '20%', full: true } }, insert: '\n' },
    { attributes: { col: { tableId: '3f9v65d1jea', colId: 'uf00txcv6fi', width: '20%', full: true } }, insert: '\n' },
    { attributes: { col: { tableId: '3f9v65d1jea', colId: 'n53lvqhi2p', width: '20%', full: true } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'dm2iv5nk59i', rowspan: '3', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'nmyr8vn3828', colId: 'n53lvqhi2p', rowspan: '4', colspan: '1' } }, insert: '\n\n\n\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'oepb5fr3urk', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'gt997kxksnc', colId: 'uf00txcv6fi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: 'dm2iv5nk59i', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: '110vmas75gg', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'umw8jbf0ha', colId: 'xngnqidm9qq', rowspan: '2', colspan: '2' } }, insert: '\n\n\n\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: 'dm2iv5nk59i', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: '110vmas75gg', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { attributes: { tableCellInner: { tableId: '3f9v65d1jea', rowId: 'cvuztwvj1hl', colId: 'n53lvqhi2p', rowspan: '1', colspan: '1' } }, insert: '\n' },
    { insert: '\n' },

    // { insert: '\n' },
    // { attributes: { col: { tableId: 'fwgtd4onbc', colId: 'lvgnvscz4zo', width: '25%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'fwgtd4onbc', colId: 'ordetcm8owk', width: '25%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'fwgtd4onbc', colId: '1tvfio9reyi', width: '25%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'fwgtd4onbc', colId: 'anlt4bylddp', width: '25%', full: true } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'fhaunl5mrrw', colId: 'lvgnvscz4zo', rowspan: '2', colspan: '2' } }, insert: '\n\n\n\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'fhaunl5mrrw', colId: '1tvfio9reyi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'fhaunl5mrrw', colId: 'anlt4bylddp', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'rg6ou87kqs', colId: '1tvfio9reyi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'rg6ou87kqs', colId: 'anlt4bylddp', rowspan: '2', colspan: '1' } }, insert: '\n\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'dob7l26fysl', colId: 'lvgnvscz4zo', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'dob7l26fysl', colId: 'ordetcm8owk', rowspan: '2', colspan: '1' } }, insert: '\n\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: 'dob7l26fysl', colId: '1tvfio9reyi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: '1jqp0eb81w7', colId: 'lvgnvscz4zo', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: '1jqp0eb81w7', colId: '1tvfio9reyi', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'fwgtd4onbc', rowId: '1jqp0eb81w7', colId: 'anlt4bylddp', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { insert: '\n' },

    // { insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: '4mje7sphg32', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: '3aca3uqy7yc', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: 'qubz0ty6iw', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: 'bve2xew43i9', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: 'qgyxngips6f', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: '2q8xeoz6g3i', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { col: { tableId: 'nqpbqv26gi', colId: 'ppp6xwdr14', width: '14.285714285714285%', full: true } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '3h2erf0dceh', colId: '4mje7sphg32', rowspan: '3', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '3h2erf0dceh', colId: 'bve2xew43i9', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '3h2erf0dceh', colId: 'qgyxngips6f', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '3h2erf0dceh', colId: '2q8xeoz6g3i', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '3h2erf0dceh', colId: 'ppp6xwdr14', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '6n8dzt17a1q', colId: 'bve2xew43i9', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '6n8dzt17a1q', colId: 'qgyxngips6f', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: '6n8dzt17a1q', colId: '2q8xeoz6g3i', rowspan: '4', colspan: '2' } }, insert: '\n\n\n\n\n\n\n\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'gu36zjl3wyr', colId: 'bve2xew43i9', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'gu36zjl3wyr', colId: 'qgyxngips6f', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'sv9kfvu8gxd', colId: '4mje7sphg32', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'sv9kfvu8gxd', colId: '3aca3uqy7yc', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'sv9kfvu8gxd', colId: 'qubz0ty6iw', rowspan: '4', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n\n\n\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'yka62c3nfmc', colId: '4mje7sphg32', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'yka62c3nfmc', colId: '3aca3uqy7yc', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'leu19xpaefj', colId: '4mje7sphg32', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'leu19xpaefj', colId: '3aca3uqy7yc', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'leu19xpaefj', colId: '2q8xeoz6g3i', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'leu19xpaefj', colId: 'ppp6xwdr14', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'le0nqzcr19', colId: '4mje7sphg32', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'le0nqzcr19', colId: '3aca3uqy7yc', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'le0nqzcr19', colId: '2q8xeoz6g3i', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { attributes: { tableCellInner: { tableId: 'nqpbqv26gi', rowId: 'le0nqzcr19', colId: 'ppp6xwdr14', rowspan: '1', colspan: '1' } }, insert: '\n' },
    // { insert: '\n' },
  ]);

  const contentDisplay = document.getElementsByClassName('contentDisplay')[0];
  document.getElementsByClassName('getContent')[0].addEventListener('click', () => {
    const content = quill.getContents();
    console.log(content);
    contentDisplay.innerHTML = '';

    // eslint-disable-next-line unicorn/no-array-for-each
    content.forEach((content) => {
      const item = document.createElement('li');
      item.textContent = `${JSON.stringify(content)},`;
      contentDisplay.appendChild(item);
    });
  });

})(Quill);
//# sourceMappingURL=demo.js.map
