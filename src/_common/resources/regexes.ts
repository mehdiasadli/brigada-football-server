import { appConfig } from '../config';

// regexes do not include min and max length, it will be handled by zod min and max functions
const passwordSpecialChars = appConfig.PASSWORD_SPECIAL_CHARS;

export const regexes = {
  users: {
    username: /^[a-zA-Z0-9_-]+$/,
    password: new RegExp(
      `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${passwordSpecialChars}]).+$`,
    ),
    mobileNumber: new RegExp(
      `^(?:(?:994)?(?:0)?)?(${appConfig.MOBILE_NUMBER_OPERATORS.join('|')})([1-9]\\d{6})$`,
    ),
  },
};
