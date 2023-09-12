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

function delusr(id) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: DB_HOST,
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_NAME,
        });

        connection.connect();

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

            connection.end();
        });
    });
}

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

exports.saveUserData = saveUserData;
exports.checkid = checkid;
exports.delusr = delusr;
exports.getData = getData;
