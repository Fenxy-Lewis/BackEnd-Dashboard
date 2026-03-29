
const useragent = require("useragent");

const requestLogger = (req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  // Parse device info
  const agent = useragent.parse(req.headers["user-agent"]);
  const logData = {
    time: new Date().toISOString(),
    ip: ip,
    method: req.method,
    url: req.originalUrl,
    browser: agent.toAgent(),
    os: agent.os.toString(),
    device: agent.device.toString(),
  };
  console.log("Request Log:", logData);

  console.log("IP", ip);

  next();
};

module.exports = requestLogger;