const puppeteer = require('puppeteer');
const { sleep } = require('./sleep.js');
const { shortsLessons } = require('./shorts.js');
const { quarters } = require('./quarters.js');

let all_marks = [];
let formattedBFS;

async function getMarksOnPage(page) {
    const trElements = await page.$$('tr');
    const marks = [];
    for (let tr of trElements) {
        const lessonElement = await tr.$('.lesson span');
        const lessonText = lessonElement
            ? await lessonElement.evaluate((node) =>
                  node.textContent.slice(2).trim()
              )
            : 'недоступно';

        const markElement = await tr.$('.mark strong');
        const markValue = markElement
            ? await markElement.evaluate((node) => node.textContent)
            : null;
        if (markValue !== null) {
            if (!isNaN(markValue) || markValue.length > 0) {
                marks.push(shortsLessons[lessonText] + ':' + markValue);
            }
        }
    }
    return marks;
}

async function calculateAverageGrade(grades) {
    const subjects = {};

    for (const grade of grades) {
        const [subject, scoreStr] = grade.split(':');
        const score = parseInt(scoreStr);

        if (!isNaN(score)) {
            if (!subjects[subject]) {
                subjects[subject] = { sum: 0, count: 0 };
            }
            subjects[subject].sum += score;
            subjects[subject].count += 1;
        }
    }

    const averageGrade = {};
    for (const subject in subjects) {
        averageGrade[subject] = (
            subjects[subject].sum / subjects[subject].count
        ).toFixed(2);
    }
    return averageGrade;
}

async function entrySchool(login, password) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        await page.setViewport({ width: 1040, height: 1024 });
        await page.goto('https://schools.by/login');

        await page.type('#id_username', login);
        await page.type('#id_password', password);

        const entry_button = '.button_wrap';
        await page.waitForSelector(entry_button);
        await page.click(entry_button);

        const cookies_button = '#accept-cookies';
        await page.waitForSelector(cookies_button);
        await page.click(cookies_button);

        const diary_button = '.tabs1 > li > a';
        await page.waitForSelector(diary_button);
        await page.click(diary_button);

        await sleep(2000);

        await page.evaluate(() => {
            const element = document.querySelector('.db_week');
            if (element) {
                element.scrollIntoView();
            }
        });
        await sleep(1000);
        const currentUrl = page.url();
        userID = currentUrl.slice(33, 39);
        await sleep(1000);
    } catch (error) {
        throw error;
    } finally {
        if (browser) {
            browser.close();
        }
        return userID;
    }
}

async function checkBitofQuart(bitOfQuart, cls) {
    if (
        parseInt(bitOfQuart[0] + bitOfQuart[1]) > 12 ||
        parseInt(bitOfQuart[8] + bitOfQuart[9]) > 12
    ) {
        if (
            parseInt(bitOfQuart[0] + bitOfQuart[1]) >
            parseInt(bitOfQuart[8] + bitOfQuart[9])
        ) {
            bitOfQuart =
                bitOfQuart.slice(8) + ' ' + '-' + ' ' + bitOfQuart.slice(0, 5);
        }
    }


    let fir = bitOfQuart[0] + bitOfQuart[1] + bitOfQuart[3] + bitOfQuart[4];
    let sec = bitOfQuart[8] + bitOfQuart[9] + bitOfQuart[11] + bitOfQuart[12];

    if (parseInt(fir) > 531) {
        fir =
            quarters.get(cls).get(1).data[0][0] +
            quarters.get(cls).get(1).data[0][1] +
            quarters.get(cls).get(1).data[0][2] +
            quarters.get(cls).get(1).data[0][3] +
            fir;
    } else {
        fir =
            quarters.get(cls).get(4).data[0][0] +
            quarters.get(cls).get(4).data[0][1] +
            quarters.get(cls).get(4).data[0][2] +
            quarters.get(cls).get(4).data[0][3] +
            fir;
    }

    if (parseInt(sec) > 531) {
        sec =
            quarters.get(cls).get(1).data[0][0] +
            quarters.get(cls).get(1).data[0][1] +
            quarters.get(cls).get(1).data[0][2] +
            quarters.get(cls).get(1).data[0][3] +
            sec;
    } else {
        sec =
            quarters.get(cls).get(4).data[0][0] +
            quarters.get(cls).get(4).data[0][1] +
            quarters.get(cls).get(4).data[0][2] +
            quarters.get(cls).get(4).data[0][3] +
            sec;
    }
    const BFS = bitOfQuart + ',' + fir + ',' + sec;

    return BFS;
}

