/**
 * 数据模型 - Match 比赛系统
 */
const MatchLevel = {
  JUNIOR: { name: '青少年赛', prize: 10000, points: 10 },
  FUTURES: { name: '未来赛', prize: 500, points: 50 },
  CHALLENGER: { name: '挑战赛', prize: 1500, points: 150 },
  ATP250: { name: 'ATP250', prize: 5000, points: 500 },
  ATP500: { name: 'ATP500', prize: 10000, points: 1000 },
  ATP1000: { name: '大师赛', prize: 20000, points: 2000 },
  GRAND_SLAM: { name: '大满贯', prize: 50000, points: 5000 },
  TOUR_FINALS: { name: '年终总决赛', prize: 100000, points: 10000 },
  OLYMPICS: { name: '奥运会', prize: 30000, points: 3000 }
};

class Match {
  static getAvailableMatches(player) {
    const matches = [];

    if (player.age <= 18) {
      matches.push({
        id: 'J1',
        name: '青少年锦标赛',
        level: MatchLevel.JUNIOR,
        entryCost: 0,
        minSkill: 20
      });
    }

    if (player.ranking <= 500 || player.age >= 16) {
      matches.push({
        id: 'F1',
        name: '未来赛',
        level: MatchLevel.FUTURES,
        entryCost: 100,
        minSkill: 30
      });
    }

    if (player.ranking <= 200 || player.age >= 18) {
      matches.push({
        id: 'C1',
        name: '挑战赛',
        level: MatchLevel.CHALLENGER,
        entryCost: 200,
        minSkill: 40
      });
    }

    if (player.ranking <= 100 || player.age >= 19) {
      matches.push({
        id: '250',
        name: 'ATP250巡回赛',
        level: MatchLevel.ATP250,
        entryCost: 300,
        minSkill: 50
      });
    }

    if (player.ranking <= 50 || player.age >= 20) {
      matches.push({
        id: '500',
        name: 'ATP500巡回赛',
        level: MatchLevel.ATP500,
        entryCost: 500,
        minSkill: 60
      });
    }

    if (player.ranking <= 20 || player.age >= 21) {
      matches.push({
        id: '1000',
        name: 'ATP1000大师赛',
        level: MatchLevel.ATP1000,
        entryCost: 800,
        minSkill: 70
      });
    }

    if (player.ranking <= 10 || player.age >= 21) {
      matches.push({
        id: 'GS',
        name: '大满贯赛事',
        level: MatchLevel.GRAND_SLAM,
        entryCost: 1000,
        minSkill: 75
      });
    }

    return matches;
  }

  static simulateMatch(player, matchInfo) {
    if (player.money < matchInfo.entryCost) {
      return { success: false, message: '资金不足，无法支付报名费' };
    }

    if (player.energy < 0) {
      return { success: false, message: '精力不足，无法参赛' };
    }

    if (player.calculateOverall() < matchInfo.minSkill) {
      return { success: false, message: '能力不足，建议先训练提升' };
    }

    player.money -= matchInfo.entryCost;
    player.energy -= 40;
    player.matchesPlayed += 1;

    const playerOverall = player.calculateOverall();
    const formAdjustment = player.getFormAdjustment();
    const playerMatchSkill = playerOverall * formAdjustment;

    const baseOpponentSkill = matchInfo.minSkill + Math.floor(Math.random() * 21) + 10;
    const opponentSkill = baseOpponentSkill + Math.floor(Math.random() * 21) - 10;

    const skillDiff = playerMatchSkill - opponentSkill;
    let winProbability = 50 + skillDiff;
    winProbability += Math.floor(Math.random() * 31) - 15;
    winProbability = Math.max(5, Math.min(95, winProbability));

    const playerWins = Math.random() * 100 < winProbability;

    const result = {
      success: true,
      playerWins: playerWins,
      playerSkill: playerMatchSkill,
      opponentSkill: opponentSkill,
      winProbability: winProbability,
      matchName: matchInfo.name
    };

    if (playerWins) {
      let prizeMoney = matchInfo.level.prize;
      const rankingPoints = matchInfo.level.points;

      let prizeMultiplier = 1.0;
      if (player.form >= 80) {
        prizeMultiplier = 1.2;
      } else if (player.form <= 30) {
        prizeMultiplier = 0.8;
      }

      prizeMoney = Math.floor(prizeMoney * prizeMultiplier);

      player.money += prizeMoney;
      player.careerEarnings += prizeMoney;
      player.updateRanking(rankingPoints);
      player.matchesWon += 1;

      if (matchInfo.level === MatchLevel.GRAND_SLAM) {
        player.grandSlams += 1;
        player.titles += 1;
        result.title = '大满贯冠军';
      } else if (Math.random() < 0.3) {
        player.titles += 1;
        result.title = '冠军';
      }

      result.prizeMoney = prizeMoney;
      result.rankingPoints = rankingPoints;
      player.form = Math.min(100, player.form + Math.floor(Math.random() * 11) + 5);

      const currentBestPoints = this.getBestResultPoints(player.bestResult);
      if (matchInfo.level.points > currentBestPoints) {
        player.bestResult = matchInfo.level.name;
      }
    } else {
      player.form = Math.max(10, player.form - (Math.floor(Math.random() * 11) + 5));
      result.prizeMoney = 0;
      result.rankingPoints = 0;
    }

    player.addFatigue(Math.floor(Math.random() * 21) + 20);

    return result;
  }

  static getBestResultPoints(bestResult) {
    for (const [key, level] of Object.entries(MatchLevel)) {
      if (level.name === bestResult || key === bestResult) {
        return level.points;
      }
    }
    return 0;
  }
}

module.exports = { Match, MatchLevel };
