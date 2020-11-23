import puppeteer from 'puppeteer';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import * as CONFIG from '../config';
import { cookieClicker } from './cookieClicker';
import { findTitleElement } from './findTitleElement';
import { Webconfig } from './WebConfig';

const clog = new Clog();
let browser: puppeteer.Browser;
let page: puppeteer.Page;

export const browserInit = async (): Promise<void> => {
  browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
  });
  page = (await browser.pages())[0];
  clog.log('Initiated browser', LOGLEVEL.DEBUG);
  return;
}

export const titleFetch = async (article: Article, medium: MediumDefinition): Promise<string | undefined> => {
  const link: string = article.link || article.guid;

  const webconfig = new Webconfig(medium);
  await page.setUserAgent(webconfig.userAgent);

  try {
    await page.goto(link, {
      timeout: parseInt(CONFIG.DEFAULT_TIMEOUT as string)
    });

    // Bypass any cookiewalls
    await cookieClicker(page, medium);

    if (webconfig.cooldown > 0) {
      // Prevent accidental DoS and getting blocked
      await page.waitForTimeout(webconfig.cooldown);
    }

    // Verify title is present on page and matches that from the RSS feed
    const titleElement = await findTitleElement(medium, page);
    if (!titleElement) {
      clog.log(`Could not find title element at ${link}`, LOGLEVEL.WARN);
      return;
    }

    // eslint-disable-next-line
    // @ts-ignore only used in browser
    let title = await page.evaluate(titleElement => titleElement.textContent, titleElement);

    // Remove whitespace, linebreaks and carriage returns
    title = title.trim();
    title = title.replace(/\r?\n|\r/g, '');

    // Sanity check - empty titles are probably an error
    if (title.length < 3) {
      return;
    }

    clog.log(`Got title <<${title}>> on ${article.org}:${article.articleID}`, LOGLEVEL.DEBUG);

    return title;
  } catch (e) {
    clog.log(`Could not fetch title at ${link}: ${e}`, LOGLEVEL.ERROR)
    return;
  }
}