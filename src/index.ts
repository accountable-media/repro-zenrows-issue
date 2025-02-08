import puppeteer, { Browser } from '@cloudflare/puppeteer';
import { WorkerEntrypoint } from 'cloudflare:workers';

export interface Env {
	ZENROWS_API_KEY?: string;
}

export default class BrowserService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
	}

	getZRImpl(): Promise<Browser> {
		return puppeteer
			.connect({
				browserWSEndpoint: `wss://browser.zenrows.com?apikey=${this.env.ZENROWS_API_KEY}`,
				protocolTimeout: 180_000,
			})
			.catch((e: Error) => {
				console.error('could not load ZR browser', e.message);
				throw e;
			});
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);


		if (url.pathname == '/test') {
			return this
				.getZRImpl()
				.then(b => {
					b.close()
					return new Response('browser acquired successfully');
				})
				.catch(e => {
					return new Response(`browser acquisition failed: ${e.message}`);
				})
		}

		return new Response('invalid path: ' + url.pathname)
	}
}