async function getMarks(cls, quart, login, password) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const userID = await entrySchool(login, password);

    try {
        await page.setViewport({ width: 1040, height: 1024 });
        await page.goto('https://schools.by/login');

        await page.type('#id_username', login);
        await page.type('#id_password', password);

        await page.waitForSelector('.button_wrap');
        await page.click('.button_wrap');

        await page.waitForSelector('#accept-cookies');
        await page.click('#accept-cookies');
        await sleep(500);

        const num_quart = quarters.get(cls).get(quart).quarter;
        const weeks_quart = quarters.get(cls).get(quart).data;
        await sleep(1000);
        for (let week of weeks_quart) {
            await page.goto(
                `https://gymn146.schools.by/m/pupil/${userID}/dnevnik/quarter/${num_quart}/week/${week}`
            );
            const marksOnCurrentPage = await getMarksOnPage(page);
            all_marks = all_marks.concat(marksOnCurrentPage);

            await sleep(500);
        }
    } catch (error) {
        browser.close();
        throw error;
    } finally {
        if (browser) {
            browser.close();
        }
        const grades = await calculateAverageGrade(all_marks);
        return grades;
    }
}
async function getTHEMarks(cls, bitOfQuart, login, password) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let res = [];
    try {
        await page.setViewport({ width: 1040, height: 1024 });
        await page.goto('https://schools.by/login');

        await page.type('#id_username', login);
        await page.type('#id_password', password);

        await Promise.all([
            page.waitForNavigation(),
            page.click('.button_wrap'),
        ]);

        await page.waitForSelector('#accept-cookies');
        await page.click('#accept-cookies');
        await sleep(500);

        await sleep(500);

        const userID = await entrySchool(login, password);
        const BFS = await checkBitofQuart(bitOfQuart, cls);
        formattedBFS = BFS.split(',');
        bitOfQuart = formattedBFS[0];
        const fir = formattedBFS[1];
        const sec = formattedBFS[2];

        for (let n = 1; n <= 4; n++) {
            const quart = quarters.get(cls).get(n).data;
            for (let i of quart) {
                let date =
                    i[0] + i[1] + i[2] + i[3] + i[5] + i[6] + i[8] + i[9];
                if (
                    parseInt(fir[0] + fir[1] + fir[2] + fir[3]) >
                    parseInt(sec[0] + sec[1] + sec[2] + sec[3])
                ) {
                    if (parseInt(date) >= parseInt(fir)) {
                        res.push(i);
                    }
                } else {
                    if (
                        parseInt(date) >= parseInt(fir) &&
                        parseInt(date) <= parseInt(sec)
                    ) {
                        res.push(i);
                    }
                }
            }
            if (res.length !== 0) {
                const num_quart = quarters.get(cls).get(n).quarter;

                try {
                    for (let week of res) {
                        await page.goto(
                            `https://gymn146.schools.by/m/pupil/${userID}/dnevnik/quarter/${num_quart}/week/${week}`
                        );

                        const marksOnCurrentPage = await getMarksOnPage(page);
                        all_marks = all_marks.concat(marksOnCurrentPage);

                        sleep(2000);
                    }
                } catch (error) {
                    throw error;
                }
            }
        }
    } catch (error) {
        browser.close();
        throw error;
    } finally {
        browser.close();
        grades = await calculateAverageGrade(all_marks);
        return [grades, res];
    }
}


async function checkusr(username, login) {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1040, height: 1024 });
            await page.goto('https://schools.by/login');
            await page.type('#id_username', username);
            await page.type('#id_password', login);
            sleep(1000);
            const entry_button = '.button_wrap';
            await page.waitForSelector(entry_button);
            await page.click(entry_button);

            const cookies_button = '#accept-cookies';
            await page.waitForSelector(cookies_button);
            await page.click(cookies_button);
            resolve(true);
        } catch (error) {
            reject(error);
        } finally {
            browser.close();
        }
    });
}

exports.checkusr = checkusr;
exports.getMarks = getMarks;
exports.getTHEMarks = getTHEMarks;
