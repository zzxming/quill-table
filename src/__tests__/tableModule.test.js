/* eslint-disable unused-imports/no-unused-imports */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ContainerFormat,
  ListItemRewrite,
  TableBodyFormat,
  TableCellFormat,
  TableCellInnerFormat,
  TableColFormat,
  TableColgroupFormat,
  TableFormat,
  TableRowFormat,
  TableWrapperFormat,
} from '../format';
import { TableSelection } from '../index';
import { createQuillWithTableModule } from './utils';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Table', () => {
  it('render insert', async () => {
    const quill = createQuillWithTableModule('<p><br></p>', {
      fullWidth: true,
    });
    const table = quill.getModule('table');
    quill.setSelection(0);
    table.insertTable(4, 4);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(4).fill(0).map(() => `<col width="${100 / 4}%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              ${
                new Array(4).fill(0).map(() => `
                  <tr>
                    ${new Array(4).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
                  </tr>
                `).join('\n')
              }
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});
