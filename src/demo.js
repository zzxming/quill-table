import Quill from 'quill';
import Delta from 'quill-delta';
import TableModule from './index';

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
            ['bold', 'italic', 'underline', 'strike'], // toggled buttons
            ['blockquote', 'code-block'],

            [{ header: 1 }, { header: 2 }], // custom button values
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
            [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
            [{ direction: 'rtl' }], // text direction

            [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
            [{ header: [1, 2, 3, 4, 5, 6, false] }],

            [{ color: [] }, { background: [] }], // dropdown with defaults from theme
            [{ font: [] }],
            [{ align: [] }],

            ['clean'],
            ['image', 'video'],
            ['table'],
        ],
        [`${TableModule.moduleName}`]: {
            tableToolTip: {
                tipHeight: 12,
                disableToolNames: [],
            },
            operationMenu: {},
            selection: {
                primaryColor: '#0589f3',
            },
        },
    },
});

quill.setContents(new Delta());

const contentDisplay = document.getElementsByClassName('contentDisplay')[0];
document.getElementsByClassName('getContent')[0].onclick = () => {
    const content = quill.getContents();
    console.log(content);
    contentDisplay.innerHTML = '';

    content.map((content) => {
        const item = document.createElement('li');
        item.innerText = JSON.stringify(content);
        contentDisplay.appendChild(item);
    });
};
