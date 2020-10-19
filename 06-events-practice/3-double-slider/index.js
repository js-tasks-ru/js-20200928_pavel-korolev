export default class DoubleSlider {
  refs = {};
  currentThumb = null;

  constructor({
    min = 0,
    max = 0,
    formatValue = (value) => value,
    selected,
  } = {}) {
    this.min = min;
    this.max = max;
    this.range = max - min;
    this.selected = selected;
    this.formatValue = formatValue;

    this.position = {
      thumbL: { shiftX: 0, sliderLeft: 0, last: 0 },
      thumbR: { shiftX: 0, sliderRight: 0, last: 0 },
    };

    this.selection = {
      from: selected && selected.from || min,
      to: selected && selected.to || max,
    };

    this.render();
    this.initEventListeners();
  }

  get template() {
    let min = this.min;
    let max = this.max;
    let left = 0;
    let right = 0;

    if (this.selected) {
      min = this.selected.from;
      max = this.selected.to;
      left = (min - this.min) / this.range * 100;
      right = (max - this.min) / this.range * 100;
    }

    return `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(min)}</span>
        <div class="range-slider__inner" data-element="slider">
          <span class="range-slider__progress" data-element="progress" style="left: ${left}%; right: ${right}%"></span>
          <span class="range-slider__thumb-left" data-element="thumbL" style="left: ${left}%"></span>
          <span class="range-slider__thumb-right" data-element="thumbR" style="right: ${right}%"></span>
        </div>
        <span data-element="to">${this.formatValue(max)}</span>
      </div>
    `;
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.refs[el.dataset.element] = el;
    });
  }

  render() {
    const el = document.createElement('div');
    el.innerHTML = this.template;
    this.createRefs(el);
    this.element = el.firstElementChild;
  }

  initEventListeners() {
    [
      this.refs.thumbL,
      this.refs.thumbR,
    ].forEach(thumb => thumb.addEventListener('pointerdown', event => {
      event.preventDefault();

      this.getInitialPosition(event);

      const el = event.target.closest('[data-element]');
      this.currentThumb = el && el.dataset.element;

      document.addEventListener('pointermove', this.onPointerMove);
      document.addEventListener('pointerup', this.onPointerUp);
    }));
  }

  removeEventListeners() {
    document.removeEventListener('pointerup', this.onPointerUp);
    document.removeEventListener('pointermove', this.onPointerMove);
  }

  getInitialPosition(event) {
    const { clientX } = event;
    const sliderRect = this.refs.slider.getBoundingClientRect();
    const thumbLRect = this.refs.thumbL.getBoundingClientRect();
    const thumbRRect = this.refs.thumbR.getBoundingClientRect();

    this.position.thumbL.shiftX = clientX - thumbLRect.left;
    this.position.thumbR.shiftX = thumbRRect.right - clientX;
    this.position.thumbL.sliderLeft = sliderRect.left;
    this.position.thumbR.sliderRight = sliderRect.right;
  }

  onPointerUp = event => {
    const customEvent = new CustomEvent('range-select', {
      bubbles: true,
      detail: { ...this.selection },
    });

    this.element.dispatchEvent(customEvent);
    this.removeEventListeners();
  }

  restrictNumberByLimits(n, min, max) {
    if (n < min) {
      return min;
    }
    if (n > max) {
      return max;
    }
    return n;
  }

  onPointerMove = event => {
    const { clientX } = event;
    const { thumbL, thumbR } = this.position;
    const sliderWidth = this.refs.slider.getBoundingClientRect().width;
    const rightEdge = sliderWidth - thumbL.last;
    const leftEdge = sliderWidth - thumbR.last;

    let newRight = (thumbR.shiftX + thumbR.sliderRight) - clientX;
    let newLeft = clientX - (thumbL.shiftX + thumbL.sliderLeft);

    newRight = this.restrictNumberByLimits(newRight, 0, rightEdge);
    newLeft = this.restrictNumberByLimits(newLeft, 0, leftEdge);

    switch (this.currentThumb) {
      case 'thumbR':
        this.moveRightThumb(newRight, sliderWidth);
        break;
      case 'thumbL':
        this.moveLeftThumb(newLeft, sliderWidth);
        break;
      // no default
    }
  }

  moveRightThumb(px, width) {
    this.position.thumbR.last = px;
    this.refs.thumbR.style.right = `${px}px`;
    this.refs.progress.style.right = `${px}px`;
    this.updateTo(px, width);
  }

  moveLeftThumb(px, width) {
    this.position.thumbL.last = px;
    this.refs.thumbL.style.left = `${px}px`;
    this.refs.progress.style.left = `${px}px`;
    this.updateFrom(px, width);
  }

  updateTo(px, width) {
    const to = Math.floor(
      this.max - this.range * this.getDecimalPercent(px, width)
    );
    this.selection.to = to;
    this.refs.to.innerHTML = `${this.formatValue(to)}`;
  }

  updateFrom(px, width) {
    const from = Math.floor(
      this.min + this.range * this.getDecimalPercent(px, width)
    );
    this.selection.from = from;
    this.refs.from.innerHTML = `${this.formatValue(from)}`;
  }

  getDecimalPercent(n, total) {
    return (n / total * 100) / 100;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}
