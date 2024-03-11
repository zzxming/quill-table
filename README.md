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
import TableHandler from 'quill1.3.7-table-module';
import 'quill1.3.7-table-module/dist/index.css';

Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
new Quill('#editor', {
    theme: 'snow',
    modules: {
        fullWidth: true,
        toolbar: [TableHandler.toolName],
        [`${TableHandler.moduleName}`]: {
            tableToolTip: {},
            operationMenu: {},
            selection: {},
        },
    },
});
```

# Options

| attribute     | description                        | type               |
| ------------- | ---------------------------------- | ------------------ |
| fullWidth     | Always 100% width                  | boolean            |
| customSelect  | Custom picker element              | () => HTMLElement  |
| tableToolTip  | Table tool tip configuration       | ToolTip            |
| operationMenu | OTable contextmenu configuration   | perationMenu       |
| selection     | Table cell selection configuration | TableCellSelection |

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
| items        | Contextmenu item         | Record<string, OpertationMenuItem> | { insertColumnLeft, insertColumnRight, insertRowTop, insertRowBottom, removeRow, removeCol, removeTable, mergeCell } |
| replaceItems | Replace contextmenu item | Boolean                            |                                                                                                                      |

#### OpertationMenuItem

| attribute | type                      | description                                                 | default |
| --------- | ------------------------- | ----------------------------------------------------------- | ------- |
| text      | string / () =>HTMLElement | Item text                                                   |         |
| iconSrc   | HTMLString                | Pre icon                                                    |         |
| handler   | () => void                | Click event                                                 |         |
| subTitle  | string                    | Subtitle                                                    |         |
| groupEnd  | boolean                   | Group underline. Do not display underline for the last item |         |

### TableCellSelection

| attribute    | description  | type   | default |
| ------------ | ------------ | ------ | ------- |
| primaryColor | Border color | string | #0589f3 |
