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
      dragResize: false,
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

  it('merge cells', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(3, 3);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    table.tableSelection.selectedTds = [tds[3], tds[4], tds[6], tds[7]];
    table.mergeCellsv2();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(3).fill(0).map(() => `<col width="33.33333333333333%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="2" colspan="2">
                  <p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
              <tr>
                <td rowspan="1" colspan="1"><p><p><br></p></p></td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('merge cells and clear rowspan or colspan', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(2, 4);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat, 0);
    table.tableSelection.selectedTds = [tds[0], tds[1], tds[4], tds[5]];
    table.mergeCellsv2();
    await vi.runAllTimersAsync();
    table.tableSelection.selectedTds = [tds[2], tds[3], tds[6], tds[7]];
    table.mergeCellsv2();
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              ${new Array(2).fill(0).map(() => `<col width="50%" data-full="true" contenteditable="false" />`).join('\n')}
            </colgroup>
            <tbody>
              <tr>
                ${
                  new Array(2).fill(0).map(() => `<td rowspan="1" colspan="1">
                    <p>
                      <p><br></p>
                      <p><br></p>
                      <p><br></p>
                      <p><br></p>
                    </p>
                  </td>`).join('\n')
                }
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column left', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(2, 2);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat);
    table.tableSelection.selectedTds = [tds[0]];
    table.appendColv2(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
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

  it('insert column left and index is inside colspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(2, 2);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat);
    table.tableSelection.selectedTds = [tds[2], tds[3]];
    table.mergeCellsv2();
    await vi.runAllTimersAsync();
    table.tableSelection.selectedTds = [tds[1]];
    table.appendColv2(false);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="1" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });

  it('insert column right', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(2, 2);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat);
    table.tableSelection.selectedTds = [tds[1]];
    table.appendColv2(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              ${
                new Array(2).fill(0).map(() => `
                  <tr>
                    ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
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

  it('insert column right and index is inside colspan cell', async () => {
    const quill = createQuillWithTableModule(`<p><br></p>`, {
      fullWidth: true,
      dragResize: false,
    });
    const table = quill.getModule('table');
    table.insertTable(2, 2);
    await vi.runAllTimersAsync();
    table.tableSelection = new TableSelection(table, quill);
    const tds = quill.scroll.descendants(TableCellInnerFormat);
    table.tableSelection.selectedTds = [tds[2], tds[3]];
    table.mergeCellsv2();
    await vi.runAllTimersAsync();
    table.tableSelection.selectedTds = [tds[0]];
    table.appendColv2(true);
    await vi.runAllTimersAsync();
    expect(quill.root).toEqualHTML(
      `
        <p><br></p>
        <p>
          <table cellpadding="0" cellspacing="0" data-full>
            <colgroup>
              <col width="44%" data-full="true" contenteditable="false" />
              <col width="6%" data-full="true" contenteditable="false" />
              <col width="50%" data-full="true" contenteditable="false" />
            </colgroup>
            <tbody>
              <tr>
                ${new Array(3).fill(0).map(() => `<td rowspan="1" colspan="1"><p><p><br></p></p></td>`).join('\n')}
              </tr>
              <tr>
                <td rowspan="1" colspan="3">
                  <p>
                    <p><br></p>
                    <p><br></p>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </p>
        <p><br></p>
      `,
      { ignoreAttrs: ['class', 'style', 'data-table-id', 'data-row-id', 'data-col-id', 'data-rowspan', 'data-colspan'] },
    );
  });
});
