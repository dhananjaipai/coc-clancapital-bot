import sleep from "./utils/sleep.mjs";
import { Op } from "sequelize";
import { sequelize, Member, Record } from "./db/index.mjs";
import CoCAPI from "./utils/coc.mjs";
import { bot, message } from "./utils/telegram.mjs";
import dotenv from 'dotenv'
dotenv.config()

let Members;
const loadTrackedMembers = () => {
  return Member.findAll({
    attributes: ["tag", "main", "name", "donated", "looted"],
  }).then((result) =>
    result.reduce((acc, { dataValues }) => {
      if (acc[dataValues.tag] == null) acc[dataValues.tag] = dataValues;
      return acc;
    }, {})
  );
};

const syncAllClanMembers = async (clanTag) => {
  try {
    const response = await CoCAPI.fetchClanInfo(clanTag);
    const data = await response.json();
    const newMembers = data?.items
      .filter(({ tag }) => Members[tag] == null)
      .map(({ tag, name }) => {
        Members[tag] = {
          tag,
          name,
          main: tag,
        };
        return Members[tag];
      });
    if (newMembers.length != 0) {
      await Member.bulkCreate(newMembers);
      return `Added users - ${newMembers.map((x) => x.name).join(", ")}`;
    } else {
      return `All users already being tracked in clan - ${clanTag}`;
    }
  } catch (e) {
    console.log(new Date(), "Exception", e);
  }
};
const trackMember = async (memberTag) => {
  try {
    const response = await CoCAPI.fetchPlayerInfo(memberTag);
    const data = await response.json();
    const achievement_values = data?.achievements?.reduce((acc, x) => {
      if (acc[x.name] == null) acc[x.name] = x.value;
      return acc;
    }, {});
    const _Member = {
      tag: memberTag,
      name: data.name,
      main: memberTag,
      donated: Number(achievement_values["Most Valuable Clanmate"]),
      looted: Number(achievement_values["Aggressive Capitalism"]),
    };
    if (Members[memberTag] == null) {
      Members[memberTag] = _Member;
    }
    const [_, created] = await Member.findOrCreate({
      where: {
        tag: memberTag,
      },
      defaults: _Member,
    });
    if (created) return `New member added for tag - ${memberTag}`;
    return `Member already exists for tag - ${memberTag} `;
  } catch (e) {
    console.error(e);
    return `Member not added. Check for errors`;
  }
};
const unTrackMember = async (memberTag) => {
  try {
    await Member.destroy({
      where: {
        tag: memberTag,
      },
    });
    delete Members[memberTag];
    return `Member removed for tag - ${memberTag}`;
  } catch (e) {
    console.error(`Error removing member - ${memberTag}`, e);
    return `Member not removed. Check for errors`;
  }
};
const markMainTag = async (memberTag, mainTag) => {
  try {
    await Member.update(
      {
        main: mainTag,
      },
      {
        where: { tag: memberTag },
      }
    );
    return `Main account updated for tag - ${memberTag} to ${mainTag}`;
  } catch (e) {
    console.error(e);
    return `Not updated. Check for errors`;
  }
};

const recordDonation = async (tag, clan, donated) => {
  const donation = donated - Number(Members[tag].donated);
  const { id } = await Record.create({
    tag,
    name: Members[tag].name,
    clan,
    type: "donation",
    amount: donation,
  });
  await Member.update({ donated }, { where: { tag } });
  message(`[${id}] | ${Members[tag].name} donated ${donation} to ${clan}`);
  Members[tag].donated = donated;
};
const recordLoot = async (tag, clan, looted) => {
  const loot = looted - Number(Members[tag].looted);
  const { id } = await Record.create({
    tag,
    name: Members[tag].name,
    clan,
    type: "loot",
    amount: loot,
  });
  await Member.update({ looted }, { where: { tag } });
  message(`[${id}] | ${Members[tag].name} looted ${loot} from ${clan}`);
  Members[tag].looted = looted;
};
const trackLoop = async () => {
  await syncAllClanMembers("#PP0YPJL2"); // Track Fight Club CET
  await Promise.all(
    Object.keys(Members).map(async (memberTag) => {
      const response = await CoCAPI.fetchPlayerInfo(memberTag);
      const data = await response.json();
      const achievement_values = data?.achievements?.reduce((acc, x) => {
        if (acc[x.name] == null) acc[x.name] = x.value;
        return acc;
      }, {});
      if (achievement_values == undefined) return;
      let clan = data?.clan?.name;
      let donated = Number(achievement_values["Most Valuable Clanmate"]);
      let looted = Number(achievement_values["Aggressive Capitalism"]);
      if (
        Members[memberTag].donated == undefined ||
        Number(Members[memberTag].donated) == 0
      ) {
        Members[memberTag].donated = donated;
        await Member.update({ donated }, { where: { tag: memberTag } });
      }
      if (
        Members[memberTag].looted == undefined ||
        Number(Members[memberTag].looted) == 0
      ) {
        Members[memberTag].looted = looted;
        await Member.update({ looted }, { where: { tag: memberTag } });
      }
      if (Number(Members[memberTag].donated) != donated) {
        await recordDonation(memberTag, clan, donated);
      }
      if (Number(Members[memberTag].looted) != looted) {
        await recordLoot(memberTag, clan, looted);
      }
    })
  );
};

