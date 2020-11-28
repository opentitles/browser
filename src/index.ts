import { connect } from "./db/connect";
import { insertTitleToDB } from "./db/insertTitleToDB";
import { PubSubListener } from "./listener/PubSubListener";
import { NullNotifier, PubSubNotifier } from "./notifiers";
import { titleFetch, browserInit } from "./web/titleFetch";
import * as CONFIG from './config';

const init = async () => {
  const notifier = new NullNotifier();
  const listener = new PubSubListener();
  const { db } = await connect(CONFIG.MONGO_URL);

  await browserInit();

  listener.init(async (article, medium) => {
    const possibleNewTitle = await titleFetch(article, medium);

    if (possibleNewTitle) {
      await insertTitleToDB(article, possibleNewTitle, db, notifier)
    }

    return;
  })
}

init();