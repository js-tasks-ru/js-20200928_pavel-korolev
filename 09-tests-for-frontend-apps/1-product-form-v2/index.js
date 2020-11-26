import SortableList from '../2-sortable-list/index.js';
import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const IMGUR_URL = 'https://api.imgur.com/3/image';
const BACKEND_URL = 'https://course-js.javascript.ru';
const GET_PRODUCTS_URL = `${BACKEND_URL}/api/rest/products`;
const GET_PRODUCT_CATEGORIES_URL = `${BACKEND_URL}/api/rest/categories`;

export default class ProductForm {
  subElements = {};
  element = null;
  product = {
    title: '',
    description: '',
    subcategory: '',
    price: '',
    discount: '',
    quantity: '',
    status: '',
    images: [],
  };
  productCategories = [];

  constructor(productId) {
    this.productId = productId;

    const a = new SortableList();
  }

  getTemplate() {
    return `
      <div class="product-form">

        <form data-element="productForm" class="form-grid">

          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input
                id="title"
                required=""
                type="text"
                name="title"
                class="form-control"
                placeholder="Название товара"
                value='${escapeHtml(this.product.title || '')}'
              >
            </fieldset>
          </div>

          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea
              id="description"
              required=""
              class="form-control"
              name="description"
              data-element="productDescription"
              placeholder="Описание товара"
            >${escapeHtml(this.product.description || '')}</textarea>
          </div>

          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer"></div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>

          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
              ${this.getProductSubcategoriesList()}
            </select>
          </div>

          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input
                id="price"
                required=""
                type="number"
                name="price"
                class="form-control"
                placeholder="100"
                value="${this.product.price || ''}">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input
                id="discount"
                required=""
                type="number"
                name="discount"
                class="form-control"
                placeholder="0"
                value="${this.product.discount ?? ''}">
            </fieldset>
          </div>

          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input
              id="quantity"
              required=""
              type="number"
              class="form-control"
              name="quantity"
              placeholder="1"
              value="${this.product.quantity ?? ''}">
          </div>

          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              ${this.getProductStatusOptions()}
            </select>
          </div>

          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              ${this.productId ? 'Сохранить товар' : 'Добавить товар'}
            </button>
          </div>

        </form>
      </div>
    `;
  }

  bindEvents() {
    this.subElements.productForm.addEventListener('submit', this.onSubmit);
    this.subElements.productForm.addEventListener('pointerdown', this.onFormPointerDown);
    this.subElements.imageListContainer.addEventListener('pointerdown', this.deleteImage);
  }

  unbindEvents() {
    this.subElements.productForm.removeEventListener('submit', this.onSubmit);
    this.subElements.productForm.removeEventListener('pointerdown', this.onFormPointerDown);
    this.subElements.imageListContainer.removeEventListener('pointerdown', this.deleteImage);
    this.sortableList.element.removeEventListener('sortable-list-reorder', this.sortImages);
  }

  async loadProduct() {
    if (!this.productId) {
      return;
    }

    const url = new URL(GET_PRODUCTS_URL);
    url.searchParams.set('id', this.productId);

    try {
      const result = await fetchJson(url);
      this.product = result[0] || {};
    } catch (err) {
      this.product = {};
    }
  }

  async loadProductCategories() {
    const url = new URL(GET_PRODUCT_CATEGORIES_URL);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');

    try {
      const result = await fetchJson(url);
      this.productCategories = result || [];
    } catch (err) {
      this.productCategories = [];
    }
  }

