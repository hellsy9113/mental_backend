const mongoose=require("mongoose")
const User = require("../models/User")
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const StudentDashboard=require("../models/StudentDashboard")
//TO DO -Register service

async function registerUser(userData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, email, password } = userData;

        if (!name || !email || !password) {
            const error = new Error("All fields are required");
            error.statusCode = 400;
            throw error;
        }

        const userCheck = await User.findOne({ email });
        if (userCheck) {
            const error = new Error("Email already exists");
            error.statusCode = 400;
            throw error;
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await User.create([{
            name,
            email,
            password: hashPassword
        }], { session });
        
        console.log(typeof StudentDashboard);

        await StudentDashboard.create([{
            userId: user[0]._id
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return user[0];

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
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
