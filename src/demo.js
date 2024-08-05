import Quill from 'quill';
import TableModule, { rewirteFormats } from './index';
const Toolbar = Quill.import('modules/toolbar');
const Icons = Quill.import('ui/icons');

class ToolbarRewrite extends Toolbar {
    bindFormatSelect = () => {
        const range = this.quill.getSelection();
        if (range.length === 0) return;
        this.rangeFormat = this.quill.getFormat(range);
        this.quill.isFormat = true;
        this.quill.on(Quill.events.SELECTION_CHANGE, this.formatRange);
        setTimeout(() => {
            this.formaterBtn.classList.add('ql-active');
        }, 0);
    };

    unbindFormatSelect = () => {
        this.quill.off(Quill.events.SELECTION_CHANGE, this.formatRange);
        this.rangeFormat = undefined;
        this.formaterBtn.classList.remove('ql-active');
        this.quill.isFormat = false;
    };

    formatRange = (range) => {
        console.log(range);
        console.log(this.rangeFormat);
        this.quill.removeFormat(range.index, range.length);
        for (const format in this.rangeFormat) {
            this.quill.format(format, this.rangeFormat[format]);
        }
        this.unbindFormatSelect();
    };

    constructor(quill, options) {
        super(quill, options);
        this.formaterBtn = this.controls.find(([name]) => name === 'formater')?.[1];
    }
}

ToolbarRewrite.moduleName = 'toolbar';
ToolbarRewrite.DEFAULTS = {
    ...Toolbar.DEFAULTS,
};
ToolbarRewrite.DEFAULTS.handlers.formater = function () {
    if (this.quill.isFormat) {
        this.unbindFormatSelect();
        return;
    }
    this.bindFormatSelect();
};

Icons[
    'formater'
] = `<svg viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="4"><path stroke-linejoin="round" d="M8 24h32v18H8zM4 13h14V6h12v7h14v11H4z"/><path d="M16 32v10"/></g></svg>`;

Quill.register(
    {
        [`modules/${TableModule.moduleName}`]: TableModule,
        [`modules/${ToolbarRewrite.moduleName}`]: ToolbarRewrite,
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
            ['formater'],

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
