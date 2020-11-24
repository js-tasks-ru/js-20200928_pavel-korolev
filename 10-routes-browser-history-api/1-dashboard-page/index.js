import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';
const DASHBOARD_API_URL = 'api/dashboard';
const DASHBOARD_ORDERS_URL = `${DASHBOARD_API_URL}/orders`;
const DASHBOARD_SALES_URL = `${DASHBOARD_API_URL}/sales`;
const DASHBOARD_CUSTOMERS_URL = `${DASHBOARD_API_URL}/customers`;
const getBestsellersUrl = ({ from, to, limit = 20 }) => (
  `${DASHBOARD_API_URL}/bestsellers?_start=1&_end=${limit}&from=${from.toISOString()}&to=${to.toISOString()}`
);

export default class Page {
  constructor() {
    const now = new Date();

    this.range = {
      from: new Date(now.getFullYear(), now.getMonth()),
      to: new Date(now.getFullYear(), (now.getMonth() + 1)),
    };
  }

  get template() {
    return `
      <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable"></div>
      </div>
    `;
  }

  bindEvents() {
    this.components.rangePicker.element.addEventListener('date-select', this.changeRange);
  }

  changeRange = event => {
    if (!event.detail) {
      return;
    }

    const { from, to } = event.detail;
    this.updateComponents(from, to);
  }

  async render() {
    const el = document.createElement('div');
    el.innerHTML = this.template;
    this.element = el.firstElementChild;

    this.createRefs(this.element);
    this.createComponents();
    this.mountComponents();
    this.bindEvents();

    return this.element;
  }

  createRefs(html) {
    this.subElements = {};

    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  createComponents() {
    this.components = {
      rangePicker: new RangePicker({
        ...this.range,
      }),

      ordersChart: new ColumnChart({
        url: DASHBOARD_ORDERS_URL,
        label: 'orders',
        range: this.range,
      }),

      salesChart: new ColumnChart({
        url: DASHBOARD_SALES_URL,
        label: 'sales',
        range: this.range,
      }),

      customersChart: new ColumnChart({
        url: DASHBOARD_CUSTOMERS_URL,
        label: 'customers',
        range: this.range,
      }),

      sortableTable: new SortableTable(header, {
        url: getBestsellersUrl(this.range),
        isSortLocally: true,
      }),
    };
  }

  mountComponents() {
    const componentNames = Object.keys(this.components);

    componentNames.forEach((name) => {
      this.subElements[name].append(
        this.components[name].element
      );
    });
  }

  async updateComponents(from, to) {
    const BESTSELLERS_API_URL = `${BACKEND_URL}${getBestsellersUrl(this.range)}`;
    this.range = { from, to };

    this.components.ordersChart.update(from, to);
    this.components.salesChart.update(from, to);
    this.components.customersChart.update(from, to);

    try {
      const products = await fetchJson(BESTSELLERS_API_URL);
      this.components.sortableTable.addRows(products);
      this.components.sortableTable.update(products);
    } catch (err) {
      this.components.sortableTable.update([]);
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.unmountComponents();
  }

  unmountComponents() {
    const componentNames = Object.keys(this.components);

    componentNames.forEach((name) => {
      this.components[name].destroy();
    });
  }
}
