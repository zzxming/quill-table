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
      dragResize: false,
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
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'mtq4g51oyth', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'zmyru3l4n8g', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'yiqkh846e0r', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'jv7nr19589', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: '33fgkd64ved', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'lt4nugvc4or', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { col: { tableId: '6hfxi1pn4cg', colId: 'hfx2muwqtpo', width: '14.285714285714285%', full: true } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'mtq4g51oyth', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'zmyru3l4n8g', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'yiqkh846e0r', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: '33fgkd64ved', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'lt4nugvc4or', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '17qo4hdl99y', colId: 'hfx2muwqtpo', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '3uk5mh84xzu', colId: 'mtq4g51oyth', rowspan: '3', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '3uk5mh84xzu', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '3uk5mh84xzu', colId: '33fgkd64ved', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '3uk5mh84xzu', colId: 'lt4nugvc4or', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '3uk5mh84xzu', colId: 'hfx2muwqtpo', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '2lv57fl37k5', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '2lv57fl37k5', colId: '33fgkd64ved', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '2lv57fl37k5', colId: 'lt4nugvc4or', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '2lv57fl37k5', colId: 'hfx2muwqtpo', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '940iq3t20kg', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: '940iq3t20kg', colId: '33fgkd64ved', rowspan: '3', colspan: '3' } }, insert: '\n\n\n\n\n\n\n\n\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'moe7jc6dudq', colId: 'mtq4g51oyth', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'moe7jc6dudq', colId: 'zmyru3l4n8g', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'moe7jc6dudq', colId: 'yiqkh846e0r', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'moe7jc6dudq', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'k7otyybv5fh', colId: 'mtq4g51oyth', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'k7otyybv5fh', colId: 'zmyru3l4n8g', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'k7otyybv5fh', colId: 'yiqkh846e0r', rowspan: '1', colspan: '1' } }, insert: '\n' },
  { attributes: { tableCellInner: { tableId: '6hfxi1pn4cg', rowId: 'k7otyybv5fh', colId: 'jv7nr19589', rowspan: '1', colspan: '1' } }, insert: '\n' },
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
