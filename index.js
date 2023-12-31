const puppeteer = require('puppeteer');
const { sleep } = require('./functions.js');
const { shortsLessons, lessonsGoals } = require('./objects.js');
const { quarters } = require('./quarters.js');

let all_marks = [];
let formattedBFS;
let lessonHours = {};

async function getMarksOnPage(page) {
  const trElements = await page.$$('tr');
  const marks = [];
  for (let tr of trElements) {
    const lessonElement = await tr.$('.lesson span');
    const lessonText = lessonElement
      ? await lessonElement.evaluate((node) => node.textContent.slice(2).trim())
      : 'недоступно';

    const markElement = await tr.$('.mark strong');
    const markValue = markElement
      ? await markElement.evaluate((node) => node.textContent)
      : null;
    if (markValue !== null) {
      if (!isNaN(markValue) || markValue.includes('/')) {
        if (markValue.length > 0) {
          marks.push(shortsLessons[lessonText] + ':' + markValue);
        }
      }
    }
  }
  return marks;
}

async function getDaysHours(page) {
  const trElements = await page.$$('tr');
  for (let tr of trElements) {
    const lessonElement = await tr.$('.lesson span');
    const lessonText = lessonElement
      ? await lessonElement.evaluate((node) => node.textContent.slice(2).trim())
      : 'недоступно';
    if (lessonHours[shortsLessons[lessonText]] !== undefined) {
      lessonHours[shortsLessons[lessonText]] += 1;
    } else {
      lessonHours[shortsLessons[lessonText]] = 1;
    }
  }

  return lessonHours;
}

async function calculateAverageGrade(grades) {
  const subjects = {};
  const averageGrade = {};

  for (const grade of grades) {
    const [subject, scoreStr] = grade.split(':');
    if (scoreStr.includes('/')) {
      let score = parseInt(scoreStr.slice(0, scoreStr.indexOf('/')));

      if (!isNaN(score)) {
        if (!subjects[subject]) {
          subjects[subject] = { sum: 0, count: 0, marks: '' };
        }
        subjects[subject].sum += score;
        subjects[subject].count += 1;
        subjects[subject].marks += ` ${score}`;
      }

      score = parseInt(scoreStr.slice(scoreStr.indexOf('/') + 1));

      if (!isNaN(score)) {
        if (!subjects[subject]) {
          subjects[subject] = { sum: 0, count: 0, marks: '' };
        }
        subjects[subject].sum += score;
        subjects[subject].count += 1;
        subjects[subject].marks += ` ${score}`;
      }
    } else {
      let score = parseInt(scoreStr);

      if (!isNaN(score)) {
        if (!subjects[subject]) {
          subjects[subject] = { sum: 0, count: 0, marks: '' };
        }
        subjects[subject].sum += score;
        subjects[subject].count += 1;
        subjects[subject].marks += ` ${score}`;
      }
    }
  }

  for (const subject in subjects) {
    averageGrade[subject] = {
      average: `${(subjects[subject].sum / subjects[subject].count).toFixed(
        2
      )}`,

      marks: `${subjects[subject].marks}`,
    };
  }
  return averageGrade;
}

async function entrySchool(login, password) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let userID;
  let currentCls;

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

    currentCls = await page.$('.pp_line a');
    currentCls = await currentCls.evaluate((node) =>
      Number(node.textContent.split('-')[0])
    );

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
    userID = currentUrl.slice(
      currentUrl.indexOf('l') + 12,
      currentUrl.indexOf('#')
    );
    await sleep(1000);
  } catch (error) {
    throw error;
  } finally {
    if (browser) {
      browser.close();
    }
    return [userID, currentCls];
  }
}

async function parseSchedule(login, password) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const [userID, currentCls] = await entrySchool(login, password);

  let dateTime = new Date(
    new Date().setDate(new Date().getDate() + 1)
  ).getDate();
  let dayTime = new Date().getDay();
  let lesson = [];
  try {
    await page.setViewport({ width: 1040, height: 1024 });
    await page.goto('https://schools.by/login');

    await page.type('#id_username', login);
    await page.type('#id_password', password);

    await page.waitForSelector('.button_wrap');
    await page.click('.button_wrap');

    await sleep(2000);
    await page.waitForSelector('#accept-cookies');
    await page.click('#accept-cookies');

    let sch = page
      .url()
      .slice(page.url().indexOf('/') + 2, page.url().indexOf('.'));

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

    if (dayTime == 5 || dayTime == 6 || dayTime == 0) {
      const trElement = await page.$('.db_table');
      const dateElem = await trElement.$('.lesson');
      const date = dateElem
        ? await dateElem.evaluate((node) => node.textContent.trim().slice(-2))
        : 'недоступно';
      try {
        let datePart = new Date(new Date().setDate(Number(date) + 7)).getDate();
        dateTime = datePart;
        if (datePart < 10) {
          datePart = '0' + datePart;
        }
        let monthPart = new Date(
          new Date(new Date().setDate(Number(date) + 7)).setMonth(
            new Date(new Date().setDate(Number(date) + 7)).getMonth() + 1
          )
        ).getMonth();
        const quarter = 81; // CORRECT WHEN START 3 QUARTER
        if (monthPart > 1) {
          yearPart = 2023;
        } else {
          yearPart = 2024;
        }
        await page.goto(
          `https://${sch}.schools.by/m/pupil/${userID}/dnevnik/quarter/${quarter}/week/${yearPart}-${monthPart}-${datePart}`
        );
      } catch (error) {
        console.log('parseSchedule', error);
      }
    }
    const trElements = await page.$$('.db_table');

    for (let tr of trElements) {
      const dateElem = await tr.$('.lesson');
      const date = dateElem
        ? await dateElem.evaluate((node) =>
            node.textContent.trim().slice(-2).trim()
          )
        : 'недоступно';

      if (date == dateTime) {
        const trElem = await tr.$$('tbody tr');

        for (let tr of trElem) {
          let lm = await tr.$('.lesson span');
          let hw = await tr.$('.ht .ht-text-wrapper .ht-text');

          const lmText = lm
            ? await lm.evaluate((node) => node.textContent.slice(2).trim())
            : 'недоступно';
          const hwText = hw
            ? await hw.evaluate((node) => node.textContent.trim())
            : 'недоступно';

          lmText !== null &&
            lmText !== '' &&
            lesson.push({
              key: shortsLessons[lmText],
              value: hwText,
            });
        }
      }
    }
  } catch (error) {
    console.log('parseCurrentDay', error);
  } finally {
    if (browser) {
      browser.close();
      return lesson;
    }
  }
}

