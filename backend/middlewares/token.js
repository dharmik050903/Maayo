import jwt from 'jsonwebtoken';

export function generateToken(userData) {
  const payload = {
    id: userData.id,
    username: userData.username,
    role: userData.role,
    email: userData.email,
  };
  return jwt.sign(payload, process.env.jwt_secret, { expiresIn: '24w' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.jwt_secret);
  } catch (error) {
    let payload;
    if (error.name === "TokenExpiredError") {
      payload = "JWT Error: Token has expired";
    } else if (error.name === "JsonWebTokenError") {
      payload = "JWT Error: Invalid token";
    } else if (error.name === "NotBeforeError") {
      payload = "JWT Error: Token not active yet";
    } else {
      payload = "JWT Error:" + error.message;
    }
    return payload;
  }
}