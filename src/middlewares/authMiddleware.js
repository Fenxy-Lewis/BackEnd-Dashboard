const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
  try {
const authHeader = req.header("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access Denied: No Token Provided" });
    };
const token = authHeader.split(" ")[1];
if(!token){
  return res.status(401).json(
    {
      message:"Access Denied: Token Missing"
    }
  )
};
const decoded = 
jwt.verify(token, process.env.JWT_SECRET);
next();




  } catch (error) {
    console.error(`Error in authMiddleware: ${error.message}`); 
    message:`Error in authMiddleware: ${error.message}`;
    res.status(401).json({ message: "Unauthorized" });
  }
};
module.exports = authMiddleware;
