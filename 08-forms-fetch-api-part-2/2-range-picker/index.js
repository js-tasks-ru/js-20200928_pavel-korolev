const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

const formatNumber = n => (n < 10 ? `0${n}` : `${n}`);
const formatDate = date => {
  const monthStr = formatNumber(date.getMonth() + 1);
  const dateStr = formatNumber(date.getDate());

  return `${dateStr}.${monthStr}.${date.getFullYear()}`;
};
const getLastDateInMonth = date => (
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
);
const getDateTime = date => (
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
);
const getDateISOString = (date, i) => {
  const monthStr = formatNumber(date.getMonth() + 1);
  const dateStr = formatNumber(i);
  return `${date.getFullYear()}-${monthStr}-${dateStr}T00:00:00.000Z`;
};

export default class RangePicker {
  element = null;
  isOpen = false;
  subElements = {};
  selectedCount = 0;
  calendarRendered = false;

  constructor({ from, to }) {
    this.initialRange = { from, to };
    this.setRange(from, to);
    this.setMonths(from, to);
    this.render();
    this.bindEvents();
  }

  getTemplate() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          ${this.getInput()}
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  bindEvents() {
    this.subElements.selector.addEventListener('click', this.onSelectorPointerDown);
    this.subElements.input.addEventListener('click', this.onInputPointerDown);
    document.addEventListener('click', this.onDocumentPointerDown, true);
  }

  unbindEvents() {
    if (this.calendarRendered) {
      this.subElements.prev.removeEventListener('click', this.onControlPointerDown);
      this.subElements.next.removeEventListener('click', this.onControlPointerDown);
    }

    this.subElements.selector.removeEventListener('click', this.onPointerDown);
    this.subElements.input.removeEventListener('click', this.onInputPointerDown);
    document.removeEventListener('click', this.onDocumentPointerDown, true);
  }

  onDocumentPointerDown = event => {
    const el = event.target.closest('.rangepicker');

    if (!el && this.isOpen) {
      this.toggleIsOpen();
    }
  }

  onSelectorPointerDown = event => {
    const el = event.target;

    if (el.dataset.value) {
      this.updateRangeSelection(el);
    }
  }

  onControlPointerDown = event => {
    const el = event.target;

    if (el.dataset.element) {
      this.updateCalendar(el.dataset.element);
    }
  }

  updateCalendar(direction) {
    const [month1, month2] = this.months;

    if (direction === 'prev') {
      const prevDate = this.getPrevMonth(month1.date);
      const newMonth = this.createMonth(prevDate);
      this.months = [newMonth, month1];
    }

    if (direction === 'next') {
      const nextDate = this.getNextMonth(month2.date);
      const newMonth = this.createMonth(nextDate);
      this.months = [month2, newMonth];
    }

    this.renderSelector();
  }

  renderSelector() {
    this.subElements.selector.innerHTML = this.getCalendar();
    this.createRefs(this.subElements.selector);
    this.subElements.prev.addEventListener('click', this.onControlPointerDown);
    this.subElements.next.addEventListener('click', this.onControlPointerDown);
  }

  updateRangeSelection(el) {
    const timestamp = el.dataset.value;
    const date = new Date(timestamp);

    this.selectedCount = this.selectedCount + 1;

    if (this.selectedCount > 2) {
      this.selectedCount = 1;
    }

    if (this.selectedCount === 1) {
      this.setRange(date);
      const buttons = this.subElements.selector.querySelectorAll('.rangepicker__cell');
      buttons.forEach(el => {
        [
          'rangepicker__selected-from',
          'rangepicker__selected-to',
          'rangepicker__selected-between',
        ].forEach(className => el.classList.remove(className));
      });
      el.classList.add('rangepicker__selected-from');
    }

    if (this.selectedCount === 2) {
      this.setRange(this.range.from, date);
      this.renderSelector();
      this.subElements.input.innerHTML = this.getInput();
      this.toggleIsOpen();
      this.selectedCount = 0;
      this.element.dispatchEvent(new CustomEvent('date-select', {
        bubbles: true,
        detail: { ...this.range },
      }));
    }
  }

