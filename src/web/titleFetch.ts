import puppeteer from 'puppeteer';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import { cookieClicker } from './cookieClicker';
import { findTitleElement } from './findTitleElement';
import * as CONFIG from '../config';

const clog = new Clog();
let browser: puppeteer.Browser;
let page: puppeteer.Page;

(async () => {
  browser = await puppeteer.launch({
    headless: false
  });
  page = (await browser.pages())[0];
  await page.setUserAgent(CONFIG.USER_AGENT || 'GoogleBot');
})();

export const titleFetch = async (article: Article, medium: MediumDefinition): Promise<string | undefined> => {
  const link: string = article.link || article.guid;

  try {
    await page.goto(link, {
      timeout: 4000
    });

    // Bypass any cookiewalls
    await cookieClicker(page, medium);

    // Verify title is present on page and matches that from the RSS feed
    const titleElement = await findTitleElement(medium, page);
    let title = await page.evaluate(titleElement => titleElement.textContent, titleElement);
    // Wait for half a second so we don't DOS the medium
    await page.waitForTimeout(500);

    // Remove whitespace, linebreaks and carriage returns
    title = title.trim();
    title = title.replace(/\r?\n|\r/g, '');

    clog.log(`Got title <<${title}>> on ${article.org}:${article.articleID}`, LOGLEVEL.DEBUG);

    return title;
  } catch (e) {
    clog.log(`Could not connect to ${link}`, LOGLEVEL.ERROR)
    return;
  }
}