// const{registerUser}=require("../services/auth.services");
// const {loginUser}=require("../services/auth.services")
// //register new user
// async function register(req,res){
//  try{
//     const user=await registerUser(req.body);
//     res.status(201).json({
//         message:"User registered successfully",
//         userId: user._id,
//     });
//  }  
//  catch(error)
//  {
//     res.status(error.statusCode || 500).json({
//         message:error.message || "server error"
//     });
//  }
// }

// //login existing user  
// async function login(req,res){
//     try{
//         const result=await loginUser(req.body);
//         res.status(200).json({
//             message:"Login successfull",
//             token:result.token,
//             user:result.user
//         })
//     }
//     catch(error)
//     {
//         res.status(error.statusCode || 500).json({
//             message:error.message || "server error"
//         })
//     }
// }
// module.exports={
//     register,
//     login
// } 



const { registerUser, loginUser } = require('../services/auth.services');

// POST /auth/register
async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: user._id,
      role: user.role
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

// POST /auth/login
async function login(req, res) {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user   // { id, name, email, role }
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
}

module.exports = { register, login };
