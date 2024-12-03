const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const Config = require('../config');
const {sha256} = require("js-sha256");
const {sign} = require("jsonwebtoken");

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid request data' });
    }

    let hashedPassword = sha256(password)

    const user = await User.where({ username: username, password: hashedPassword }).fetch({ require: false });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid credentials' });
    }

    let token;
    try {
        //Creating jwt token
        token = sign(
            {
                email: user.email
            },
            Config.secret,
            { expiresIn: 3000 }
        );
    } catch (err) {
        console.log(err);
        const error =
            new Error("Error! Something went wrong.");
        return res.status(StatusCodes.BAD_REQUEST).json({ error: error });
    }

    return res.status(StatusCodes.OK).json({ token: token});

});

module.exports = router;