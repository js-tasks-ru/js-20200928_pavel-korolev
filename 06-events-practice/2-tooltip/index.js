class Tooltip {
  static instance

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  initEventListeners() {
    document.addEventListener('pointerover', this.onPointerOver);
    document.addEventListener('pointerout', this.onPointerOut);
  }

  initialize() {
    this.initEventListeners();
  }

  render(html) {
    this.element = document.createElement('div');
    this.element.classList.add('tooltip');
    this.element.innerHTML = html;

    document.body.append(this.element);
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;

      document.removeEventListener('pointermove', this.onPointerMove);
    }
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }

  removeEventListeners() {
    document.removeEventListener('pointerover', this.onPointerOver);
    document.removeEventListener('pointerout', this.onPointerOut);
  }

  onPointerOver = event => {
    const el = event.target.closest('[data-tooltip]');

    if (el) {
      this.render(el.dataset.tooltip);
      document.addEventListener('pointermove', this.onPointerMove);
    }
  }

  onPointerOut = () => {
    this.remove();
  }

  onPointerMove = event => {
    this.moveTooltip(event);
  }

  moveTooltip(event) {
    const leftLimit = window.innerWidth - this.element.offsetWidth - 10;
    const top = event.clientY + 10;
    let left = event.clientX + 10;

    if (left > leftLimit) {
      left = leftLimit;
    }

    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

}

const tooltip = new Tooltip();

export default tooltip;
