const jwt = require("jsonwebtoken");

const validateToken = (req, res, next) => {
    const authorization = req.get("authorization");
    const match = authorization && authorization.match(/^Bearer\s+(\S+)$/i);

    if (!match) {
        return res.status(401).json({ message: "Access token is required" });
    }

    const secret = process.env.JWT_SECRET;
    if (typeof secret !== "string" || secret.trim() === "") {
        return res.status(500).json({ message: "Token verification is not configured" });
    }

    try {
        const payload = jwt.verify(match[1], secret);
        if (typeof payload !== "object" || payload === null) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = validateToken;