import jwt from "jsonwebtoken";

const generateToken = (
  payload: object,
  secret: string,
  expiresIn: string | number
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as NonNullable<jwt.SignOptions["expiresIn"]>,
  });
};

export default generateToken;