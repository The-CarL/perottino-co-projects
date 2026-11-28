import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

function startApp() {
  const nodes = new Map();
  let focused = null;
  function element() {
    const handlers = new Map();
    return {
      value: '', textContent: '', children: [],
      addEventListener(type, callback) { handlers.set(type, callback); },
      fire(type) { handlers.get(type)(); },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      focus() { focused = this; },
    };
  }
  const document = {
    createElement: element,
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, element());
      return nodes.get(id);
    },
  };
  assert.ok(script, 'The offline page has an inline script');
  runInNewContext(script, { document });
  const filter = nodes.get('country-filter');
  return {
    query(value) { filter.value = value; filter.fire('input'); },
    clear() { nodes.get('clear-filter').fire('click'); },
    rows() { return nodes.get('country-results').children.map(row => row.children.map(child => child.textContent)); },
    status() { return nodes.get('result-status').textContent; },
    filterIsFocused() { return focused === filter; },
    value() { return filter.value; },
  };
}

const allCountries = [['Canada', 'CA'], ['Mexico', 'MX'], ['United States', 'US']];

test('initial results and case-insensitive filtering by partial name or alpha-2 code', () => {
  const app = startApp();
  assert.deepEqual(app.rows(), allCountries);
  app.query('  uniTED  ');
  assert.deepEqual(app.rows(), [['United States', 'US']]);
  for (const [name, code] of allCountries) {
    app.query(code.toLowerCase());
    assert.deepEqual(app.rows(), [[name, code]]);
  }
});

test('clear restores every country and returns focus after an empty result', () => {
  const app = startApp();
  app.query('Atlantis');
  assert.deepEqual(app.rows(), []);
  assert.equal(app.status(), 'No matching countries.');
  app.clear();
  assert.equal(app.value(), '');
  assert.deepEqual(app.rows(), allCountries);
  assert.equal(app.status(), '3 countries found.');
  assert.ok(app.filterIsFocused());
});

test('the standalone page uses a labeled native text input and native button', () => {
  assert.match(html, /<label for="country-filter">/);
  assert.match(html, /<input id="country-filter" type="text"/);
  assert.match(html, /<button id="clear-filter" type="button">Clear filter<\/button>/);
  assert.doesNotMatch(html, /<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=/i);
});
