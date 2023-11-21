require('dotenv').config();

const {
  Telegraf,
  Markup,
  session,
  Scenes: { BaseScene, Stage },
} = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const { message } = require('telegraf/filters');
const bot = new Telegraf(BOT_TOKEN);
const {
  saveUserData,
  checkid,
  getData,
  getUserID,
  UpdateClsPerson,
  UpdateQuarterPerson,
  getDataPerson,
  delusr,
  saveUserDataPerson,
  delusrPerson,
  UpdateHoursPerson,
  UpdateMarksPerson,
} = require('./DATABASE.js');
const { sleep, compressText, decompressText } = require('./functions.js');
const {
  checkusr,
  getMarks,
  getTHEMarks,
  parseSchedule,
} = require('./index.js');
const schedule = require('node-schedule');
const { lessonsGoals } = require('./objects.js');

const MY_ID = process.env.MY_ID;

let lessonGoal;
let managesgMarkup;
let sum = 0;
let count = -1;
let marksAdded;
let ctx2;
let maxCls;

const loginScene = new BaseScene('loginScene');
loginScene.enter((ctx) => {
  ctx.reply('Enter your login and password separated by a space');
});

loginScene.on(message('text'), async (ctx) => {
  ctx2 = ctx;
  const msg = ctx.message.text;
  if (msg[0] === '/') {
    if (/^\/(?:d|e|l|t|u|s|r)+$/.test(msg)) {
      try {
        await delusr(ctx.from.id);
        await delusrPerson(ctx.from.id);
        const res = 'Your account is succesfully deleted';
        ctx.reply(res);
      } catch (error) {
        const res = 'Error... Try later';
        ctx.reply(res);
        console.log(`if (/^\/(?:d|e|l|t|u|s|r)+$/.test(msg)) {, ${error}`);
      }
    }

    if (msg === '/doc') {
      const doc =
        '/doc - show doc `https://github.com/YanVolynets/Schools.by/blob/master/botdocumentation.txt` \n /delusr - delete account \n /start - start or start again \n /schedule - show lessons and homework';
      ctx.reply(doc);
    } else {
      await sleep(1000);
      ctx.scene.leave();
      ctx.scene.enter('loginScene');
    }
  } else {
    ctx.session.logged = true;

    const saveData = Markup.inlineKeyboard([
      Markup.button.callback('Yes(wait about 1 minute)', 'Yes_data'),
    ]);
    ctx.reply('Save DATA?', saveData);

    bot.action('Yes_data', async (ctx) => {
      const login = ctx2.message.text.split(' ')[0];
      const password = ctx2.message.text.split(' ')[1];
      try {
        maxCls = await checkusr(login, password);
        try {
          await saveUserDataPerson(
            null,
            null,
            ctx2.from.id,
            null,
            null,
            maxCls
          );
          await saveUserData(login, password, ctx2.from.id);
          ctx2.reply('Data saved successfully.');
          await sleep(1000);
          ctx2.scene.leave();
          const markupfurther = Markup.inlineKeyboard([
            Markup.button.callback('Next 🚀', 'further'),
          ]);
          ctx.reply('Click to go to the next step!', markupfurther);
        } catch (error) {
          if (error.message.includes('Duplicate entry')) {
            ctx.reply('User with this data is already logged');
            await sleep(500);
            ctx2.scene.leave();
            ctx2.scene.enter('loginScene');
          } else {
            ctx.reply('Error has occurred. Try later.');
            console.log('Error saving data:', error);
            await sleep(500);
            ctx2.scene.leave();
            ctx2.scene.enter('loginScene');
          }
        }
      } catch (error) {
        setTimeout(() => {
          ctx.scene.leave();
          ctx.scene.enter('loginScene');
        }, 1000);
        console.error('loginScene.on(message(text)', error);
        ctx.reply("login or password isn't correct");
      }
    });
  }
});

