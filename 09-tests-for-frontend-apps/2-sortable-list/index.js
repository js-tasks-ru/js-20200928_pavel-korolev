export default class SortableList {
  element = null;
  placeholder = null;

  constructor({ items = [] } = {}) {
    this.items = items;
    this.render();
    this.bindEvents();
  }

  render() {
    this.element = document.createElement('ul');
    this.placeholder = document.createElement('li');

    this.element.classList.add('sortable-list');
    this.placeholder.classList.add('sortable-list__placeholder');

    this.items.forEach((el) => {
      el.classList.add('sortable-list__item');
      this.element.append(el);
    });
  }

  bindEvents() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  unbindEvents() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
  }

  bindDocumentEvents() {
    document.addEventListener('pointermove', this.onDocumentPointerMove);
    document.addEventListener('pointerup', this.onDocumentPointerUp);
  }

  unbindDocumentEvents() {
    document.removeEventListener('pointermove', this.onDocumentPointerMove);
    document.removeEventListener('pointerup', this.onDocumentPointerUp);
  }

  onPointerDown = event => {
    const el = event.target.closest('.sortable-list__item');
    const grabHandle = event.target.closest('[data-grab-handle]');
    const deleteHandle = event.target.closest('[data-delete-handle]');

    if (!el) {
      return;
    }

    if (grabHandle) {
      this.moveElement(el, event);
    }

    if (deleteHandle) {
      this.deleteElement(el);
    }
  }

  deleteElement(el) {
    el.remove();

    this.element.dispatchEvent(new CustomEvent('sortable-list-delete', {
      bubbles: true,
      details: { deletedEl: el },
    }));
  }

  moveElement(el, { clientX: x, clientY: y }) {
    const { top, left, width, height } = el.getBoundingClientRect();

    this.initialIndex = [...this.element.children].indexOf(el);
    this.startingPos = { x: (x - left), y: (y - top) };

    el.style.width = `${width}px`;
    el.style.height = `${height}px`;

    this.insertPlaceholderAfter(el);

    el.classList.add('sortable-list__item_dragging'); // position: fixed
    this.element.append(el);

    this.targetEl = el;
    this.dragElement(x, y);
    this.bindDocumentEvents();
  }

  dragElement(x, y) {
    const newX = x - this.startingPos.x;
    const newY = y - this.startingPos.y;

    this.targetEl.style.left = `${newX}px`;
    this.targetEl.style.top = `${newY}px`;
  }

  onDocumentPointerMove = ({ clientX: x, clientY: y }) => {
    this.dragElement(x, y);

    const topLimit = this.element.children[0].getBoundingClientRect().top;
    const bottomLimit = this.element.getBoundingClientRect().bottom;

    if (y < topLimit) {
      this.insertPlaceholderBefore(0);
      return;
    }

    if (y > bottomLimit) {
      this.insertPlaceholderBefore(this.element.children.length);
      return;
    }

    let hasPlaceholderMoved = false;
    [...this.element.children].forEach((item, i) => {
      if (item === this.targetEl || hasPlaceholderMoved) {
        return;
      }

      const { top, bottom, height } = item.getBoundingClientRect();
      const isPointerInside = y > top && y < bottom;
      const isPointerOverUpperHalf = y < (top + (height / 2));
      const nextPlaceholderIndex = isPointerOverUpperHalf ? i : i + 1;

      if (isPointerInside) {
        this.insertPlaceholderBefore(nextPlaceholderIndex);
        hasPlaceholderMoved = true;
      }
    });
  }

  onDocumentPointerUp = () => {
    this.emitListReorder();
    this.placeholder.replaceWith(this.targetEl);
    this.resetTargetEl();
    this.unbindDocumentEvents();
  }

  emitListReorder() {
    const placeholderIndex = [...this.element.children].indexOf(this.placeholder);

    if (placeholderIndex !== this.initialIndex) {
      this.element.dispatchEvent(new CustomEvent('sortable-list-reorder', {
        bubbles: true,
        detail: {
          from: this.initialIndex,
          to: placeholderIndex,
        }
      }));
    }
  }

  resetTargetEl() {
    this.targetEl.classList.remove('sortable-list__item_dragging');
    ['left', 'top', 'width', 'height'].forEach((prop) => {
      this.targetEl.style[prop] = '';
    });
    this.targetEl = null;
  }

  insertPlaceholderAfter(el) {
    this.placeholder.style.width = el.style.width;
    this.placeholder.style.height = el.style.height;
    el.after(this.placeholder);
  }

  insertPlaceholderBefore(i) {
    const el = this.element.children[i];

    if (el !== this.placeholder) {
      this.element.insertBefore(this.placeholder, el);
    }
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.unbindDocumentEvents();
    this.unbindEvents();
    this.remove();
  }
}
