/* eslint-disable unused-imports/no-unused-vars */
import { CREATE_TABLE } from '../assets/const';

export const randomId = () => Math.random().toString(36).slice(2);

let zindex = 8000;
export const dialog = ({ child, target = document.body, beforeClose = () => {} } = {}) => {
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
export const createInputItem = (label, options) => {
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
export const showTableCreator = async (row = 3, col = 3) => {
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
export const showTableSelector = (customButton) => {
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

export function css(domNode, rules) {
  if (typeof rules === 'object') {
    for (const prop in rules) {
      domNode.style[prop] = rules[prop];
    }
  }
}
export function isRectanglesIntersect(a, b, tolerance = 4) {
  const { x: minAx, y: minAy, x1: maxAx, y1: maxAy } = a;
  const { x: minBx, y: minBy, x1: maxBx, y1: maxBy } = b;
  const notOverlapX = maxAx <= minBx + tolerance || minAx + tolerance >= maxBx;
  const notOverlapY = maxAy <= minBy + tolerance || minAy + tolerance >= maxBy;
  return !(notOverlapX || notOverlapY);
}

export function getRelativeRect(targetRect, container) {
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

// Deprecated
export function computeBoundaryFromRects(startRect, endRect) {
  const x = Math.min(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
  const x1 = Math.max(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
  const y = Math.min(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);
  const y1 = Math.max(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);

  const width = x1 - x;
  const height = y1 - y;

  return { x, x1, y, y1, width, height };
}

export function findParentBlot(blot, targetBlotName) {
  let target = blot.parent;
  while (target && target.statics.blotName !== targetBlotName && target !== blot.scroll) {
    target = target.parent;
  }
  if (target === blot.scroll) {
    throw new Error(`${blot.statics.blotName} must be a child of ${targetBlotName}`);
  }
  return target;
}

export function isString(val) {
  return typeof val === 'string';
}
export function isFunction(val) {
  return typeof val === 'function';
}
export function isUndefined(val) {
  return val === undefined;
}
export function isArray(val) {
  return Array.isArray(val);
}

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
