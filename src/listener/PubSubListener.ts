import amqp from 'amqplib/callback_api';
import { Clog, LOGLEVEL } from '@fdebijl/clog';

import * as CONFIG from '../config';
import { Listener } from './Listener';

export class PubSubListener implements Listener {
  private clog: Clog;

  constructor() {
    this.clog = new Clog();
  }

  private async connectToMQ(): Promise<amqp.Channel> {
    return new Promise((resolve) => {
      if (!CONFIG.RABBITMQ_URL) {
        throw new Error('RABBITMQ_URL was not defined in the environment variables, could not connect to message exchange.');
      }

      amqp.connect(CONFIG.RABBITMQ_URL, (error0, connection) => {
        if (error0) {
          this.clog.log(error0, LOGLEVEL.ERROR);
          throw error0;
        }

        connection.createChannel((error1, channel) => {
          if (error1) {
            this.clog.log(error1, LOGLEVEL.ERROR);
            throw error1;
          }

          this.clog.log(`Succesfully connected to RabbitMQ`, LOGLEVEL.DEBUG);

          resolve(channel);
        });
      });
    });
  }

  async init(callback: (article: Article, medium: MediumDefinition) => Promise<void>): Promise<void> {
    const channel: amqp.Channel = await this.connectToMQ();

    const queueName = 'opentitles_work'

    channel.assertQueue(queueName, {
      durable: true
    }, (err, queue) => {
      if (!err) {
        this.clog.log(`Started listening for jobs on queue '${queueName}'${queue ? `, current queue length is ${queue.messageCount} with ${queue.consumerCount} consumers` : ``}`);
      }
    });

    channel.prefetch(Number.parseInt((CONFIG.PREFETCH as string) ?? '2'));
    channel.consume(queueName, (msg) => {
      if (!msg) {
        return;
      }

      const { article, medium } = JSON.parse(msg.content.toString());
      callback(article, medium).then(() => {
        channel.ack(msg);
      });
    }, {
      noAck: false
    });
  }
}