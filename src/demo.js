import Quill from 'quill';
import TableModule from './index';
const Delta = Quill.import('delta');

Quill.register(
    {
        [`modules/${TableModule.moduleName}`]: TableModule,
    },
    true
);
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ size: ['small', false, 'large', 'huge'] }],
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            [{ color: [] }, { background: [] }],
            [{ font: [] }],
            [{ align: [] }],
            ['clean'],
            ['image', 'video'],

            [{ table: [] }],
        ],
        [`${TableModule.moduleName}`]: {
            fullWidth: true,
            tableToolTip: {
                tipHeight: 12,
                disableToolNames: ['header'],
            },
            operationMenu: {},
            selection: {
                primaryColor: '#0589f3',
            },
        },
    },
});

quill
    .setContents
    // new Delta([
    //     { insert: '\n' },
    //     { attributes: { col: { tableId: 'w9tilwkgm1e', colId: '7arx3sf4z5v', width: '33.333333%' } }, insert: '\n' },
    //     { attributes: { col: { tableId: 'w9tilwkgm1e', colId: 'klrrpz1qhhr', width: '33.333333%' } }, insert: '\n' },
    //     { attributes: { col: { tableId: 'w9tilwkgm1e', colId: 'k9yw1zl8lyg', width: '33.333333%' } }, insert: '\n' },
    //     { insert: '1' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: '44kczjr1q8v',
    //                 colId: '7arx3sf4z5v',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '2' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: '44kczjr1q8v',
    //                 colId: 'klrrpz1qhhr',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '3' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: '44kczjr1q8v',
    //                 colId: 'k9yw1zl8lyg',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '4' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'c74r2a835vl',
    //                 colId: '7arx3sf4z5v',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '5' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'c74r2a835vl',
    //                 colId: 'klrrpz1qhhr',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '6' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'c74r2a835vl',
    //                 colId: 'k9yw1zl8lyg',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '7' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'bljhr2ww5ac',
    //                 colId: '7arx3sf4z5v',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '8' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'bljhr2ww5ac',
    //                 colId: 'klrrpz1qhhr',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '9' },
    //     {
    //         attributes: {
    //             tableCellInner: {
    //                 tableId: 'w9tilwkgm1e',
    //                 rowId: 'bljhr2ww5ac',
    //                 colId: 'k9yw1zl8lyg',
    //                 rowspan: '1',
    //                 colspan: '1',
    //             },
    //         },
    //         insert: '\n',
    //     },
    //     { insert: '\n' },
    // ])
    ();

const contentDisplay = document.getElementsByClassName('contentDisplay')[0];
document.getElementsByClassName('getContent')[0].onclick = () => {
    const content = quill.getContents();
    console.log(content);
    contentDisplay.innerHTML = '';

    content.map((content) => {
        const item = document.createElement('li');
        item.innerText = JSON.stringify(content) + ',';
        contentDisplay.appendChild(item);
    });
};
