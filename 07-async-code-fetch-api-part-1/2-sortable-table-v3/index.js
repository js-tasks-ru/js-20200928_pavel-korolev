import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';
const createElement = template => {
  const el = document.createElement('div');
  el.innerHTML = template;
  return el.firstElementChild;
};

export default class SortableTable {
  subElements = {};

  constructor(headerData, {
    url = '/',
  } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.headerData = headerData;
    this.params = {
      sort: this.headerData.find(obj => obj.sortable).id,
      order: this.getOrder(),
      start: 0,
      end: 30,
    };
    this.isServerSortAllowed = true;

    this.render();
  }

  async loadData(params) {
    this.setGETParams(params);
    this.element.classList.add('sortable-table_loading');
    this.element.classList.remove('sortable-table_empty');
    this.subElements.body.innerHTML = '';

    try {
      this.data = await fetchJson(this.url);
    } catch (err) {
      this.data = [];
    } finally {
      this.updateElementHtml();
    }
  }

  getOrder(order = 'desc') {
    return ({ asc: 'desc', desc: 'asc' })[order];
  }

  setGETParams(params) {
    Object.entries(params).forEach(([key, value]) => {
      this.url.searchParams.set(`_${key}`, value);
    });
  }

  get template() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getHeaderTemplate()}
        </div>
        <div data-element="body" class="sortable-table__body"></div>
        <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
        <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
          <div>
            <p>No products satisfies your filter criteria</p>
            <button type="button" class="button-primary-outline">Reset all filters</button>
          </div>
        </div>
      <div>
    `;
  }

  initEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.onPointerDown);
  }

  removeEventListeners() {
    this.subElements.header.removeEventListener('pointerdown', this.onPointerDown);
  }

  onPointerDown = event => {
    const headerCell = event.target.closest('[data-sortable="true"]');

    if (headerCell) {
      const { id, order } = headerCell.dataset;
      const newOrder = this.getOrder(order);
      headerCell.dataset.order = newOrder;
      headerCell.append(this.subElements.arrow);

      if (this.isServerSortAllowed) {
        this.sortOnServer(id, newOrder);
      } else {
        this.sortLocal(id, newOrder);
      }
    }
  }

  sortOnServer(id, order) {
    this.params.sort = id;
    this.params.order = order;
    this.loadData(this.params);
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  async render() {
    this.element = createElement(this.template);
    this.createRefs(this.element);
    await this.loadData(this.params);
    this.initEventListeners();
  }

  updateElementHtml() {
    if (this.data.length) {
      this.element.classList.remove('sortable-table_loading');
      this.subElements.body.innerHTML = this.getBodyTemplate();
    } else {
      this.element.classList.add('sortable-table_empty');
    }
  }

  getHeaderTemplate() {
    const { order } = this.params;
    const arrow = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;

    return this.headerData.reduce((html, { id, title, sortable }) => {
      return `
        ${html}
        <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
          <span>${title}</span>
          ${id === 'title' ? arrow : ''}
        </div>
      `;
    }, '');
  }

  getBodyTemplate() {
    return this.data.reduce((html, { id, images, title, quantity, price, sales }) => {
      return `
        ${html}
        <a href="/products/${id}" class="sortable-table__row">
          ${this.getRowImageTemplate(images)}
          ${this.getRowCellsTemplate([title, quantity, price, sales])}
        </a>
      `;
    }, '');
  }

  getRowImageTemplate(images) {
    if (!images) {
      return '';
    }

    const [firstImage] = images;

    return `
      <div class="sortable-table__cell">
        <img class="sortable-table-image" alt="Image" src="${firstImage.url}">
      </div>
    `;
  }

  getRowCellsTemplate(cells) {
    return cells
      .filter(val => val !== undefined)
      .reduce((acc, val) => `${acc}<div class="sortable-table__cell">${val}</div>`, '');
  }

  sortLocal(id, order) {
    const { sortType } = this.headerData.find(obj => obj.id === id);
    this.data = this.sortData(id, order, sortType);
    this.subElements.body.innerHTML = this.getBodyTemplate();
  }

  sortData(id, order, sortType) {
    switch (sortType) {
      case 'string':
        return this.sortByStrings(this.data, id, order);
      case 'number':
        return this.sortByNumbers(this.data, id, order);
    }
  }

  sortByNumbers(arr, key, order) {
    const compare = (a, b) => {
      switch (order) {
        case 'asc':
          return a[key] - b[key];
        case 'desc':
          return b[key] - a[key];
        // no default
      }
    };

    return arr.slice().sort(compare);
  }

  sortByStrings(arr, key, order) {
    const collator = new Intl.Collator(['ru', 'en'], { caseFirst: 'upper' });
    const compare = (a, b) => {
      switch (order) {
        case 'asc':
          return collator.compare(a[key], b[key]);
        case 'desc':
          return collator.compare(b[key], a[key]);
        // no default
      }
    };

    return arr.slice().sort(compare);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }

}
