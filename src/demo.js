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
  { attributes: { col: { tableId: 'fdyrtko82h', colId: 'zqxpzf48m7', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'fdyrtko82h', colId: 'n35i5ver1f', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'fdyrtko82h', colId: '3ndvaw7qqwe', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: 'fdyrtko82h', colId: 'z6rtj7yki9g', width: '25%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'dlmdzw35b5k', colId: 'zqxpzf48m7', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'dlmdzw35b5k', colId: 'n35i5ver1f', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'dlmdzw35b5k', colId: '3ndvaw7qqwe', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'dlmdzw35b5k', colId: 'z6rtj7yki9g', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'cm98yaqsj1i', colId: 'zqxpzf48m7', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'cm98yaqsj1i', colId: 'n35i5ver1f', rowspan: '2', colspan: '3' } }, insert: '\n\n\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'x17tof30f9o', colId: 'zqxpzf48m7', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'snr7fvelmh', colId: 'zqxpzf48m7', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'snr7fvelmh', colId: 'n35i5ver1f', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'snr7fvelmh', colId: '3ndvaw7qqwe', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: 'fdyrtko82h', rowId: 'snr7fvelmh', colId: 'z6rtj7yki9g', rowspan: '1', colspan: '1' } }, insert: '\n' },
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