const stage = new Stage([loginScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
  const id = ctx.from.id;
  if (!ctx.session.logged) {
    try {
      await checkid(id);
      const markupfurther = Markup.inlineKeyboard([
        Markup.button.callback('Next 🚀', 'further'),
      ]);
      ctx.reply('Click to go to the next step!', markupfurther);
    } catch (error) {
      if (error === null) {
        ctx.scene.enter('loginScene');
      } else {
        console.error(error);
        ctx.scene.enter('loginScene');
      }
    }
  } else {
    let [resDB2] = await getDataPerson(id);
    maxCls = resDB2.MAXCLS;
    const classKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(`Class ${maxCls}`, `c${maxCls}`),
        Markup.button.callback(`Class ${maxCls - 1}`, `c${maxCls - 1}`),
        Markup.button.callback(`Class ${maxCls - 2}`, `c${maxCls - 2}`),
      ],
      [
        Markup.button.callback(`Class ${maxCls - 3}`, `c${maxCls - 3}`),
        Markup.button.callback(`Class ${maxCls - 4}`, `c${maxCls - 4}`),
        Markup.button.callback(`Class ${maxCls - 5}`, `c${maxCls - 5}`),
      ],
    ]);

    await ctx.reply('Choose class:', classKeyboard);
  }
});

bot.hears(/^\/(?:d|e|l|t|u|s|r)+$/, async (ctx) => {
  try {
    await delusr(ctx.from.id);
    await delusrPerson(ctx.from.id);
    const res = 'Your account is succesfully deleted';
    ctx.reply(res);
    ctx.scene.enter('loginScene');
  } catch (error) {
    const res = 'Error... Try later';
    ctx.reply(res);
    console.log(
      `bot.hears(/^\/(?:d|e|l|t|u|s|r)+$/, async (ctx) => {, ${error}`
    );
  }
});

bot.hears('/doc', async (ctx) => {
  const doc =
    '/doc - show doc  `https://github.com/YanVolynets/Schools.by/blob/master/botdocumentation.txt` \n /delusr - delete account \n /start - start or start again \n /schedule - show lessons and homework';
  ctx.reply(doc);
});

bot.action('further', async (ctx) => {
  let [resDB2] = await getDataPerson(ctx.from.id);
  maxCls = resDB2.MAXCLS;
  await ctx.answerCbQuery('Ok!');
  const classKeyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback(`Class ${maxCls}`, `c${maxCls}`),
      Markup.button.callback(`Class ${maxCls - 1}`, `c${maxCls - 1}`),
      Markup.button.callback(`Class ${maxCls - 2}`, `c${maxCls - 2}`),
    ],
    [
      Markup.button.callback(`Class ${maxCls - 3}`, `c${maxCls - 3}`),
      Markup.button.callback(`Class ${maxCls - 4}`, `c${maxCls - 4}`),
      Markup.button.callback(`Class ${maxCls - 5}`, `c${maxCls - 5}`),
    ],
  ]);

  await ctx.reply('Choose class:', classKeyboard);
});

