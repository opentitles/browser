import puppeteer from 'puppeteer';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import { cookieClicker } from './cookieClicker';
import { findTitleElement } from './findTitleElement';
import * as CONFIG from '../config';

const clog = new Clog();
let browser: puppeteer.Browser;
let page: puppeteer.Page;

export const browserInit = async (): Promise<void> => {
  browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });
  page = (await browser.pages())[0];
  await page.setUserAgent(CONFIG.USER_AGENT || 'GoogleBot');
  clog.log('Initiated browser', LOGLEVEL.DEBUG);
  return;
}

export const titleFetch = async (article: Article, medium: MediumDefinition): Promise<string | undefined> => {
  const link: string = article.link || article.guid;

  try {
    await page.goto(link, {
      timeout: 5000
    });

    // Bypass any cookiewalls
    await cookieClicker(page, medium);

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

    // Sanity check
    if (title.length < 3) {
      return;
    }

    clog.log(`Got title <<${title}>> on ${article.org}:${article.articleID}`, LOGLEVEL.DEBUG);

    // Wait for a while so we don't DOS the medium
    const max = 4500, min = 2500;
    const wait =  Math.floor(Math.random() * (max - min + 1) + min);
    await page.waitForTimeout(wait);

    return title;
  } catch (e) {
    clog.log(`Could not fetch title at ${link}: ${e}`, LOGLEVEL.ERROR)
    return;
  }
}