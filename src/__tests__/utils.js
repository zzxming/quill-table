import Quill from 'quill';
import { expect } from 'vitest';
import Table from '../index';

export const normalizeHTML = html => typeof html === 'object' ? html.html : html.replaceAll(/\n\s*/g, '');
export const sortAttributes = (element) => {
  const attributes = Array.from(element.attributes);
  const sortedAttributes = attributes.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  while (element.attributes.length > 0) {
    element.removeAttribute(element.attributes[0].name);
  }

  for (const attr of sortedAttributes) {
    element.setAttribute(attr.name, attr.value);
  }

  for (const child of element.childNodes) {
    if (child instanceof HTMLElement) {
      sortAttributes(child);
    }
  }
};
export const createQuillWithTableModule = (html, options = true, register = {}) => {
  Quill.register({
    'modules/table': Table,
    ...register,
  }, true);
  const container = document.body.appendChild(document.createElement('div'));
  container.innerHTML = normalizeHTML(html);
  const quill = new Quill(container, {
    modules: { table: options },
  });
  return quill;
};

expect.extend({
  toEqualHTML(received, expected, options = {}) {
    const ignoreAttrs = options?.ignoreAttrs ?? [];
    const receivedDOM = document.createElement('div');
    const expectedDOM = document.createElement('div');
    receivedDOM.innerHTML = normalizeHTML(
      typeof received === 'string' ? received : received.innerHTML,
    );
    expectedDOM.innerHTML = normalizeHTML(expected);

    const doms = [receivedDOM, expectedDOM];

    for (const dom of doms) {
      for (const node of Array.from(dom.querySelectorAll('.ql-ui'))) {
        node.remove();
      }

      for (const attr of ignoreAttrs) {
        for (const node of Array.from(dom.querySelectorAll(`[${attr}]`))) {
          node.removeAttribute(attr);
        }
      }

      sortAttributes(dom);
    }

    if (this.equals(receivedDOM.innerHTML, expectedDOM.innerHTML)) {
      return { pass: true, message: () => '' };
    }
    return {
      pass: false,
      message: () =>
        `HTMLs don't match.\n${this.utils.diff(
          this.utils.stringify(receivedDOM),
          this.utils.stringify(expectedDOM),
        )}`,
    };
  },
});
