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
  { attributes: { col: { tableId: 'sifc7rgnv5r', colId: 'j8bi7tlppto', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'sifc7rgnv5r', colId: 'c9mjr5o2wy', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'sifc7rgnv5r', colId: 'a9b1jl8u95s', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'sifc7rgnv5r', colId: 'xygq3illj6p', width: '25%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'avzbczy8175', colId: 'j8bi7tlppto', rowspan: '2', colspan: '2' } }, insert: '\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'avzbczy8175', colId: 'a9b1jl8u95s', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'avzbczy8175', colId: 'xygq3illj6p', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: '0keeyoyjgfw', colId: 'a9b1jl8u95s', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: '0keeyoyjgfw', colId: 'xygq3illj6p', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: '1kqezbod363', colId: 'j8bi7tlppto', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: '1kqezbod363', colId: 'c9mjr5o2wy', rowspan: '1', colspan: '2' } }, insert: '\n\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: '1kqezbod363', colId: 'xygq3illj6p', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'psrzyqce1mm', colId: 'j8bi7tlppto', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'psrzyqce1mm', colId: 'c9mjr5o2wy', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'psrzyqce1mm', colId: 'a9b1jl8u95s', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'sifc7rgnv5r', rowId: 'psrzyqce1mm', colId: 'xygq3illj6p', rowspan: '1', colspan: '1' } }, insert: '\n' },
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
