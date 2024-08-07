# QuillJS table

A table module used in QuillJS@1.3.7

[Demo](https://zzxming.github.io/quill-table/demo/index.html)

# Install

```
npm install quill1.3.7-table-module
```

# Usage

```javascript
import Quill from 'quill';
import TableHandler, { rewirteFormats } from 'quill1.3.7-table-module';
import 'quill1.3.7-table-module/dist/index.css';
Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
rewirteFormats();

new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [TableHandler.toolName],
        [`${TableHandler.moduleName}`]: {
            fullWidth: true,
            customButton: 'Custom Table',
        },
    },
});
```

# rewirteFormats

To handle exceptions, it is necessary to rewrite some native formats. you can skip this function. but the relevant format may be displayed incorrectly in the table

## rewrite formats

| format   | description                                                                |
| -------- | -------------------------------------------------------------------------- |
| ListItem | Rewrite method `replaceWith`. Make ul/ol to display correctly within cells |

# Options

| attribute     | description                                                                             | type               | default      |
| ------------- | --------------------------------------------------------------------------------------- | ------------------ | ------------ |
| fullWidth     | Always 100% width                                                                       | boolean            | false        |
| customSelect  | Custom picker element. The returned element needs to trigger an event to create a table | () => HTMLElement  |              |
| tableToolTip  | Table tool tip configuration                                                            | ToolTip            |              |
| operationMenu | OTable contextmenu configuration                                                        | perationMenu       |              |
| selection     | Table cell selection configuration                                                      | TableCellSelection |              |
| customButton  | Define a label for the custom table button                                              | string             | 自定义行列数 |

## fullWidth

If the value is true. the width of the table is always 100%

## customSelect

The element returned by the customSelect method will be inserted into the toolbar, and the element needs to trigger a custom event `TableModule.createEventName` and carry data `{ row: number, col: number }` in the detail

### ToolTip

| attribute        | description                          | type     | default |
| ---------------- | ------------------------------------ | -------- | ------- |
| tipHeight        | Slider height                        | number   | 12px    |
| disableToolNames | Disabled tools name within the table | string[] |         |

### OperationMenu

| attribute    | description              | type                               | default                                                                                                              |
| ------------ | ------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| items        | Contextmenu item         | Record<string, OpertationMenuItem> | { insertColumnLeft, insertColumnRight, insertRowTop, insertRowBottom, removeRow, removeCol, removeTable, mergeCell, setBorderColor, setBackgroundColor, clearBackgroundColor, clearBorderColor } |
| replaceItems | Replace contextmenu item | Boolean                            |                                                                                                                      |
| modifyItems | Modify contextmenu items | Boolean                            |                                                                                                                      |

#### OpertationMenuItem

| attribute | type                       | description                                                 |
| --------- | -------------------------- | ----------------------------------------------------------- |
| text      | string / () => HTMLElement | Item text                                                   |
| iconSrc   | HTMLString                 | Pre icon                                                    |
| handler   | () => void                 | Click event                                                 |
| subTitle  | string                     | Subtitle                                                    |
| groupEnd  | boolean                    | Group underline. Do not display underline for the last item |

### TableCellSelection

| attribute    | description  | type   | default |
| ------------ | ------------ | ------ | ------- |
| primaryColor | Border color | string | #0589f3 |
