require('dotenv').config();

const mysql = require('mysql2');
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST;

function saveUserData(login, password, id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `INSERT INTO SCHOOL (LOGIN, PASSWORD, USERID) VALUES (?, ?, ?)`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [login, password, id], (err, results, fields) => {
      if (err) {
        if (err.message.includes('Duplicate entry')) {
          reject(new Error('Duplicate entry'));
        } else {
          reject(err);
        }
        return;
      }
      resolve();
    });
  });
}

function checkid(id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM SCHOOL WHERE USERID = ?';

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [id], (err, results) => {
      if (err) {
        console.error(err);
        return;
      }

      if (results.length > 0) {
        resolve(true);
      } else {
        reject(err);
      }
    });
  });
}

function delusr(id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM SCHOOL WHERE USERID = ${id}`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(deleteQuery, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      if (results.affectedRows > 0) {
        resolve();
      } else {
        reject(new Error(`No user with ID ${id} found.`));
      }
    });
  });
}

function getData(id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = 'SELECT LOGIN, PASSWORD FROM SCHOOL WHERE USERID = ?';

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [id], (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

function getUserID() {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = 'SELECT USERID FROM SCHOOL';

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

function saveUserDataPerson(
  quarter = 0,
  cls = 0,
  id,
  marks = 'abc',
  hours = 'abc',
  maxCls
) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `INSERT INTO PERSON (QUARTER, CLS, USERID, MARKS, HOURS, MAXCLS) VALUES (?, ?, ?, ?, ?, ?)`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(
      query,
      [quarter, cls, id, marks, hours, maxCls],
      (err, results, fields) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

function UpdateClsPerson(cls, id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `UPDATE PERSON SET CLS = ? WHERE USERID = ?`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [cls, id], (err, results, fields) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function UpdateQuarterPerson(quarter, id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `UPDATE PERSON SET QUARTER = ? WHERE USERID = ?`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [quarter, id], (err, results, fields) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function UpdateMarksPerson(marks, id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `UPDATE PERSON SET MARKS = ? WHERE USERID = ?`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [marks, id], (err, results, fields) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function UpdateHoursPerson(hours, id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query = `UPDATE PERSON SET HOURS = ? WHERE USERID = ?`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [hours, id], (err, results, fields) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

function getDataPerson(id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const query =
      'SELECT QUARTER, CLS, MARKS, HOURS, MAXCLS FROM PERSON WHERE USERID = ?';

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(query, [id], (err, results) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      resolve(results);
    });
  });
}

function delusrPerson(id) {
  const pool = mysql.createPool({
    connectionLimit: 10,
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  return new Promise((resolve, reject) => {
    const deleteQuery = `DELETE FROM PERSON WHERE USERID = ${id}`;

    pool.on('release', () => {
      pool.end((err) => {
        if (err) {
          console.error('Error pool close:', err);
        } else {
          console.log('Pool close');
        }
      });
    });

    pool.query(deleteQuery, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      if (results.affectedRows > 0) {
        resolve();
      } else {
        reject(new Error(`No user with ID ${id} found.`));
      }
    });
  });
}

exports.saveUserData = saveUserData;
exports.checkid = checkid;
exports.delusr = delusr;
exports.getData = getData;
exports.getUserID = getUserID;
exports.UpdateQuarterPerson = UpdateQuarterPerson;
exports.UpdateClsPerson = UpdateClsPerson;
exports.saveUserDataPerson = saveUserDataPerson;
exports.getDataPerson = getDataPerson;
exports.delusrPerson = delusrPerson;
exports.UpdateHoursPerson = UpdateHoursPerson;
exports.UpdateMarksPerson = UpdateMarksPerson;
