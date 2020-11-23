import { time } from 'console';
import * as CONFIG from '../config';

export class Webconfig {
  public cooldown: number;
  public timeout: number;
  public userAgent: string;

  constructor(medium: MediumDefinition) {
    const { cooldown, timeout, userAgent } = this.lookup(medium.name);
    this.cooldown = cooldown;
    this.timeout = timeout;
    this.userAgent = userAgent;
  }

  private lookup(mediumName: string): { cooldown: number; timeout: number; userAgent: string } {
    switch (mediumName) {
      case 'Tweakers': {
        return {
          cooldown: 5000,
          timeout: parseInt(CONFIG.DEFAULT_TIMEOUT as string),
          userAgent: CONFIG.DEFAULT_USER_AGENT as string
        }
      }
      case 'Telegraaf': {
        return {
          cooldown: 1000,
          timeout: parseInt(CONFIG.DEFAULT_TIMEOUT as string),
          userAgent: CONFIG.REAL_USER_AGENT as string
        }
      }
      case 'Newsweek': {
        return {
          cooldown: 1000,
          timeout: 10000,
          userAgent: CONFIG.REAL_USER_AGENT as string
        }
      }
      default: {
        return {
          cooldown: parseInt(CONFIG.DEFAULT_COOLDOWN as string),
          timeout: parseInt(CONFIG.DEFAULT_TIMEOUT as string),
          userAgent: CONFIG.DEFAULT_USER_AGENT as string
        }
      }
    }
  }
}