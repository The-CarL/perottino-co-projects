(() => {
  'use strict';
  const countries = [
    ['Canada', 'CA'],
    ['Mexico', 'MX'],
    ['United States', 'US'],
  ];

  function mount(doc) {
    const filter = doc.getElementById('country-filter');
    const clear = doc.getElementById('clear-filter');
    const status = doc.getElementById('result-status');
    const results = doc.getElementById('country-results');

    function render() {
      const query = filter.value.trim().toLowerCase();
      const matches = countries.filter(([name, code]) =>
        name.toLowerCase().includes(query) || code.toLowerCase() === query
      );
      results.replaceChildren(...matches.map(([name, code]) => {
        const row = doc.createElement('li');
        const label = doc.createElement('span');
        const badge = doc.createElement('strong');
        label.textContent = name;
        badge.textContent = code;
        row.append(label, badge);
        return row;
      }));
      status.textContent = matches.length === 0 ? 'No matching countries.' :
        `${matches.length} ${matches.length === 1 ? 'country' : 'countries'} found.`;
    }

    filter.addEventListener('input', render);
    clear.addEventListener('click', () => {
      filter.value = '';
      render();
      filter.focus();
    });
    render();
  }

  globalThis.CountryCodeDesk = Object.freeze({ mount });
  if (typeof document !== 'undefined') mount(document);
})();
