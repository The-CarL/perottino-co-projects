import test from 'node:test';
import assert from 'node:assert/strict';

// These synchronous tests exercise the lookup contract with fixed ISO fixtures.
// They do not load the HTML or simulate browser events.
const entries = [['Canada', 'CA'], ['Mexico', 'MX'], ['United States', 'US']];

function lookup(value) {
  const query = value.trim().toLowerCase();
  return entries.filter(([name, code]) =>
    name.toLowerCase().includes(query) || code.toLowerCase() === query
  );
}

test('lookup contract: partial names and exact codes are case insensitive', () => {
  assert.deepEqual(lookup('  uniTED  '), [['United States', 'US']]);
  assert.deepEqual(lookup('ca'), [['Canada', 'CA']]);
  assert.deepEqual(lookup('mX'), [['Mexico', 'MX']]);
  assert.deepEqual(lookup('us'), [['United States', 'US']]);
});

test('lookup contract: clearing an unmatched query restores all three entries', () => {
  assert.deepEqual(lookup('Atlantis'), []);
  assert.deepEqual(lookup(''), [['Canada', 'CA'], ['Mexico', 'MX'], ['United States', 'US']]);
});