  onInputPointerDown = () => {
    if (!this.calendarRendered) {
      this.renderSelector();
      this.calendarRendered = true;
    }

    this.toggleIsOpen();
  }

  toggleIsOpen() {
    if (this.isOpen) {
      this.element.classList.remove('rangepicker_open');
    } else {
      this.element.classList.add('rangepicker_open');
    }

    this.isOpen = !this.isOpen;
  }

  getPrevMonth(date) {
    let year = date.getFullYear();
    let month = date.getMonth() - 1;

    if (month < 0) {
      year = year - 1;
      month = 11;
    }

    return new Date(year, month);
  }

  getNextMonth(date) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;

    if (month > 11) {
      year = year + 1;
      month = 0;
    }

    return new Date(year, month);
  }

  render() {
    const el = document.createElement('div');
    el.innerHTML = this.getTemplate();
    this.element = el.firstElementChild;
    this.createRefs(this.element);
  }

  createRefs(html) {
    [...html.querySelectorAll('[data-element]')].forEach(el => {
      this.subElements[el.dataset.element] = el;
    });
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.unbindEvents();
    this.remove();
  }

  getInput() {
    return `
      <span data-element="from">${formatDate(this.range.from)}</span> -
      <span data-element="to">${formatDate(this.range.to)}</span>
    `;
  }

  getCalendar() {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left" data-element="prev"></div>
      <div class="rangepicker__selector-control-right" data-element="next"></div>
      <div class="rangepicker__calendar">
        ${this.getMonth(this.months[0])}
      </div>
      <div class="rangepicker__calendar">
        ${this.getMonth(this.months[1])}
      </div>
    `;
  }

  getMonth(month) {
    return `
      <div class="rangepicker__month-indicator">
        <time datetime="${month.title}">${month.title}</time>
      </div>
      <div class="rangepicker__day-of-week">
        ${this.getWeekdays()}
      </div>
      <div class="rangepicker__date-grid">
        ${this.getMonthDates(month.date)}
      </div>
    `;
  }

  getWeekdays() {
    return WEEKDAYS.map(str => `<div>${str}</div>`).join('');
  }

  getMonthDates(date) {
    const last = getLastDateInMonth(date);
    const arr = [];

    let i = 1;
    while (i <= last) {
      arr.push(this.getDateButton(date, i));
      i = i + 1;
    }

    return arr.join('');
  }

  getDateButton(date, i) {
    const buttonDate = new Date(date.getFullYear(), date.getMonth(), i);
    const buttonDateISOstring = getDateISOString(date, i);

    return `<button
        type="button"
        class="${this.getButtonClasses(buttonDate)}"
        data-value="${buttonDateISOstring}"
        ${i === 1 ? `style="--start-from: ${buttonDate.getDay()}"` : ''}
      >${i}</button>`;
  }

  getButtonClasses(date) {
    const from = getDateTime(this.range.from);
    const to = getDateTime(this.range.to);
    const current = getDateTime(date);
    const classes = ['rangepicker__cell'];

    if (current === from) {
      classes.push('rangepicker__selected-from');
    }

    if (current === to) {
      classes.push('rangepicker__selected-to');
    }

    if (current > from && current < to) {
      classes.push('rangepicker__selected-between');
    }

    return classes.join(' ');
  }

  setRange(date1, date2) {
    const from = date1 || date2;
    const to = date2 || date1;
    const fromTime = getDateTime(from);
    const toTime = getDateTime(to);

    if (fromTime <= toTime) {
      this.range = { from, to };
    } else {
      this.range = { from: to, to: from };
    }
  }

  setMonths(date1, date2) {
    this.months = [
      this.createMonth(date1),
      this.createMonth(date2),
    ];
  }

  createMonth(date) {
    return {
      date: new Date(date.getFullYear(), date.getMonth()),
      title: MONTHS[date.getMonth()],
    };
  }
}
