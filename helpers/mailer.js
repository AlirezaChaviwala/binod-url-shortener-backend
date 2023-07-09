const nodemailer = require("nodemailer");

const sendMail = async ({ receipentMailId, resetPasswordURL }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        // refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: receipentMailId,
      subject: "Reset your password",
      html: `<p>Hi, to reset your password, please click <a href=${resetPasswordURL}>here</a></p>`,
    };

    transporter.sendMail(mailOptions, function (err, data) {
      if (err) {
        console.log(err);
        return null;
      } else {
        return data;
      }
    });
  } catch (error) {
    return null;
  }
};

module.exports = {
  sendMail,
};
