const nodemailer = require("nodemailer");

const sendMail=async(useremail,otp,subject,message)=>{
    let testAccount = await nodemailer.createTestAccount();

    //connect with smtp
    const transporter = nodemailer.createTransport({
        service:"gmail",
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.Authority_Email,
            pass: process.env.email_password
        }
    });

    let info = await transporter.sendMail({
        from: '"SMetro 👻" <smetro@gmail.com>',
        to: useremail,
        subject: subject, 
        text: message+ otp, 
        // html: "<b>Welcome</b>",
    });
    console.log("OTP: "+otp);
    // res.json(info);
};

module.exports=sendMail;

