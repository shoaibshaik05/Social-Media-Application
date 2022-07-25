const nodeMailer = require("../config/nodemailer");

exports.resetPassword = (user) => {

    let htmlString = nodeMailer.renderTemplate({user:user} , '/reset_password/reset_password.ejs');

    nodeMailer.transporter.sendMail({
        from: 'shoaibmahaboobshaik1999@gmail.com', // sender address
        to: user.email, // list of receivers
        subject: "Codeial : Reset Password", // Subject line
        html: htmlString // html body
      } , (err, info) => {
        if (err){
            console.log('Error in sending mail', err);
            return;
        }
          console.log("Message Sent" , info);
          return;
      });
} 
