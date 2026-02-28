/**
 * 随机事件系统
 */
const events = [
  {
    name: '伤病困扰',
    description: '你在训练中受伤，需要休息一段时间。',
    effect: (player) => {
      player.form = Math.max(10, player.form - 20);
    }
  },
  {
    name: '状态火热',
    description: '你最近状态极佳，信心爆棚。',
    effect: (player) => {
      player.form = Math.min(100, player.form + 25);
    }
  },
  {
    name: '技术突破',
    description: '你在某项技术上取得了突破。',
    effect: (player) => {
      const skills = ['forehand', 'backhand', 'serve'];
      const skill = skills[Math.floor(Math.random() * skills.length)];
      player[skill] = Math.min(100, player[skill] + 3);
    }
  },
  {
    name: '赞助邀请',
    description: '一家本地企业看中你的潜力，想提供赞助。',
    effect: (player) => {
      if (Math.random() > 0.3) {
        player.money += 200;
        return { money: 200 };
      }
      return null;
    }
  },
  {
    name: '名人指导',
    description: '一位退役名将愿意指导你，受益匪浅。',
    effect: (player) => {
      player.mentality = Math.min(100, player.mentality + 5);
    }
  }
];

const restEvents = [
  {
    description: '你在公园遇到了退役名将，他给你一些宝贵建议。心理素质+2',
    effect: (player) => {
      player.mentality = Math.min(100, player.mentality + 2);
    }
  },
  {
    description: '你观看了一场经典比赛录像，受益匪浅。技术+1',
    effect: (player) => {
      player.technique = Math.min(100, player.technique + 1);
    }
  },
  {
    description: '你进行了冥想训练，心态更加平和。心理素质+3',
    effect: (player) => {
      player.mentality = Math.min(100, player.mentality + 3);
    }
  },
  {
    description: '你和朋友进行了友谊赛，保持了比赛感觉。状态+10',
    effect: (player) => {
      player.form = Math.min(100, player.form + 10);
    }
  }
];

const yearEvents = [
  '你进行了冬训，为新赛季做准备。',
  '你参加了赛季前热身赛。',
  '你更换了新教练团队。',
  '你调整了训练计划，专注于薄弱环节。',
  '你因伤病休息了一段时间。',
  '你参加了慈善活动，提升了公众形象。'
];

class RandomEvents {
  static getRandomEvent() {
    return events[Math.floor(Math.random() * events.length)];
  }

  static getRestEvent() {
    return restEvents[Math.floor(Math.random() * restEvents.length)];
  }

  static getYearEvent() {
    return yearEvents[Math.floor(Math.random() * yearEvents.length)];
  }

  static triggerEvent(player) {
    const event = RandomEvents.getRandomEvent();
    let extraInfo = null;

    if (event.name === '赞助邀请') {
      extraInfo = event.effect(player);
    } else {
      event.effect(player);
    }

    return {
      name: event.name,
      description: event.description,
      extraInfo: extraInfo
    };
  }
}

module.exports = { RandomEvents, events, restEvents, yearEvents };