  async render() {
    await Promise.all([
      this.loadProductCategories(),
      this.loadProduct(),
    ]);

    const el = document.createElement('div');
    el.innerHTML = this.getTemplate();
    this.element = el.firstElementChild;
    this.createRefs(this.element);
    this.subElements.imageListContainer.append(this.getProductImageList());
    this.bindEvents();
    return this.element;
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  getProductImageList() {
    if (!this.product.images) {
      return '';
    }

    this.sortableList = new SortableList({
      items: this.product.images.map((image, i) => {
        const el = document.createElement('div');
        el.innerHTML = this.getProductImageListItem(image, i);
        return el.firstElementChild;
      })
    });

    this.sortableList.element.addEventListener('sortable-list-reorder', this.sortImages);

    return this.sortableList.element;
  }

  sortImages = ({ detail }) => {
    const { from, to } = detail;
    const [movedImage] = this.product.images.splice(from, 1);
    this.product.images.splice(to, 0, movedImage);
  }

  getProductImageListItem({ source, url }, index) {
    return `
      <li class="products-edit__imagelist-item">
        <input type="hidden" name="url" value="${url}">
        <input type="hidden" name="source" value="${source}">
          <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${url}">
            <span>${source}</span>
          </span>
          <button type="button">
            <img src="icon-trash.svg" data-delete-handle="${index}" alt="delete">
          </button>
      </li>
    `;
  }

  updateProductImageList() {
    this.subElements.imageListContainer.innerHTML = this.getProductImageList();
  }

  deleteImage = event => {
    const index = event.target.dataset.deleteHandle;

    if (index !== undefined) {
      this.product.images.splice(index, 1);
      this.updateProductImageList();
    }
  }

  onFormPointerDown = event => {
    if (event.target.name === 'uploadImage') {
      this.handleUploadImage(event.target);
    }
  }

  handleUploadImage(el) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.click();

    fileInput.addEventListener('change', async (event) => {
      const file = fileInput.files[0];
      const formData = new FormData();

      formData.append('image', file);

      el.classList.add('is-loading');

      try {
        const result = await fetchJson(IMGUR_URL, {
          method: 'POST',
          headers: {
            authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          },
          body: formData,
        });

        if (!this.product.images) {
          this.product.images = [];
        }

        this.product.images.push({
          url: result.data.link,
          source: file.name,
        });

        this.updateProductImageList();

      } catch (err) {
        this.error = err;
      } finally {
        el.classList.remove('is-loading');
      }
    });
  }

  onSubmit = event => {
    event.preventDefault();
    this.save();
  }

  getProductSubcategoriesList() {
    if (!this.productCategories.length) {
      return '';
    }

    return this.productCategories.reduce((html, { title, subcategories = [] }) => {
      return `${html}${subcategories.reduce((acc, subcategory) => {
        return `
          ${acc}
          <option
            value="${subcategory.id}"
            ${this.getSelected(subcategory.id === this.product.subcategory)}
          >${title} &gt; ${subcategory.title}</option>
        `;
      }, '')}`;
    }, '');
  }

  getProductStatusOptions() {
    return `
      <option value="1" ${this.getSelected(this.product.status === 1)}>Активен</option>
      <option value="0" ${this.getSelected(this.product.status === 0)}>Неактивен</option>
    `;
  }

  getSelected(bool) {
    return bool ? 'selected' : '';
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.unbindEvents();
    this.remove();
  }

  getFieldValue(id) {
    return this.element.querySelector(`#${id}`).value;
  }

  getFieldsData() {
    const fields = {
      title: this.getFieldValue('title'),
      description: this.getFieldValue('description'),
      subcategory: this.getFieldValue('subcategory'),
      price: parseInt(this.getFieldValue('price'), 10),
      discount: parseInt(this.getFieldValue('discount'), 10),
      quantity: parseInt(this.getFieldValue('quantity'), 10),
      status: parseInt(this.getFieldValue('status'), 10),
      images: this.product.images,
    };

    if (this.productId) {
      fields.id = this.productId;
    }

    return fields;
  }

  async save() {
    const url = new URL(GET_PRODUCTS_URL);
    const fieldsData = this.getFieldsData();

    try {
      const result = await fetchJson(url, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(fieldsData),
      });

      const eventName = this.productId ? 'product-updated' : 'product-saved';
      const customEvent = new CustomEvent(eventName, {
        bubbles: true,
        detail: { ...result },
      });

      this.element.dispatchEvent(customEvent);
    } catch (err) {
      this.error = err;
    }
  }
}

