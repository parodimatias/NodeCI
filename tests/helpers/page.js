const puppeteer = require("puppeteer");
const sessionsFactory = require("../factores/sessionsFactory");
const userFactory = require("../factores/userFactory");

class CustomPage {
	static async build() {
		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox"],
		});

		const page = await browser.newPage();

		const customPage = new CustomPage(page);

		return new Proxy(customPage, {
			get: function (target, property) {
				return target[property] || browser[property] || page[property];
			},
		});
	}

	constructor(page) {
		this.page = page;
	}
	async login() {
		const user = await userFactory();
		const { session, sig } = sessionsFactory(user);

		await this.page.setCookie({ name: "session", value: session });
		await this.page.setCookie({ name: "session.sig", value: sig });
		await this.page.goto("http://localhost:3000/blogs");
		await this.page.waitFor('a[href="/auth/logout"]');
	}
	async getContentsOf(selector) {
		return await this.page.$eval(selector, (el) => el.innerHTML);
	}

	post(path, data) {
		return this.page.evaluate(
			async (_path, _data) => {
				return fetch(_path, {
					method: "POST",
					credentials: "same-origin",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(_data),
				}).then((res) => res.json());
			},
			path,
			data
		);
	}

	get(path) {
		return this.page.evaluate(async (_path) => {
			return fetch(_path, {
				method: "GET",
				credentials: "same-origin",
				headers: {
					"Content-Type": "application/json",
				},
			}).then((res) => res.json());
		}, path);
	}

	execRequests(actions) {
		return Promise.all(
			actions.map(({ method, path, data }) => {
				return this[method](path, data);
			})
		);
	}
}

module.exports = CustomPage;
