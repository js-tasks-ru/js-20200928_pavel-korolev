export default class SortableTable {
  headerRefs = {};
  subElements = {};

  constructor(headerData, {
    data,
    sortField,
    sortOrder,
  } = {}) {
    this.sortField = sortField || headerData.find(obj => obj.sortable).id;
    this.sortOrder = sortOrder || 'asc';
    this.headerData = headerData;
    this.bodyData = this.getSortedBodyData(data);
    this.template = `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row"></div>
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
    this.render();
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('pointerdown', this.onPointerDown, true);
  }

  removeEventListeners() {
    document.removeEventListener('pointerdown', this.onPointerDown, true);
  }

  onPointerDown = (event) => {
    const headerCell = event.target.closest('[data-sortable="true"]');

    if (headerCell) {
      this.sortOnHeaderCellClick(headerCell);
    }
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  createHeaderRefs(html) {
    [...html.querySelectorAll('[data-id]')].forEach(el => {
      this.headerRefs[el.dataset.id] = el;
    });
    this.headerRefs.arrow = this.renderArrow();
  }

  renderArrow() {
    const el = document.createElement('div');
    el.innerHTML = `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `;
    return el.firstElementChild;
  }

  render() {
    const el = document.createElement('div');
    el.innerHTML = this.template;
    this.createRefs(el);
    this.subElements.header.innerHTML = this.getHeaderTemplate();
    this.createHeaderRefs(this.subElements.header);
    this.headerRefs[this.sortField].dataset.order = this.sortOrder;
    this.headerRefs[this.sortField].append(this.headerRefs.arrow);
    this.subElements.body.innerHTML = this.getBodyTemplate(this.bodyData);
    this.element = el.firstElementChild;
  }

  getHeaderTemplate() {
    return this.headerData.reduce((html, { id, title, sortable }) => {
      return `
        ${html}
        <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${this.sortOrder}">
          <span>${title}</span>
        </div>
      `;
    }, '');
  }

  getBodyTemplate(bodyData) {
    return bodyData.reduce((html, { id, images, title, quantity, price, sales }) => {
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

  sortOnHeaderCellClick(el) {
    const { id, order } = el.dataset;
    const sortOrder = ({ asc: 'desc', desc: 'asc' })[order];
    el.dataset.order = sortOrder;
    this.headerRefs[id].append(this.headerRefs.arrow);
    this.sort(id, sortOrder);
  }

  sort(sortField, sortOrder) {
    this.sortField = sortField;
    this.sortOrder = sortOrder;
    this.subElements.body.innerHTML = this.getBodyTemplate(
      this.getSortedBodyData(this.bodyData)
    );
  }

  getSortType() {
    const headerCell = this.headerData.find(obj => obj.id === this.sortField);
    return headerCell && headerCell.sortType;
  }

  getSortedBodyData(arr) {
    const sortType = this.getSortType();

    switch (sortType) {
      case 'string':
        return this.sortByStrings(arr, this.sortField, this.sortOrder);
      case 'number':
        return this.sortByNumbers(arr, this.sortField, this.sortOrder);
    }
  }

  sortByNumbers(arr, key, sortOrder) {
    const compare = (a, b) => {
      switch (sortOrder) {
        case 'asc':
          return a[key] - b[key];
        case 'desc':
          return b[key] - a[key];
        // no default
      }
    };

    return arr.slice().sort(compare);
  }

  sortByStrings(arr, key, sortOrder) {
    const collator = new Intl.Collator(['ru', 'en'], { caseFirst: 'upper' });
    const compare = (a, b) => {
      switch (sortOrder) {
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
