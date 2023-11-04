# QuillJS table

A table module used in QuillJS@1.3.7

# Install

```
npm install quill1.3.7-table
```

# Usage

```javascript
import Quill from 'quill';
import TableHandler from 'quill1.3.7-table';
import 'quill1.3.7-table/dist/table.css';

Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
new Quill('#editor', {
	theme: 'snow',
	modules: {
		toolbar: [TableHandler.toolName],
		// Popup input number of rows and columns
		// [`${TableHandler.moduleName}`]: {},
		// Function returns the number of rows and columns
		[`${TableHandler.moduleName}`]: {
			size() {
				return {
					row: 2,
					col: 3,
				};
			},
		},
	},
});
```
