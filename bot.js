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
const { Person, Commands } = require('./classes.js');
const { saveUserData, checkid, getData, getUserID } = require('./DATABASE.js');
const { sleep, compressText, decompressText } = require('./functions.js');
const {
    checkusr,
    getMarks,
    getTHEMarks,
    parseSchedule,
} = require('./index.js');
const schedule = require('node-schedule');

const MY_ID = process.env.MY_ID;

let person;
let commands;

const loginScene = new BaseScene('loginScene');
loginScene.enter((ctx) => {
    ctx.reply('Enter your login');
});

loginScene.on(message('text'), async (ctx) => {
    const login = ctx.message.text; // LOGIN
    person.login = login;
    const msg = ctx.message.text;
    if (msg[0] === '/') {
        const regex = /^\/(?:d|e|l|t|u|s|r)+$/;
        if (regex.test(msg)) {
            try {
                const res = await commands.delusr();
                ctx.reply(res);
            } catch (error) {
                console.error(error);
            }
        }

        if (msg === '/doc') {
            const docmarkup = Markup.inlineKeyboard([
                Markup.button.callback('Continue', 'continue'),
            ]);
            const res = await commands.doc();
            ctx.reply(res, docmarkup);
        } else {
            await sleep(1000);
            commands.gStart();
        }
    } else {
        ctx.scene.leave();
        ctx.scene.enter('passwordScene');
    }
});

const passwordScene = new BaseScene('passwordScene');
passwordScene.enter((ctx) => ctx.reply('Enter your password'));

passwordScene.on(message('text'), async (ctx) => {
    const msg = ctx.message.text;
    if (msg[0] === '/') {
        const regex = /^\/(?:d|e|l|t|u|s|r)+$/;
        if (regex.test(msg)) {
            try {
                const res = await commands.delusr();
                ctx.reply(res);
            } catch (error) {
                console.error(error);
            }
        }

        if (msg === '/doc') {
            const docmarkup = Markup.inlineKeyboard([
                Markup.button.callback('Continue', 'continue'),
            ]);
            const res = await commands.doc();
            ctx.reply(res, docmarkup);
        } else {
            await sleep(1000);
            commands.gStart();
        }
    } else {
        ctx.session.logged = true;
        const password = ctx.message.text; // PASSWORD
        person.password = password;

        const saveData = Markup.inlineKeyboard([
            Markup.button.callback('Yes(wait about 1 minute)', 'Yes_data'),
        ]);
        ctx.reply('Save DATA?', saveData);

        bot.action('Yes_data', async (ctx) => {
            const login = person.login;
            const password = person.password;
            const id = person.id;
            try {
                await checkusr(login, password);
                try {
                    await saveUserData(login, password, id);
                    ctx.reply('Data saved successfully.');
                    await sleep(1000);
                    ctx.scene.leave();
                    const markupfurther = Markup.inlineKeyboard([
                        Markup.button.callback('Next 🚀', 'further'),
                    ]);
                    ctx.reply('Click to go to the next step!', markupfurther);
                } catch (error) {
                    if (error.message.includes('Duplicate entry')) {
                        ctx.reply('User with this data is already logged');
                        await sleep(500);
                        commands.gStart();
                    } else {
                        ctx.reply('Error has occurred. Try later.');
                        console.log('Error saving data:', error);
                        await sleep(500);
                        commands.gStart();
                    }
                }
            } catch (error) {
                ctx.reply("login or password isn't correct");
                sleep(1000);
                console.error('passwordScene.on(message(text)', error);
                commands.gStart();
            }
        });
    }
});

bot.action('continue', async (ctx) => {
    await sleep(1000);
    commands.gStart();
});

const stage = new Stage([loginScene, passwordScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
    const id = ctx.from.id;
    person = new Person(id);
    commands = new Commands(ctx, id);
    if (!ctx.session.logged) {
        try {
            await checkid(id);
            try {
                const data = await getData(ctx.from.id);
                const login = data[0].LOGIN;
                const password = data[0].PASSWORD;
                person.login = login;
                person.password = password;
            } catch (error) {
                console.error('bot.start', error);
            }
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
        const classKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('Class 8', 'c8'),
                Markup.button.callback('Class 7', 'c7'),
                Markup.button.callback('Class 6', 'c6'),
            ],
            [
                Markup.button.callback('Class 5', 'c5'),
                Markup.button.callback('Class 4', 'c4'),
                Markup.button.callback('Class 3', 'c3'),
            ],
        ]);

        await ctx.reply('Choose class:', classKeyboard);
    }
});

bot.hears(/^\/(?:d|e|l|t|u|s|r)+$/, async (ctx) => {
    try {
        const res = await commands.delusr(ctx.from.id);
        ctx.reply(res);
        await sleep(500);
        commands.gStart();
    } catch (error) {
        ctx.reply('Error has occured. Try later');
        console.error('bot.hears(/^/(?:d|e|l|t|u|s|r)+$/)', error);
    }
});

bot.hears('/doc', async (ctx) => {
    const doc =
        '/doc - show doc  `https://github.com/YanVolynets/Schools.by/blob/master/botdocumentation.txt` \n /delusr - delete account \n /start - start or start again \n /schedule - show lessons and homework';
    ctx.reply(doc);
});

