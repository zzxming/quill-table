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

quill.setContents([{ insert: '\n' }, { attributes: { col: { tableId: 'penblprc3x', colId: 'cqiz2048lwi', width: '33.33333333333333%', full: true } }, insert: '\n' }, { attributes: { col: { tableId: 'penblprc3x', colId: 'jcm0jd0ausn', width: '33.33333333333333%', full: true } }, insert: '\n' }, { attributes: { col: { tableId: 'penblprc3x', colId: 'wtiopegit6i', width: '33.33333333333333%', full: true } }, insert: '\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: 'x7awbg3zcek', colId: 'cqiz2048lwi', rowspan: '1', colspan: '1' } }, insert: '\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: 'x7awbg3zcek', colId: 'jcm0jd0ausn', rowspan: '1', colspan: '2' } }, insert: '\n\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: 'zt721udfid', colId: 'cqiz2048lwi', rowspan: '1', colspan: '2' } }, insert: '\n\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: 'zt721udfid', colId: 'wtiopegit6i', rowspan: '1', colspan: '1' } }, insert: '\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: '6euooxwb0o8', colId: 'cqiz2048lwi', rowspan: '1', colspan: '1' } }, insert: '\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: '6euooxwb0o8', colId: 'jcm0jd0ausn', rowspan: '1', colspan: '1' } }, insert: '\n' }, { attributes: { tableCellInner: { tableId: 'penblprc3x', rowId: '6euooxwb0o8', colId: 'wtiopegit6i', rowspan: '1', colspan: '1' } }, insert: '\n' }, { insert: '\n' }]);

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
