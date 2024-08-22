import Quill from 'quill';
import TableModule, { rewirteFormats } from './index';

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
      // [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      // [{ script: 'sub' }, { script: 'super' }],
      // [{ indent: '-1' }, { indent: '+1' }],
      // [{ direction: 'rtl' }],
      // [{ size: ['small', false, 'large', 'huge'] }],
      // [{ header: [1, 2, 3, 4, 5, 6, false] }],
      // [{ color: [] }, { background: [] }],
      // [{ font: [] }],
      // [{ align: ['', 'center', 'right', 'justify'] }],
      // ['clean'],
      // ['image', 'video'],

      [{ table: [] }],
    ],
    [`${TableModule.moduleName}`]: {
      fullWidth: true,
      tableToolTip: {
        tipHeight: 12,
        disableToolNames: ['bold', 'color', 'code-block'],
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
    },
  },
});

quill.setContents([
  { insert: '\n' },
  { attributes: { col: { tableId: 'dd2cbej7f9p', colId: 'nfswnl3gfw', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'dd2cbej7f9p', colId: 'ssp1eq3w3gs', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'dd2cbej7f9p', colId: 'b5qyodbo2y', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'dd2cbej7f9p', colId: '248kjrqxnhg', width: '25%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'avjhqjq6to', colId: 'nfswnl3gfw', rowspan: '1', colspan: '2' } }, insert: '\n\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'avjhqjq6to', colId: 'b5qyodbo2y', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'avjhqjq6to', colId: '248kjrqxnhg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'ypmmcwdypcm', colId: 'nfswnl3gfw', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'ypmmcwdypcm', colId: 'ssp1eq3w3gs', rowspan: '1', colspan: '2' } }, insert: '\n\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'ypmmcwdypcm', colId: '248kjrqxnhg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'ejrikno5q86', colId: 'nfswnl3gfw', rowspan: '1', colspan: '3' } }, insert: '\n\n\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: 'ejrikno5q86', colId: '248kjrqxnhg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: '8m2wl74ldqn', colId: 'nfswnl3gfw', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: '8m2wl74ldqn', colId: 'ssp1eq3w3gs', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: '8m2wl74ldqn', colId: 'b5qyodbo2y', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'dd2cbej7f9p', rowId: '8m2wl74ldqn', colId: '248kjrqxnhg', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { insert: '\n' },
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
