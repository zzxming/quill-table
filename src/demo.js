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
      // dragResize: false,
    },
  },
});

quill.setContents([
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

  { insert: '\n' },
  { attributes: { col: { tableId: '56s4ez1lhrk', colId: 'gxw4smwrhz6', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '56s4ez1lhrk', colId: 'yubyts1icli', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '56s4ez1lhrk', colId: 'xenkfit16a', width: '25%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '56s4ez1lhrk', colId: '4df43xj4g8b', width: '25%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6ppzaya9uxx', colId: 'gxw4smwrhz6', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6ppzaya9uxx', colId: 'yubyts1icli', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6ppzaya9uxx', colId: 'xenkfit16a', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6ppzaya9uxx', colId: '4df43xj4g8b', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6x00de3fio', colId: 'gxw4smwrhz6', rowspan: '2', colspan: '3' } }, insert: '\n\n\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: '6x00de3fio', colId: '4df43xj4g8b', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: 'x45al56mzqi', colId: '4df43xj4g8b', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: 'bc4i2r1rd8p', colId: 'gxw4smwrhz6', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '56s4ez1lhrk', rowId: 'bc4i2r1rd8p', colId: 'yubyts1icli', rowspan: '1', colspan: '3' } }, insert: '\n\n\n' },
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
