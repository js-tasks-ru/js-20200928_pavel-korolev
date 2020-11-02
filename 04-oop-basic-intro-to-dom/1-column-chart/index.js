const normalizeData = (data, limit) => {
  const max = Math.max.apply(null, data);
  return data.map(n => ({
    columnHeight: Math.floor(n * limit / max),
    percent: (n / max * 100).toFixed(0),
  }));
};

export default class ColumnChart {
  chartHeight = 50;

  constructor ({
    data = [],
    label = '',
    value = '',
    link = '',
  } = {}) {
    this.data = data;
    this.label = label;
    this.value = value;
    this.link = link;
    this.element = document.createElement('div');
    this.element.classList.add('column-chart');

    this.render();
  }

  render() {
    if (!this.data.length) {
      this.element.classList.add('column-chart_loading');
    }

    const chartBody = normalizeData(this.data, this.chartHeight)
      .reduce((html, { columnHeight, percent }) => {
        const str = `<div style="--value: ${columnHeight}" data-tooltip="${percent}%"></div>`;
        return html ? `${html}\n${str}` : `${str}`;
      }, '');

    this.element.innerHTML = `
      <div class="column-chart__title">
        Total ${this.label}
        <a href="${this.link}" class="column-chart__link">View all</a>
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">
          ${this.value}
        </div>
        <div data-element="body" class="column-chart__chart">
          ${chartBody}
        </div>
      </div>
    `;
  }

  update(data) {
    this.data = [...data];
    this.render();
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    return this;
  }
}
