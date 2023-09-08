const { delusr } = require('./DATABASE');

class Commands {
    constructor(ctx, id) {
        this.ctx = ctx;
        this.id = id;
    }

    gStart() {
        this.ctx.scene.leave();
        this.ctx.scene.enter('loginScene');
    }

    async delusr() {
        try {
            await delusr(this.id);
            const res = 'Your account is succesfully deleted';
            return res;
        } catch (error) {
            const res = 'Error... Try later'; // If client error say him, if server error say him
            return res;
        }
    }
}

// const commands = new Commands({ id: 1234 }, 123);
// (async () => {
//     console.log(await commands.delusr());
// })();

class Person {
    constructor(id) {
        this._id = id;
    }

    get login() {
        return this._login;
    }

    get password() {
        return this._password;
    }

    get id() {
        return this._id;
    }

    get bitOfQuart() {
        return this._bitOfQuart;
    }

    get quarter() {
        return this._quarter;
    }

    get cls() {
        return this._cls;
    }

    set login(value) {
        this._login = value;
    }

    set password(value) {
        this._password = value;
    }

    set id(value) {
        this._id = value;
    }

    set bitOfQuart(value) {
        this._bitOfQuart = value;
    }

    set quarter(value) {
        this._quarter = value;
    }

    set cls(value) {
        this._cls = value;
    }
}

exports.Person = Person;
exports.Commands = Commands;