bot.action('c11', async (ctx) => {
  try {
    const cls = 11;
    await UpdateClsPerson(11, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c11', async (ctx) => {", error);
  }
});

bot.action('c10', async (ctx) => {
  try {
    const cls = 10;
    await UpdateClsPerson(10, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c10', async (ctx) => {", error);
  }
});

bot.action('c9', async (ctx) => {
  try {
    const cls = 9;
    await UpdateClsPerson(9, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c9', async (ctx) => {", error);
  }
});

bot.action('c8', async (ctx) => {
  try {
    const cls = 8;
    await UpdateClsPerson(8, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c8', async (ctx) => {", error);
  }
});
bot.action('c7', async (ctx) => {
  try {
    const cls = 7;
    await UpdateClsPerson(7, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c7', async (ctx) => {", error);
  }
});
bot.action('c6', async (ctx) => {
  try {
    const cls = 6;
    await UpdateClsPerson(6, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c6', async (ctx) => {", error);
  }
});
bot.action('c5', async (ctx) => {
  try {
    const cls = 5;
    await UpdateClsPerson(5, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c5', async (ctx) => {", error);
  }
});
bot.action('c4', async (ctx) => {
  try {
    const cls = 4;
    await UpdateClsPerson(4, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c4', async (ctx) => {", error);
  }
});
bot.action('c3', async (ctx) => {
  try {
    const cls = 3;
    await UpdateClsPerson(3, ctx.from.id);
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('c3', async (ctx) => {", error);
  }
});

bot.action('q1', async (ctx) => {
  try {
    const [resDB] = await getData(ctx.from.id);
    const [resDB2] = await getDataPerson(ctx.from.id);
    const login = resDB.LOGIN;
    const password = resDB.PASSWORD;
    const cls = resDB2.CLS;
    const quarter = 1;
    await UpdateQuarterPerson(quarter, ctx.from.id);
    let [marksSG, lessonHours] = await getMarks(cls, quarter, login, password);
    await UpdateMarksPerson(JSON.stringify(marksSG), ctx.from.id);
    await UpdateHoursPerson(JSON.stringify(lessonHours), ctx.from.id);
    const quaterKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
      ],
      [
        Markup.button.callback('Set goals', 'sg'),
        Markup.button.callback('Сhronograph', 'chron'),
      ],
      [Markup.button.callback('Back 🕒', 'backq')],
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('q1', async (ctx) => {", error);
  }
});

bot.action('q2', async (ctx) => {
  try {
    const [resDB] = await getData(ctx.from.id);
    const [resDB2] = await getDataPerson(ctx.from.id);
    const login = resDB.LOGIN;
    const password = resDB.PASSWORD;
    const cls = resDB2.CLS;
    const quarter = 2;
    await UpdateQuarterPerson(quarter, ctx.from.id);
    let [marksSG, lessonHours] = await getMarks(cls, quarter, login, password);
    await UpdateMarksPerson(JSON.stringify(marksSG), ctx.from.id);
    await UpdateHoursPerson(JSON.stringify(lessonHours), ctx.from.id);
    const quaterKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
      ],
      [
        Markup.button.callback('Set goals', 'sg'),
        Markup.button.callback('Сhronograph', 'chron'),
      ],
      [Markup.button.callback('Back 🕒', 'backq')],
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('q2', async (ctx) => {", error);
  }
});

bot.action('q3', async (ctx) => {
  try {
    const [resDB] = await getData(ctx.from.id);
    const [resDB2] = await getDataPerson(ctx.from.id);
    const login = resDB.LOGIN;
    const password = resDB.PASSWORD;
    const cls = resDB2.CLS;
    const quarter = 3;
    await UpdateQuarterPerson(quarter, ctx.from.id);
    let [marksSG, lessonHours] = await getMarks(cls, quarter, login, password);
    await UpdateMarksPerson(JSON.stringify(marksSG), ctx.from.id);
    await UpdateHoursPerson(JSON.stringify(lessonHours), ctx.from.id);
    const quaterKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
      ],
      [
        Markup.button.callback('Set goals', 'sg'),
        Markup.button.callback('Сhronograph', 'chron'),
      ],
      [Markup.button.callback('Back 🕒', 'backq')],
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('q3', async (ctx) => {", error);
  }
});

bot.action('q4', async (ctx) => {
  try {
    const [resDB] = await getData(ctx.from.id);
    const [resDB2] = await getDataPerson(ctx.from.id);
    const login = resDB.LOGIN;
    const password = resDB.PASSWORD;
    const cls = resDB2.CLS;
    const quarter = 4;
    await UpdateQuarterPerson(quarter, ctx.from.id);
    let [marksSG, lessonHours] = await getMarks(cls, quarter, login, password);
    await UpdateMarksPerson(JSON.stringify(marksSG), ctx.from.id);
    await UpdateHoursPerson(JSON.stringify(lessonHours), ctx.from.id);
    const quaterKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
      ],
      [
        Markup.button.callback('Set goals', 'sg'),
        Markup.button.callback('Сhronograph', 'chron'),
      ],
      [Markup.button.callback('Back 🕒', 'backq')],
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('q4', async (ctx) => {", error);
  }
});

bot.action('sg', async (ctx) => {
  const goalsMarkup = Markup.keyboard([
    [
      Markup.button.callback('Математика'),
      Markup.button.callback('Английский язык'),
    ],
    [
      Markup.button.callback('География'),
      Markup.button.callback('Белорусский язык'),
    ],
    [
      Markup.button.callback('Физика'),
      Markup.button.callback('Всемирная история'),
    ],
    [
      Markup.button.callback('Биология'),
      Markup.button.callback('История Беларуси'),
    ],
    [
      Markup.button.callback('Химия'),
      Markup.button.callback('Белорусская литература'),
    ],
    [
      Markup.button.callback('Русский язык'),
      Markup.button.callback('Русская литература'),
    ],
    [
      Markup.button.callback('Астрономия'),
      Markup.button.callback('Обществоведение'),
    ],
  ]);
  ctx.reply('Choose lesson:', goalsMarkup);
});

bot.action('chron', async (ctx) => {
  let [resDB] = await getDataPerson(ctx.from.id);
  try {
    let text = '';
    for (let i in JSON.parse(resDB.HOURS)) {
      if (i !== 'undefined') {
        text += `${i} hours *${
          JSON.parse(resDB.HOURS)[i]
        }*:\nBooks unread \\- ${Math.round(
          JSON.parse(resDB.HOURS)[i] / 8
        )}\\.\nSongs unheard \\- ${Math.round(
          (JSON.parse(resDB.HOURS)[i] * 60) / 3
        )}\\.\nThe basics of program lang unlearned \\- ${Math.ceil(
          JSON.parse(resDB.HOURS)[i] / 15
        )}\\.\nUncovered a distance by car \\- ${
          JSON.parse(resDB.HOURS)[i] * 100
        }\\.\nUncovered a distance by helicopter \\- ${
          JSON.parse(resDB.HOURS)[i] * 300
        }\\.\nMissed sleep \\- ${Math.ceil(
          JSON.parse(resDB.HOURS)[i] / 10
        )}\\.\n\n`;
      }
    }
    if (text) {
      ctx.replyWithMarkdownV2(text);
    } else {
      ctx.reply('Error has occured. Try later');
    }
  } catch (errro) {
    ctx.reply('Error has occured. Try later');
  }
});

bot.hears(/^\d{2}\.\d{2}\s-\s\d{2}\.\d{2}$/, async (ctx) => {
  ctx.reply('Expect');
  let formattedmarks = '';
  const bitOfQuart = ctx.message.text;
  const [resDB] = await getData(ctx.from.id);
  const [resDB2] = await getDataPerson(ctx.from.id);
  const login = resDB.LOGIN;
  const password = resDB.PASSWORD;
  const cls = resDB2.CLS;
  const sch = resDB2.SCH
  try {
    const [marks, res] = await getTHEMarks(
      cls,
      bitOfQuart,
      login,
      password,
      sch
    );
    for (let i in marks) {
      formattedmarks += `${i} ${marks[i].average.replace(
        /\./g,
        '\\.'
      )}             details: ||${marks[i].marks}|| \n`;
    }

    let firstpart = res[0].slice(5);
    let secondpart = res[res.length - 1].slice(5);
    ctx.reply(`Grades for period: ${firstpart} - ${secondpart}`);
    await sleep(1000);
    if (formattedmarks !== undefined) {
      ctx.replyWithMarkdownV2(formattedmarks);
      formattedmarks = '';
    }
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.error('bot.hears(/^d{2}.d{2}s-sd{2}.d{2}$/', error);
  }
});

bot.command('distribution', async (ctx) => {
  if (ctx.from.id == MY_ID) {
    const args = ctx.message.text.split(' ').slice(1);
    const text = args.join(' ');
    let data;
    try {
      if (text) {
        data = await getUserID();
        for (let i of data) {
          bot.telegram.sendMessage(i.USERID, text);
        }
      }
    } catch (error) {
      console.log("bot.command('distribution')", error);
    }
  }
});

bot.command('schedule', (ctx) => postShedule(ctx));

bot.on(message('text'), async (ctx) => {
  if (lessonsGoals.includes(ctx.message.text)) {
    lessonGoal = ctx.message.text;
    const markupGoal = Markup.keyboard([
      [Markup.button.callback('10'), Markup.button.callback('9')],
      [Markup.button.callback('8'), Markup.button.callback('7')],
      [Markup.button.callback('Manage it? 🤔'), Markup.button.callback('back')],
    ]);

    ctx.reply('Choose your goal:', markupGoal);
  } else if (lessonGoal && ['10', '9', '8', '7'].includes(ctx.message.text)) {
    try {
      let [resDB] = await getDataPerson(ctx.from.id);
      let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
      sum = 0;
      let sumN = 0;
      let countN = -0;
      count = -1;
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }

      while (sum / count < Number(ctx.message.text) - 0.5) {
        sumN += 10;
        sum += 10;
        count += 1;
        countN += 1;
      }

      ctx.reply(
        `To achieve goal you need: ${sumN} points using ${countN} marks. Solve this task 🧩`
      );
      sum = 0;
      count = -1;
    } catch (error) {
      ctx.reply('Error has occured. Try later');
      console.log(
        `line 395 bot.on(message('text'), async (ctx) => {: ${error}`
      );
    }
  } else if (ctx.message.text == 'back') {
    const goalsMarkup = Markup.keyboard([
      [
        Markup.button.callback('Математика'),
        Markup.button.callback('Английский язык'),
      ],
      [
        Markup.button.callback('География'),
        Markup.button.callback('Белорусский язык'),
      ],
      [
        Markup.button.callback('Физика'),
        Markup.button.callback('Всемирная история'),
      ],
      [
        Markup.button.callback('Биология'),
        Markup.button.callback('История Беларуси'),
      ],
      [
        Markup.button.callback('Химия'),
        Markup.button.callback('Белорусская литература'),
      ],
      [
        Markup.button.callback('Русский язык'),
        Markup.button.callback('Русская литература'),
      ],
      [
        Markup.button.callback('Астрономия'),
        Markup.button.callback('Обществоведение'),
      ],
    ]);
    ctx.reply('Choose lesson:', goalsMarkup);
  } else if (ctx.message.text == 'Manage it? 🤔') {
    marksAdded = '';
    managesgMarkup = Markup.inlineKeyboard([
      [
        Markup.button.callback('10', 'ten'),
        Markup.button.callback('9', 'nine'),
      ],
      [
        Markup.button.callback('8', 'eight'),
        Markup.button.callback('7', 'seven'),
      ],
      [Markup.button.callback('6', 'six'), Markup.button.callback('5', 'five')],
      [
        Markup.button.callback('4', 'four'),
        Markup.button.callback('3', 'three'),
      ],
      [Markup.button.callback('2', 'two'), Markup.button.callback('1', 'one')],
      [Markup.button.callback('0', 'deleteSG')],
      [Markup.button.callback('back', 'backmSG')],
    ]);
    ctx.reply('Add mark:', managesgMarkup);
  }
});

bot.action('ten', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '10, ';
    sum += 10;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('ten', async (ctx) => {", error);
  }
});

bot.action('nine', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '9, ';
    sum += 9;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('nine', async (ctx) => {", error);
  }
});

bot.action('eight', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '8, ';
    sum += 8;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('eight', async (ctx) => {", error);
  }
});

bot.action('seven', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '7, ';
    sum += 7;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('seven', async (ctx) => {", error);
  }
});

bot.action('six', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '6, ';
    sum += 6;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('six', async (ctx) => {", error);
  }
});

bot.action('five', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '5, ';
    sum += 5;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('five', async (ctx) => {", error);
  }
});

bot.action('four', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '4, ';
    sum += 4;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('four', async (ctx) => {", error);
  }
});

bot.action('three', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '3, ';
    sum += 3;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('three', async (ctx) => {", error);
  }
});

bot.action('two', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '2, ';
    sum += 2;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('two', async (ctx) => {", error);
  }
});

bot.action('one', async (ctx) => {
  try {
    let [resDB] = await getDataPerson(ctx.from.id);
    let marksObj = JSON.parse(resDB.MARKS)[lessonGoal].marks.split(' ');
    if (sum == 0) {
      for (let i of marksObj) {
        sum += Number(i);
        count += 1;
      }
    }
    marksAdded += '1, ';
    sum += 1;
    count += 1;

    ctx.editMessageText(
      `Now your average mark - ${(sum / count).toFixed(
        2
      )}   Added: ${marksAdded}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('one', async (ctx) => {", error);
  }
});

bot.action('backmSG', async (ctx) => {
  const markupGoal = Markup.keyboard([
    [Markup.button.callback('10'), Markup.button.callback('9')],
    [Markup.button.callback('8'), Markup.button.callback('7')],
    [Markup.button.callback('Manage it? 🤔'), Markup.button.callback('back')],
  ]);
  marksAdded = '';
  sum = 0;
  count = -1;
  ctx.reply('Choose your goal:', markupGoal);
});

bot.action('deleteSG', (ctx) => {
  try {
    marksAdded = '';
    sum = 0;
    count = -1;
    ctx.editMessageText(
      `Your mark has reseted - ${(sum / count).toFixed(2)}`,
      managesgMarkup
    );
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('deleteSG', (ctx) => {", error);
  }
});

bot.action('back', async (ctx) => {
  try {
    let [resDB2] = await getDataPerson(ctx.from.id);
    maxCls = resDB2.MAXCLS;
    await ctx.answerCbQuery('Ok!');
    const classKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(`Class ${maxCls}`, `c${maxCls}`),
        Markup.button.callback(`Class ${maxCls - 1}`, `c${maxCls - 1}`),
        Markup.button.callback(`Class ${maxCls - 2}`, `c${maxCls - 2}`),
      ],
      [
        Markup.button.callback(`Class ${maxCls - 3}`, `c${maxCls - 3}`),
        Markup.button.callback(`Class ${maxCls - 4}`, `c${maxCls - 4}`),
        Markup.button.callback(`Class ${maxCls - 5}`, `c${maxCls - 5}`),
      ],
    ]);

    await ctx.editMessageText('Choose class:', classKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('back', async (ctx) => {", error);
  }
});

// NEXT STEP

bot.action('wq', async (ctx) => {
  let [resDB] = await getDataPerson(ctx.from.id);
  let formattedmarks = '';
  try {
    for (let i in JSON.parse(resDB.MARKS)) {
      formattedmarks += `${i} ${JSON.parse(resDB.MARKS)[i].average.replace(
        /\./g,
        '\\.'
      )}             details: ||${JSON.parse(resDB.MARKS)[i].marks}|| \n`;
    }
    try {
      if (formattedmarks.length < 1) {
        throw error;
      }
      ctx.replyWithMarkdownV2(formattedmarks);
    } catch (error) {
      ctx.reply('No grades in this period');
      formattedmarks = '';
    }
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.error('bot.action(wq)', error);
  }
});

bot.action('bq', async (ctx) => {
  ctx.reply('Enter your deaposon. Example: 10.10 - 12.08');
});

bot.action('backq', async (ctx) => {
  try {
    const quatersKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('Quarter 1 (wait about 1 minute)', 'q1'),
        Markup.button.callback('Quarter 2 (wait about 1 minute)', 'q2'),
      ],
      [
        Markup.button.callback('Quarter 3 (wait about 1 minute)', 'q3'),
        Markup.button.callback('Quarter 4 (wait about 1 minute)', 'q4'),
      ],
      [Markup.button.callback('Back 🕒', 'back')],
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
  } catch (error) {
    ctx.reply('Error has occured. Try later');
    console.log("bot.action('backq', async (ctx) => {", error);
  }
});

async function postShedule(ctx) {
  let text = '';
  try {
    ctx.reply('wait about minute');

    const [resDB] = await getData(ctx.from.id);
    const [resDB2] = await getDataPerson(ctx.from.id);
    const login = resDB.LOGIN;
    const password = resDB.PASSWORD;
    maxCls = await checkusr(login, password);
    scheduleParse = await parseSchedule(login, password);
    for (let i in scheduleParse) {
      if (scheduleParse[i].value === 'недоступно') {
        text += `${scheduleParse[i].key} - your teacher did not write anything... \n \n`;
      } else {
        text += `${scheduleParse[i].key} - ${scheduleParse[i].value} \n \n`;
      }
    }

    if (text) {
      ctx.reply(text);
    } else {
      ctx.reply('Error has occured. Try later');
    }
  } catch (error) {
    if (ctx) {
      ctx.reply(
        'To get the schedule you should enter your real login and password from schools.by'
      );
    }
    sleep(1000);
    console.log('postShedule', error);
    ctx.scene.enter('loginScene');
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();
