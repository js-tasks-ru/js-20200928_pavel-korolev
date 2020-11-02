export default class NotificationMessage {
  isVisible = false;

  constructor(message, { duration, type } = {}) {
    this.message = message;
    this.duration = duration;
    this.type = type;

    this.template = `
      <div class="notification ${this.type}" style="--value:${this.duration}">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.message}
          </div>
        </div>
      </div>
    `;

    this.render();
  }

  render() {
    const el = document.createElement('div');
    el.innerHTML = this.template;
    this.element = el.firstElementChild;
  }

  show(el = document.body) {
    if (this.isVisible) {
      this.isVisible = false;
      this.remove();
    }

    el.append(this.element);
    this.isVisible = true;
    this.startCountdown();
  }

  startCountdown() {
    setTimeout(() => {
      this.remove();
    }, this.duration);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
