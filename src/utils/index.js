import { CREATE_TABLE } from '../assets/const/event';

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
export const createInputItem = (label, options) => {
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
export const showTableSelector = () => {
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

export function css(domNode, rules) {
    if (typeof rules === 'object') {
        for (let prop in rules) {
            domNode.style[prop] = rules[prop];
        }
    }
}

export function getRelativeRect(targetRect, container) {
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

export function computeBoundaryFromRects(startRect, endRect) {
    let x = Math.min(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
    let x1 = Math.max(startRect.x, endRect.x, startRect.x + startRect.width - 1, endRect.x + endRect.width - 1);
    let y = Math.min(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);
    let y1 = Math.max(startRect.y, endRect.y, startRect.y + startRect.height - 1, endRect.y + endRect.height - 1);

    let width = x1 - x;
    let height = y1 - y;

    return { x, x1, y, y1, width, height };
}

export function isString(val) {
    return typeof val === 'string';
}
export function isFunction(val) {
    return typeof val === 'function';
}
