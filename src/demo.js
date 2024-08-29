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