bot.action('further', async (ctx) => {
    await ctx.answerCbQuery('Ok!');
    const classKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('Class 8', 'c8'),
            Markup.button.callback('Class 7', 'c7'),
            Markup.button.callback('Class 6', 'c6'),
        ],
        [
            Markup.button.callback('Class 5', 'c5'),
            Markup.button.callback('Class 4', 'c4'),
            Markup.button.callback('Class 3', 'c3'),
        ],
    ]);

    await ctx.reply('Choose class:', classKeyboard);
});

bot.action('c8', async (ctx) => {
    const cls = 8;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});
bot.action('c7', async (ctx) => {
    const cls = 7;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});
bot.action('c6', async (ctx) => {
    const cls = 6;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});
bot.action('c5', async (ctx) => {
    const cls = 5;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});
bot.action('c4', async (ctx) => {
    const cls = 4;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});
bot.action('c3', async (ctx) => {
    const cls = 3;
    person.cls = cls;
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});

bot.action('q1', async (ctx) => {
    const quarter = 1;
    person.quarter = quarter;
    const quaterKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
        Markup.button.callback('Back 🕒', 'backq1'),
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
});

bot.action('q2', async (ctx) => {
    const quarter = 2;
    person.quarter = quarter;
    const quaterKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
        Markup.button.callback('Back 🕒', 'backq2'),
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
});

bot.action('q3', async (ctx) => {
    const quarter = 3;
    person.quarter = quarter;
    const quaterKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
        Markup.button.callback('Back 🕒', 'backq3'),
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
});

bot.action('q4', async (ctx) => {
    const quarter = 4;
    person.quarter = quarter;
    const quaterKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Whole quarter', 'wq'),
        Markup.button.callback('A bit of quarter', 'bq'),
        Markup.button.callback('Back 🕒', 'backq4'),
    ]);
    await ctx.editMessageText('Choose:', quaterKeyboard);
});

bot.action('back', async (ctx) => {
    await ctx.answerCbQuery('Ok!');
    const classKeyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('Class 8', 'c8'),
            Markup.button.callback('Class 7', 'c7'),
            Markup.button.callback('Class 6', 'c6'),
        ],
        [
            Markup.button.callback('Class 5', 'c5'),
            Markup.button.callback('Class 4', 'c4'),
            Markup.button.callback('Class 3', 'c3'),
        ],
    ]);

    await ctx.editMessageText('Choose class:', classKeyboard);
});

// NEXT STEP

bot.action('wq', async (ctx) => {
    try {
        let formattedmarks = '';
        const login = person.login;
        const password = person.password;
        const cls = person.cls;
        const quarter = person.quarter;
        const marks = await getMarks(cls, quarter, login, password);
        for (let i in marks) {
            formattedmarks += `${i} ${marks[i].average.replace(
                /\./g,
                '\\.'
            )}             details: ||${marks[i].marks}|| \n`;
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

bot.action('backq1', async (ctx) => {
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});

bot.action('backq2', async (ctx) => {
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});

bot.action('backq3', async (ctx) => {
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});

bot.action('backq4', async (ctx) => {
    const quatersKeyboard = Markup.inlineKeyboard([
        Markup.button.callback('Quarter 1', 'q1'),
        Markup.button.callback('Quarter 2', 'q2'),
        Markup.button.callback('Quarter 3', 'q3'),
        Markup.button.callback('Quarter 4', 'q4'),
        Markup.button.callback('Back 🕒', 'back'),
    ]);
    await ctx.editMessageText('Choose quarter:', quatersKeyboard);
});

bot.hears(/^\d{2}\.\d{2}\s-\s\d{2}\.\d{2}$/, async (ctx) => {
    ctx.reply('Expect');
    let formattedmarks = '';
    const bitOfQuart = ctx.message.text;
    const login = person.login;
    const password = person.password;
    const cls = person.cls;
    person.bitOfQuart = bitOfQuart;
    try {
        const [marks, res] = await getTHEMarks(
            cls,
            bitOfQuart,
            login,
            password
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
            data = await getUserID();
            for (let i of data) {
                bot.telegram.sendMessage(i.USERID, text);
            }
        } catch (error) {
            console.log("bot.command('distribution')", error);
        }
    }
});

async function postShedule(ctx = false) {
    let text = '';
    try {
        if (ctx) {
            ctx.reply('wait about minute');
        }
        let login = person.login;
        let password = person.password;
        await checkusr(login, password);

        scheduleParse = await parseSchedule(login, password);

        for (let i in scheduleParse) {
            if (scheduleParse[i].value === 'недоступно') {
                text += `${scheduleParse[i].key} - your teacher did not write anything... \n \n`;
            } else {
                text += `${scheduleParse[i].key} - ${scheduleParse[i].value} \n \n`;
            }
        }
        if (ctx) {
            ctx.reply(text);
        } else {
            try {
                data = await getUserID();
                for (let i of data) {
                    bot.telegram.sendMessage(i.USERID, text);
                }
            } catch (error) {
                if (ctx) {
                    ctx.reply(
                        'To get the schedule at 15 per day yoг should enter your real login and password from schools.by'
                    );
                    ctx.reply('Maybe error on our side');
                }
                sleep(3000);
                if (commands) {
                    commands.gStart();
                }
                console.log('postSchedule', error);
            }
        }
    } catch (error) {
        if (ctx) {
            ctx.reply(
                'To get the schedule at 15 per day yoг should enter your real login and password from schools.by'
            );
        }
        sleep(1000);
        console.log('postShedule', error);
        if (commands) {
            commands.gStart();
        }
    }
}

bot.command('schedule', (ctx) => postShedule(ctx));
const job = schedule.scheduleJob('* 15 * * 1-5 ', () => {
    postShedule();
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();
