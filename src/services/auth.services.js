const User = require("../models/User")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');

//TO DO -Register service
async function registerUser(userData) {
    const { name, email, password } = userData

    //checking if all field exist
    if (!name || !email || !password) {
        const error = new Error("All fields are required");
        error.statusCode = 400;
        throw error;
    }

    //checking if email already exist
    const userCheck = await User.findOne({ email })
    if (userCheck) {
        const error = new Error("Email already exist");
        error.statusCode = 400;
        throw error;
    }
    //hashind password
    const hashPassword = await bcrypt.hash(userData.password, 10)

    //create new user
    const user = new User({
        name,
        email,
        password: hashPassword
    })

    //saving user--creating new user
    await user.save();
    return user;
}

//TO DO-login service
async function loginUser(userData) {
    const { email, password} = userData

    //checking if field exist
    if (!email || !password) {
        const error = new Error("ALl feilds are required")
        error.statusCode = 400;
        throw error;
    }


    //Finding user by email id 
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }
    //comparing given password and existing password 
    const isMatched = await bcrypt.compare(userData.password, existingUser.password);

     if (!isMatched) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
    }

    //defining Jwt Token
    const token=jwt.sign({
        id:existingUser._id,
        email:existingUser.email
    },process.env.JWT_SECRET,
    {
        expiresIn:"24h"
    });
   
    return{
        token,
        user:{
            id:existingUser._id,
            name:existingUser.name,
            email:existingUser.email
        }
    }
}

module.exports =
{
    registerUser,
    loginUser
};
