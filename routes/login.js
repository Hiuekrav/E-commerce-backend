const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const Config = require('../config');
const {sha256} = require("js-sha256");
const {sign} = require("jsonwebtoken");
const {body, validationResult} = require("express-validator");

router.post('/',
    [
    [
        body("username").notEmpty().withMessage("username is required"),
        body("password").notEmpty().withMessage("password is required")
    ],
    ], async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let hashedPassword = sha256(req.body.password)
    const user = await User.where({ username: req.body.username, password: hashedPassword }).fetch({ require: false });

    if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid credentials' });
    }

    let token;
    try {
        //Creating jwt token
        token = sign(
            {
                email: user.get('email')
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