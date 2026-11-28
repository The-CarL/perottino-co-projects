import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/i);
assert.ok(script, 'The offline app must contain its inline script');

function startApp() {
  function element() {
    const listeners = new Map();
    return {
      value: '',
      textContent: '',
      children: [],
      focused: false,
      addEventListener(type, callback) { listeners.set(type, callback); },
      dispatch(type) { listeners.get(type)?.(); },
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = Array.from(children); },
      focus() { this.focused = true; },
    };
  }

  const elements = new Map(['country-filter', 'clear-filter', 'result-status', 'country-results']
    .map(id => [id, element()]));
  // Execute the same inline script the browser runs, with only a minimal DOM stub.
  runInNewContext(script[1], {
    document: { getElementById: id => elements.get(id), createElement: element },
  }, { filename: 'public/index.html (inline script)', timeout: 1000 });

  const input = elements.get('country-filter');
  const clear = elements.get('clear-filter');
  const status = elements.get('result-status');
  const results = elements.get('country-results');
  return {
    input,
    clear,
    status,
    type(value) { input.value = value; input.dispatch('input'); },
    rows() { return results.children.map(row => row.children.map(cell => cell.textContent)); },
  };
}

test('the app filters by partial country name and exact code, ignoring case and surrounding spaces', () => {
  const app = startApp();
  app.type('  uNiTeD  ');
  assert.deepEqual(app.rows(), [['United States', 'US']]);
  app.type('  mX  ');
  assert.deepEqual(app.rows(), [['Mexico', 'MX']]);
});

test('the app handles no matches and clearing restores all entries and input focus', () => {
  const app = startApp();
  const all = [['Canada', 'CA'], ['Mexico', 'MX'], ['United States', 'US']];
  assert.deepEqual(app.rows(), all);
  app.type('not a country');
  assert.deepEqual(app.rows(), []);
  assert.equal(app.status.textContent, 'No matching countries.');
  app.clear.dispatch('click');
  assert.equal(app.input.value, '');
  assert.deepEqual(app.rows(), all);
  assert.equal(app.input.focused, true);
});
