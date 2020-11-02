import fetchJSON from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';
const normalizeResult = result => Object.entries(result)
  .map(([date, amount]) => ({
    date,
    amount,
  }));

export default class ColumnChart {
  chartHeight = 50;
  subElements = {};

  constructor({
    url = '/',
    range = {},
    label = '',
    link = '',
    formatHeading = val => val,
  } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.setRange(range.from, range.to);
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;

    this.data = [];

    this.render();
    this.loadData();
  }

  get template() {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.link && `<a href="${this.link}" class="column-chart__link">View all</a>`}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header"></div>
          <div data-element="body" class="column-chart__chart"></div>
        </div>
      </div>
    `;
  }

  render() {
    const el = document.createElement('div');
    el.innerHTML = this.template;
    this.element = el.firstElementChild;
    this.createRefs(this.element);
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  async loadData() {
    this.element.classList.add('column-chart_loading');

    try {
      const result = await fetchJSON(this.url);
      this.data = normalizeResult(result);
    } catch (err) {
      this.data = [];
    } finally {
      this.updateElementHtml();
    }
  }

  updateElementHtml() {
    if (this.data.length) {
      this.element.classList.remove('column-chart_loading');
      this.subElements.header.innerHTML = this.getHeaderHtml();
      this.subElements.body.innerHTML = this.getBodyHtml();
    } else {
      this.subElements.header.innerHTML = '';
      this.subElements.body.innerHTML = '';
    }
  }

  getHeaderHtml() {
    const total = this.data.reduce((acc, { amount }) => acc + amount, 0);
    return `${total ? this.formatHeading(total) : ''}`;
  }

  getBodyHtml() {
    const max = Math.max.apply(null, this.data.map(({ amount }) => amount));
    return this.data.map(({ date, amount }) => {
      const scale = this.chartHeight / max;
      const columnHeight = Math.floor(amount * scale);
      const tooltipHtml = this.getTooltip(max, date, amount);

      return `
        <div style="--value: ${columnHeight}" data-tooltip="${tooltipHtml}"></div>
      `;
    }).join('');
  }

  getTooltip(max, date, amount) {
    const percent = (amount / max * 100).toFixed(0);
    return `
      <span>
        <small>${date}</small>
        <br>
        <strong>${percent}%</strong>
      </span>
    `;
  }

  async update(from, to) {
    this.setRange(from, to);
    await this.loadData();
  }

  setRange(from = new Date(), to = new Date()) {
    this.url.searchParams.set('from', from.toISOString());
    this.url.searchParams.set('to', to.toISOString());
  }

  destroy() {
    this.element.remove();
  }
}
