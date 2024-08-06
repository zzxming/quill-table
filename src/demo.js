import Quill from 'quill';
import TableModule, { rewirteFormats } from './index';

Quill.register(
    {
        [`modules/${TableModule.moduleName}`]: TableModule,
    },
    true
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
        [`${TableModule.moduleName}`]: {
            fullWidth: true,
            tableToolTip: {
                tipHeight: 12,
                disableToolNames: ['bold', 'color', 'code-block'],
            },
            operationMenu: {},
            selection: {
                primaryColor: '#0589f3',
            },
            customButton: 'Custom Table',
        },
    },
});

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
