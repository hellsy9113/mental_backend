// const mongoose=require("mongoose")
// const User = require("../models/User")
// const bcrypt = require('bcrypt')
// const jwt = require('jsonwebtoken');
// const StudentDashboard=require("../models/StudentDashboard")
// //TO DO -Register service

// async function registerUser(userData) {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { name, email, password } = userData;

//         if (!name || !email || !password) {
//             const error = new Error("All fields are required");
//             error.statusCode = 400;
//             throw error;
//         }

//         const userCheck = await User.findOne({ email });
//         if (userCheck) {
//             const error = new Error("Email already exists");
//             error.statusCode = 400;
//             throw error;
//         }

//         const hashPassword = await bcrypt.hash(password, 10);

//         const user = await User.create([{
//             name,
//             email,
//             password: hashPassword
//         }], { session });
        
//         console.log(typeof StudentDashboard);

//         await StudentDashboard.create([{
//             userId: user[0]._id
//         }], { session });

//         await session.commitTransaction();
//         session.endSession();

//         return user[0];

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         throw error;
//     }
// }

// //TO DO-login service
// async function loginUser(userData) {
//     const { email, password} = userData

//     //checking if field exist
//     if (!email || !password) {
//         const error = new Error("ALl feilds are required")
//         error.statusCode = 400;
//         throw error;
//     }


//     //Finding user by email id 
//     const existingUser = await User.findOne({ email });
//     if (!existingUser) {
//         const error = new Error("Invalid email or password");
//         error.statusCode = 401;
//         throw error;
//     }
//     //comparing given password and existing password 
//     const isMatched = await bcrypt.compare(userData.password, existingUser.password);

//      if (!isMatched) {
//     const error = new Error("Invalid email or password");
//     error.statusCode = 401;
//     throw error;
//     }

//     //defining Jwt Token
//     const token=jwt.sign({
//         id:existingUser._id,
//         email:existingUser.email
//     },process.env.JWT_SECRET,
//     {
//         expiresIn:"24h"
//     });
   
//     return{
//         token,
//         user:{
//             id:existingUser._id,
//             name:existingUser.name,
//             email:existingUser.email
//         }
//     }
// }

// module.exports =
// {
//     registerUser,
//     loginUser
// };

const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const StudentDashboard = require('../models/StudentDashboard');
const CounsellorProfile = require('../models/CounsellorProfile');

// ──────────────────────────────────────────────
// registerUser
// Accepts: { name, email, password, role }
// role defaults to 'student' if not provided.
// Creates role-specific profile in same transaction.
// ──────────────────────────────────────────────
async function registerUser(userData) {
  const { name, email, password, role = 'student' } = userData;

  // Basic field validation
  if (!name || !email || !password) {
    const error = new Error('All fields are required');
    error.statusCode = 400;
    throw error;
  }

  // Validate role
  const validRoles = ['student', 'counsellor', 'admin'];
  if (!validRoles.includes(role)) {
    const error = new Error('Invalid role. Must be student, counsellor, or admin');
    error.statusCode = 400;
    throw error;
  }

  // Check for duplicate email
  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error('Email already exists');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Detect replica set support — transactions require a replica set.
  // Standalone MongoDB (used in tests) doesn't support them.
  const supportsTransactions =
    mongoose.connection.client?.topology?.description?.type !== 'Single';

  if (supportsTransactions) {
    // ── Production path: atomic transaction ──
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const [user] = await User.create(
        [{ name, email, password: hashedPassword, role }],
        { session }
      );
      if (role === 'student') {
        await StudentDashboard.create([{ userId: user._id }], { session });
      } else if (role === 'counsellor') {
        await CounsellorProfile.create([{ userId: user._id }], { session });
      }
      await session.commitTransaction();
      session.endSession();
      return user;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } else {
    // ── Test / standalone path: sequential saves ──
    const user = await User.create({ name, email, password: hashedPassword, role });
    if (role === 'student') {
      await StudentDashboard.create({ userId: user._id });
    } else if (role === 'counsellor') {
      await CounsellorProfile.create({ userId: user._id });
    }
    return user;
  }
}

// ──────────────────────────────────────────────
// loginUser
// Returns JWT with id, email, role embedded.
// ──────────────────────────────────────────────
async function loginUser(userData) {
  const { email, password } = userData;

  if (!email || !password) {
    const error = new Error('All fields are required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Embed role in token so middleware can check without a DB call
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

module.exports = { registerUser, loginUser };