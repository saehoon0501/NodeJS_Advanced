const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

const HOST = "http://localhost:3000";

class CustomPage {
  static async build() {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    return new Proxy(customPage, {
      get(target, property) {
        if (target[property]) {
          return target[property];
        }

        let value = browser[property];
        if (value) {
          if (value instanceof Function) {
            return (...args) => value.apply(browser, args);
          }
          return value;
        }
        value = page[property];
        if (value instanceof Function) {
          return (...args) => value.apply(page, args);
        }

        return value;
      },
    });
  }

  constructor(page) {
    this.page = page;
  }

  async login() {
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);

    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });
    await this.page.goto(HOST);
    await this.page.waitForSelector('a[href="/auth/logout"]');
  }
}

module.exports = CustomPage;
