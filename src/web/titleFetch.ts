import puppeteer from 'puppeteer';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import { Webconfig } from './Webconfig';
import { Browser, Page } from 'puppeteer';

const clog = new Clog();
let browser: Browser;
let page: Page;
let failures = 0;
let success = 0;

export const browserInit = async (): Promise<void> => {
  browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  page = (await browser.pages())[0];

  // Disable image/css loading
  await page.setRequestInterception(true);

  page.on('request', request => {
    if (
      request.resourceType() === 'image' ||
      request.resourceType() === 'stylesheet' ||
      request.resourceType() === 'media' ||
      request.resourceType() === 'font'
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

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
      clog.log(`Could not find title element at ${link} using query '${medium.title_query}'`, LOGLEVEL.WARN);
      failures++;
      return;
    }

    // eslint-disable-next-line
    // @ts-ignore only used in browser
    let title = await page.evaluate(titleElement => titleElement.textContent, titleElement);

    // Remove whitespace, linebreaks and carriage returns
    title = title.trim();
    title = title.replace(/\r?\n|\r/g, '');

    // Sanity check - empty or very short titles are probably an error
    if (title.length < 3) {
      failures++;
      return;
    }

    clog.log(`Got title <<${title}>> on ${article.org}:${article.articleID}`, LOGLEVEL.DEBUG);
    success++;

    return title;
  } catch (e) {
    clog.log(`Could not fetch title at ${link}: ${e}. Failure rate is now ${Math.round(((failures / ((success + failures) / 100)) * 100) / 100)}%`, LOGLEVEL.ERROR)
    failures++;
    return;
  }
}