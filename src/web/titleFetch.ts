import puppeteer from 'puppeteer';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import { Webconfig } from './Webconfig';

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
    const start = Date.now();

    page.goto(link, {
      timeout: 0
    });

    const titleElement = await Promise.race(
      medium.title_query.map(
        selector => page.waitForSelector(selector, {
          timeout: webconfig.timeout
        })
      )
    );

    // Ensure we wait at least length of webconfig.cooldown before going to the next page
    const end = Date.now();
    if (end - start < webconfig.cooldown) {
      await page.waitForTimeout(webconfig.cooldown - (end - start));
    }

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