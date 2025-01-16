export class View {
  constructor(selector) {
    this.selector = selector;
  }

  get target() {
    return document.querySelector(this.selector);
  }

  hide() {
    this.target.style.display = "none";
  }

  show() {
    this.target.style.display = "block";
  }

  static create(selector) {
    return new View(selector);
  }
}
