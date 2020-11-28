import { Clog, LOGLEVEL } from '@fdebijl/clog';
import { MongoClient, Db } from 'mongodb';

import * as CONFIG from '../config';

const clog = new Clog();

export const connect = async (mongoUrl: string | undefined): Promise<{client: MongoClient; db: Db}> => {
  return new Promise((resolve, reject) => {
    if (!mongoUrl) {
      throw new Error('No MongoDB srv found in env variables (expected MONGO_URL to not be null)');
    }

    const client = new MongoClient(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      appname: 'OpenTitles Browser'
    });

    client.connect((error) => {
      if (error) {
        reject(error);
        return;
      }

      const dbname = CONFIG.isProd ? CONFIG.MONGO_DB_PROD : CONFIG.MONGO_DB_TEST;
      clog.log(`Succesfully connect to database '${dbname}'`);
      const db = client.db(dbname);

      resolve({
        client,
        db
      });
    });
  });
}