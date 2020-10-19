export default class SortableTable {
  headerRefs = {};
  subElements = {};

  constructor(headerOptions, { data } = {}) {
    this.headerData = headerOptions;
    this.bodyData = data;
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
    this.subElements.body.innerHTML = this.getBodyTemplate(this.bodyData);
    this.element = el.firstElementChild;
  }

  getHeaderTemplate() {
    return this.headerData.reduce((html, { id, title, sortable }) => {
      return `
        ${html}
        <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="">
          <span>${title}</span>
        </div>
      `;
    }, '');
  }

  getBodyTemplate(bodyData) {
    return bodyData.reduce((html, { id, title, images, quantity, price, sales }) => {
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

  sort(field, sortOrder) {
    const { sortType } = this.headerData.find(obj => obj.id === field);
    this.headerRefs[field].dataset.order = sortOrder;
    this.headerRefs[field].append(this.headerRefs.arrow);
    this.subElements.body.innerHTML = this.getBodyTemplate(
      this.getSortedBodyData(field, sortOrder, sortType)
    );
  }

  getSortedBodyData(field, sortOrder, sortType) {
    switch (sortType) {
      case 'string':
        return this.sortByStrings(this.bodyData, field, sortOrder);
      case 'number':
        return this.sortByNumbers(this.bodyData, field, sortOrder);
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
    this.remove();
  }

}
