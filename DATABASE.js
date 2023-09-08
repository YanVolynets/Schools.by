require('dotenv').config();

const mysql = require('mysql2');
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;
const DB_HOST = process.env.DB_HOST;

function saveUserData(login, password, id) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        connection.connect((err) => {
            if (err) {
                console.error('Ошибка подключения', err);
                return;
            }
        });

        const query = `INSERT INTO SCHOOL (LOGIN, PASSWORD, USERID) VALUES (?, ?, ?)`;

        connection.query(
            query,
            [login, password, id],
            (err, results, fields) => {
                if (err) {
                    if (err.message.includes('Duplicate entry')) {
                        reject(new Error('Duplicate entry'));
                    } else {
                        reject(err);
                    }
                    return;
                }
                resolve();
            }
        );

        connection.end();
    });
}

// (async () => {
//     await saveUserData('Ян10', '51912345', '123');
// })();

function checkid(id) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        connection.connect();

        const query = 'SELECT * FROM SCHOOL WHERE USERID = ?';

        connection.query(query, [id], (err, results) => {
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
        connection.end();
    });
}

// (async () => {
//     try {
//         await checkid(1805013637);
//         console.log('succes');
//     } catch (err) {
//         console.log(err);
//     }
// })();

function delusr(id) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        connection.connect();

        // Выполните операцию удаления
        const deleteQuery = `DELETE FROM SCHOOL WHERE USERID = ${id}`;

        connection.query(deleteQuery, (err, results) => {
            if (err) {
                reject(err);
                return;
            }
            if (results.affectedRows > 0) {
                resolve();
            } else {
                reject(new Error(`No user with ID ${id} found.`));
            }

            // Закройте подключение
            connection.end();
        });
    });
}

// (async () => {
//     await delusr(1805013637);
// })();

function getData(id) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        const query = 'SELECT LOGIN, PASSWORD FROM SCHOOL WHERE USERID = ?';

        connection.query(query, [id], (err, results) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(results);

            connection.end();
        });
    });
}

// (async () => {
//     const data = await getData('1805013637');
//     console.log(data[0].LOGIN);
// })();

exports.saveUserData = saveUserData;
exports.checkid = checkid;
exports.delusr = delusr;
exports.getData = getData;
