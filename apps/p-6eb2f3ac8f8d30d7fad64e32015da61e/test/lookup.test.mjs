import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/lookup.js';

function desk() {
  function element() {
    const listeners = new Map();
    return {
      value: '',
      textContent: '',
      children: [],
      focused: false,
      addEventListener(type, listener) { listeners.set(type, listener); },
      fire(type) { listeners.get(type)(); },
      replaceChildren(...children) { this.children = children; },
      append(...children) { this.children.push(...children); },
      focus() { this.focused = true; },
    };
  }
  const filter = element();
  const clear = element();
  const status = element();
  const results = element();
  const elements = new Map([
    ['country-filter', filter], ['clear-filter', clear],
    ['result-status', status], ['country-results', results],
  ]);
  globalThis.CountryCodeDesk.mount({
    getElementById: (id) => elements.get(id),
    createElement: element,
  });
  return {
    filter, clear, status,
    rows: () => results.children.map((row) => row.children.map((cell) => cell.textContent)),
    type(value) { filter.value = value; filter.fire('input'); },
  };
}

const all = [['Canada', 'CA'], ['Mexico', 'MX'], ['United States', 'US']];

test('renders the ISO codes and filters by partial name or exact code', () => {
  const app = desk();
  assert.deepEqual(app.rows(), all);
  app.type('  sTaTe  ');
  assert.deepEqual(app.rows(), [['United States', 'US']]);
  app.type('mx');
  assert.deepEqual(app.rows(), [['Mexico', 'MX']]);
  app.type('CA');
  assert.deepEqual(app.rows(), [['Canada', 'CA']]);
});

test('clear restores the complete list and returns focus to the filter', () => {
  const app = desk();
  app.type('unmatched');
  assert.deepEqual(app.rows(), []);
  assert.equal(app.status.textContent, 'No matching countries.');
  app.clear.fire('click');
  assert.equal(app.filter.value, '');
  assert.equal(app.filter.focused, true);
  assert.deepEqual(app.rows(), all);
  assert.equal(app.status.textContent, '3 countries found.');
});
