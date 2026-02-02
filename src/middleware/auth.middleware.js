const jwt=require('jsonwebtoken');

//auth middleware-only authorized person can proceed furthur
//request->verifyToken->controller
function verifyToken(req,res,next){

    //store authorization from meta data
    const authHeader=req.headers.authorization;
    if(!authHeader)
    {
      return res.status(401).send({
            success: false,
        error:"Access denied",
      });
    }

    //remove bearer prefix from authorization and store actual token
    const token=authHeader?.split(" ")[1];
    
    if(!token)
    {
        return res.status(401).json({
            success:false,
            message:"Inavalid authorization format"
        })
    }
     
    //verify if the token is active and valid/
    try{
//           console.log("TOKEN:", token);
// console.log("SECRET:", process.env.JWT_SECRET);
        const decode=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decode;
        next();
    }
    catch(error)
    {
      return res.status(401).send({
            success: false,
        error:"Invalid Token"
      })   
    }
}


//isAdmin middleware
function isAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({
      error: "Access Forbidden",
    });
  }
}

module.exports={
 verifyToken,
 isAdmin
}