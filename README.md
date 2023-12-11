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
import 'quill1.3.7-table-module/dist/table.css';

Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
new Quill('#editor', {
    theme: 'snow',
    modules: {
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

| attribute     | description                                     | type                               |
| ------------- | ----------------------------------------------- | ---------------------------------- |
| size          | Function returns the number of rows and columns | () => { row: number, col: number } |
| tableToolTip  | Table tool tip configuration                    | ToolTip                            |
| operationMenu | OTable contextmenu configuration                | perationMenu                       |
| selection     | Table cell selection configuration              | TableCellSelection                 |

## ToolTip

| attribute        | description                          | type     | default |
| ---------------- | ------------------------------------ | -------- | ------- |
| tipHeight        | Slider height                        | number   | 12px    |
| disableToolNames | Disabled tools name within the table | string[] |         |

## OperationMenu

| attribute | description      | type                               | default |
| --------- | ---------------- | ---------------------------------- | ------- |
| items     | Contextmenu item | Record<string, OpertationMenuItem> |         |

#### OpertationMenuItem

| attribute | type       | description                                                 | default |
| --------- | ---------- | ----------------------------------------------------------- | ------- |
| text      | string     | Item text                                                   |         |
| iconSrc   | HTMLString | Pre icon                                                    |         |
| handler   | () => void | Click event                                                 |         |
| subTitle  | string     | Subtitle                                                    |         |
| groupEnd  | boolean    | Group underline. Do not display underline for the last item |         |

## TableCellSelection

| attribute    | description  | type   | default |
| ------------ | ------------ | ------ | ------- |
| primaryColor | Border color | string | #0589f3 |