const searchMember = async (name) => {
  try {
    const tag = await Member.findOne({ where: { name } }).then(
      (res) => res?.dataValues?.tag
    );
    if (tag != undefined) return `Name - ${name}, Tag - ${tag}`;
    return `User not being tracked.`;
  } catch (e) {
    console.error(e);
    return `User not found. Check for errors`;
  }
};
const fixRecord = async (id, clan) => {
  try {
    const [success] = await Record.update({ clan }, { where: { id } });
    if (success) return `Record [${id}] updated to Clan - ${clan}`;
    return `Record not updated. Check for errors`;
  } catch (e) {
    console.error(e);
    return `Record not updated. Check for errors`;
  }
};

const loadPlayerContribution = async (input) => {
  try {
    let MESSAGE = "";
    let tag;
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    if (input[0] == "#") {
      tag = input;
    } else {
      tag = await Member.findOne({ where: { name: input } }).then(
        (res) => res?.dataValues?.tag
      );
    }
    if (tag == undefined) {
      return "User not being tracked.";
    }

    MESSAGE += "\n\n<i>ALL ACCOUNTS</i>\n";
    MESSAGE += "------------------\n";
    const accounts = await Member.findAll({
      attributes: ["tag", "name"],
      where: {
        main: tag,
      },
    }).then((res) =>
      res.reduce((acc, { dataValues: { tag, name } }) => {
        acc[tag] = name;
        return acc;
      }, {})
    );
    MESSAGE += Object.values(accounts).join(", ");

    MESSAGE += "\n\n<i>TOTAL DONATIONS (LAST 7 DAYS)</i>\n";
    MESSAGE += "------------------\n";
    MESSAGE += await Record.findAll({
      attributes: [
        "clan",
        [sequelize.fn("SUM", sequelize.col("amount")), "donation"],
      ],
      where: {
        type: "donation",
        tag: Object.keys(accounts),
        time: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      group: "clan",
    }).then((res) =>
      res
        .reduce((acc, { dataValues: { clan, donation } }) => {
          acc.push(`${clan} - ${donation}`);
          return acc;
        }, [])
        .join("\n")
    );

    MESSAGE += "\n\n<i>TOTAL LOOT (LAST 7 DAYS)</i>\n";
    MESSAGE += "------------------\n";
    MESSAGE += await Record.findAll({
      attributes: [
        "clan",
        [sequelize.fn("SUM", sequelize.col("amount")), "loot"],
      ],
      where: {
        type: "loot",
        tag: Object.keys(accounts),
        time: {
          [Op.gte]: sevenDaysAgo,
        },
      },
      group: "clan",
    }).then((res) =>
      res
        .reduce((acc, { dataValues: { clan, loot } }) => {
          acc.push(`${clan} - ${loot}`);
          return acc;
        }, [])
        .join("\n")
    );
    return MESSAGE;
  } catch (e) {
    console.error(e);
    return `Check for errors`;
  }
};

bot.command("help", (ctx) =>
  ctx.replyWithHTML(`
/search <i>&lt;name&gt;</i> - get tag of tracked player
/track <i>&lt;tag&gt;</i> - track new player
/untrack <i>&lt;tag&gt;</i> - remove tracked player
/sync <i>&lt;clan_tag&gt;</i> - track all players in a clan
/link <i>&lt;mini_tag&gt;</i> <i>&lt;main_tag&gt;</i> - link mini accounts with main account
/fix <i>&lt;record_id&gt;</i> <i>&lt;clan_name&gt;</i> - fix record with id and clan name
/show <i>&lt;tag&gt;</i> - show overall contribution of player and minis
`)
);
bot.hears(/\/search (.*)/, async (ctx) => {
  const name = ctx.match[1];
  const response = await searchMember(name);
  ctx.replyWithMarkdown(response);
});
bot.hears(/\/track (#.*)/, async (ctx) => {
  const tag = ctx.match[1];
  const response = await trackMember(tag);
  ctx.replyWithMarkdown(response);
});
bot.hears(/\/untrack (#.*)/, async (ctx) => {
  const tag = ctx.match[1];
  const response = await unTrackMember(tag);
  ctx.replyWithMarkdown(response);
});
bot.hears(/\/sync (#.*)/, async (ctx) => {
  const tag = ctx.match[1];
  const response = await syncAllClanMembers(tag);
  ctx.reply(response);
});
bot.hears(/\/link (#.*) (#.*)/, async (ctx) => {
  const mini = ctx.match[1];
  const main = ctx.match[2];
  const response = await markMainTag(mini, main);
  ctx.replyWithMarkdown(response);
});
bot.hears(/\/fix (\d*) (.*)/, async (ctx) => {
  const id = ctx.match[1];
  const clan = ctx.match[2];
  const response = await fixRecord(id, clan);
  ctx.replyWithMarkdown(response);
});
bot.hears(/\/show (.*)/, async (ctx) => {
  const input = ctx.match[1];
  const response = await loadPlayerContribution(input);
  ctx.replyWithHTML(response);
});

// bot.use(Telegraf.log());
Members = await loadTrackedMembers();
while (true) {
  console.log(new Date(), "START");
  try {
    await trackLoop();
  } catch (e) {
    console.log(new Date(), "Exception", e);
  }
  console.log(new Date(), "END");
  await sleep(60000);
}
