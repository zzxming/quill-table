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
    },
  },
});

quill.setContents([
  { insert: '\n' },
  { attributes: { col: { tableId: 'aerxifo3j8a', colId: '9ksom7tj5le', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'aerxifo3j8a', colId: 'pa2g7xz05ms', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'aerxifo3j8a', colId: 'h0qfyo4yzsq', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'aerxifo3j8a', colId: '55oxf1y4t3l', width: '25%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nmmwe2j66gj', colId: '9ksom7tj5le', rowspan: '4', colspan: '1' } }, insert: '\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nmmwe2j66gj', colId: 'pa2g7xz05ms', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nmmwe2j66gj', colId: 'h0qfyo4yzsq', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nmmwe2j66gj', colId: '55oxf1y4t3l', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '2vh1631lfcp', colId: 'pa2g7xz05ms', rowspan: '2', colspan: '1' } }, insert: '\n\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '2vh1631lfcp', colId: 'h0qfyo4yzsq', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '2vh1631lfcp', colId: '55oxf1y4t3l', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nvwdr8d91tk', colId: 'h0qfyo4yzsq', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: 'nvwdr8d91tk', colId: '55oxf1y4t3l', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '78rf9v2btqq', colId: 'pa2g7xz05ms', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '78rf9v2btqq', colId: 'h0qfyo4yzsq', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'aerxifo3j8a', rowId: '78rf9v2btqq', colId: '55oxf1y4t3l', rowspan: '1', colspan: '1' } }, insert: '\n' },
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
