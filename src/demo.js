import Quill from 'quill';
import TableModule from './index';

Quill.register(
    {
        [`modules/${TableModule.moduleName}`]: TableModule,
    },
    true
);
new Quill('#editor', {
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
            size() {
                return {
                    row: 2,
                    col: 3,
                };
            },
            tableToolTip: {
                tipHeight: 12,
                disableToolNames: [],
            },
            operationMenu: {
                items: {
                    OtherMenuItem: {
                        text: '其他选项',
                        handler() {
                            console.log('other');
                        },
                        groupEnd: true,
                        subTitle: '子标题',
                        iconSrc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16.587 17">
							<path d="M48.569,6.476a.81.81,0,0,1,.061,1.617l-.061,0a.4.4,0,0,0-.4.357l0,.047v6.476a.4.4,0,0,0,.4.4.81.81,0,0,1,0,1.619,2.024,2.024,0,0,1-2.022-1.936l0-.088V8.5a2.024,2.024,0,0,1,2.024-2.024ZM55.211,0a2.227,2.227,0,0,1,2.227,2.227V4.765h3.436c1.951,0,2.718,2.389,1.981,6.734l-.064.358c-.712,3.88-1.786,5.129-3.624,5.142H51.807a2.024,2.024,0,0,1-2.024-2.024V8.136a2.376,2.376,0,0,1,.528-1.441c.091-.124.332-.416.306-.383l.144-.187a11.59,11.59,0,0,0,2-4.271A2.429,2.429,0,0,1,55.122,0Zm0,1.619h-.089a.81.81,0,0,0-.786.617,13.177,13.177,0,0,1-2.445,5.074l-.085.1-.19.238a.885.885,0,0,0-.214.482v6.841a.4.4,0,0,0,.4.4h7.355a.9.9,0,0,0,.848-.365,8.415,8.415,0,0,0,1.22-3.621,10.262,10.262,0,0,0,.107-4.378c-.153-.493-.313-.633-.462-.633H55.82V2.227a.608.608,0,0,0-.608-.608Z" transform="translate(-46.546)" />
						</svg>`,
                    },
                },
            },
            selection: {
                primaryColor: '#0589f3',
            },
        },
    },
});