async function checkBitofQuart(bitOfQuart, cls, currentCls) {
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
      quarters.get(11 - currentCls + cls).get(1).data[0][0] +
      quarters.get(11 - currentCls + cls).get(1).data[0][1] +
      quarters.get(11 - currentCls + cls).get(1).data[0][2] +
      quarters.get(11 - currentCls + cls).get(1).data[0][3] +
      fir;
  } else {
    fir =
      quarters.get(11 - currentCls + cls).get(4).data[0][0] +
      quarters.get(11 - currentCls + cls).get(4).data[0][1] +
      quarters.get(11 - currentCls + cls).get(4).data[0][2] +
      quarters.get(11 - currentCls + cls).get(4).data[0][3] +
      fir;
  }

  if (parseInt(sec) > 531) {
    sec =
      quarters.get(11 - currentCls + cls).get(1).data[0][0] +
      quarters.get(11 - currentCls + cls).get(1).data[0][1] +
      quarters.get(11 - currentCls + cls).get(1).data[0][2] +
      quarters.get(11 - currentCls + cls).get(1).data[0][3] +
      sec;
  } else {
    sec =
      quarters.get(11 - currentCls + cls).get(4).data[0][0] +
      quarters.get(11 - currentCls + cls).get(4).data[0][1] +
      quarters.get(11 - currentCls + cls).get(4).data[0][2] +
      quarters.get(11 - currentCls + cls).get(4).data[0][3] +
      sec;
  }
  const BFS = bitOfQuart + ',' + fir + ',' + sec;

  return BFS;
}

async function getMarks(cls, quart, login, password) {
  lessonHours = {};
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const [userID, currentCls] = await entrySchool(login, password);

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

    let sch = page
      .url()
      .slice(page.url().indexOf('/') + 2, page.url().indexOf('.'));

    const num_quart = quarters.get(11 - currentCls + cls).get(quart).quarter;
    const weeks_quart = quarters.get(11 - currentCls + cls).get(quart).data;
    await sleep(1000);
    for (let week of weeks_quart) {
      await page.goto(
        `https://${sch}.schools.by/m/pupil/${userID}/dnevnik/quarter/${num_quart}/week/${week}`
      );
      const marksOnCurrentPage = await getMarksOnPage(page);
      await getDaysHours(page);

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
    all_marks = [];
    return [grades, lessonHours];
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

    await Promise.all([page.waitForNavigation(), page.click('.button_wrap')]);

    await page.waitForSelector('#accept-cookies');
    await page.click('#accept-cookies');
    await sleep(500);

    let sch = page
      .url()
      .slice(page.url().indexOf('/') + 2, page.url().indexOf('.'));

    await sleep(500);

    const [userID, currentCls] = await entrySchool(login, password);
    const BFS = await checkBitofQuart(bitOfQuart, cls, currentCls);
    formattedBFS = BFS.split(',');
    bitOfQuart = formattedBFS[0];
    const fir = formattedBFS[1];
    const sec = formattedBFS[2];

    for (let n = 1; n <= 4; n++) {
      const quart = quarters.get(11 - currentCls + cls).get(n).data;
      for (let i of quart) {
        let date = i[0] + i[1] + i[2] + i[3] + i[5] + i[6] + i[8] + i[9];
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
        const num_quart = quarters.get(11 - currentCls + cls).get(n).quarter;

        try {
          for (let week of res) {
            await page.goto(
              `https://${sch}.schools.by/m/pupil/${userID}/dnevnik/quarter/${num_quart}/week/${week}`
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
  let maxCls;
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
      maxCls = await page.$('.pp_line a');
      maxCls = await maxCls.evaluate((node) =>
        Number(node.textContent.split('-')[0])
      );
      resolve(maxCls);
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
exports.parseSchedule = parseSchedule;
