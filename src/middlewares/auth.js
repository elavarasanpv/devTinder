/** @format */

const adminAuth = (req, res, next) => {
  const token = "xyz";
  const isAuthenticated = token === "xyz";
  if (!isAuthenticated) {
    return res.status(401).send("Unauthorized");
  }
  next();
};

const userAuth = (req, res, next) => {
  const token = "xxx";
  const isAuthenticated = token === "xxx";
  if (!isAuthenticated) {
    return res.status(401).send("Unauthorized");
  }
  next();
};

module.exports = { adminAuth, userAuth };
