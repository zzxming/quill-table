# QuillJS table

A table module used in QuillJS@1.3.7

# Usage

```javascript
import Quill from 'quill';
import TableHandler from './index';

Quill.register({ [`modules/${TableHandler.moduleName}`]: TableHandler }, true);
new Quill('#editor', {
	theme: 'snow',
	modules: {
		toolbar: [TableHandler.toolName],
		[`${TableHandler.moduleName}`]: TableHandler,
	},
});
```
