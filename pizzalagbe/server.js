const express=require("express");
const app = express();
const {pool} = require("./dbconfig");
const bcrypt=require("bcrypt");
const session=require("express-session");
const flash=require("express-flash");
const passport=require('passport');
const qr=require('qrcode');
const fs=require('fs');

const initializePassport=require('./passportConfig');
const sendMail = require("./controllers/sendmail");
const cookieParser = require("cookie-parser");

initializePassport(passport);

require('dotenv').config()

const port=process.env.PORT || 3001;

app.set('view engine',"ejs");
app.use(cookieParser());
app.use(express.urlencoded({extended: false}));
app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: true,
      save:true,
      saveUninitialized: true
    })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));








//GET METHODS
app.get("/",checkIndexAuthenticated,(req,res) =>{
    res.render('index');
})

app.get("/user/dashboard",(req,res) =>{
    req.session.user=req.user;
    req.session.save();
    

    res.render('user/dashboard');
    
})

app.get("/user/userlogin",checkAuthenticated,(req,res) =>{
    res.render('user/userlogin');
})

app.get("/user/usersignup", (req,res) =>{
    res.render('user/usersignup');
})

app.get("/userlogout", (req, res) => {
    req.logout(req.user, err => {
      if(err) return next(err);
      req.session.destroy();
      res.redirect("/user/userlogin");
    });
});

app.get("/user/tickethistory",(req,res) =>{
    let uid=req.session.user.userid;
    
    pool.query(
        `SELECT *
        FROM reservation natural join trains natural join users
        WHERE userid =$1 and avaiability=1
        order by reserve_time desc`,[uid],
        (err,results)=>{
            if(err){
                throw err;
            }
            console.log("database connected");
            console.log(results.rows);

            if(results.rows.length>0){
                res.render("user/tickethistory",{results});
            }
            else{
                let no_err=[];
                no_err.push({message:"Sorry you have no previous tickets"});
                pool.query(
                    `select distinct departure from fares`,
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        console.log(results);
                        const resultsArray = Array.from(results.rows);
                        res.render('user/dashboard',{results: resultsArray,no_err});
                    }
                );
            }
        }
    );
})













//POST METHODS

app.post("/user/usersignup",async (req,res) =>{

    let {firstname,lastname,useremail,userphone,userpassword,cuserpassword,branch} = req.body;

    console.log(firstname,lastname,useremail,userphone,userpassword,cuserpassword,branch);
    
    let error=[];

    if(userpassword!=cuserpassword){
        error.push({message: "Passwords do not match"});
        res.render('user/usersignup',{error});
    }
    else{
        const userotp = Math.floor(1000 + Math.random() * 9000);

        pool.query(
            `select * from customers where customeremail=$1`,[useremail],
            (err,results)=>{
                if(err){
                    throw err;  
                }
                console.log("database connected");
                console.log(results.rows);

                if(results.rows.length>0){
                    error.push({message: "Email already exists"});
                    res.render("user/usersignup",{error});
                }
                else{
                    let message="Your otp varification code is ";
                    let subject="Verify your account";
                    sendMail(useremail,userotp,subject,message);
                    res.render('user/register',{firstname,lastname,useremail,userphone,userpassword,userotp,branch});
                }
            }
        );
    }
})

app.post("/user/register",async (req,res) =>{
    let {firstname,lastname,useremail,userphone,userpassword,userotp,branch,uservarcode} = req.body;
    let error=[];
    if(userotp!=uservarcode){
        error.push({message:"Invalid varification code"});
        res.render("user/register",{error});
    }
    else{
        let hash=await bcrypt.hash(userpassword,10);
        console.log(hash);
        pool.query(
            `select * from branches where branchname=$1`,
            [branch],
            (err, results) => {
            if (err) {
                throw err;
            }
            let br=results.rows[0].branchid;
            pool.query(
                `INSERT INTO customers (firstname,lastname,customeremail,customerphone,customerpassword,branchid)
                    VALUES ($1, $2, $3, $4, $5,$6)
                    RETURNING firstname,lastname,customeremail,customerphone,customerpassword,branchid`,
                [firstname,lastname,useremail,userphone,hash,br],
                (err, results) => {
                if (err) {
                    throw err;
                }
                    console.log(results.rows);
                    console.log("Data inserted");
                    req.flash("success_msg", "You are now registered. Please log in");
    
                    let no_err=[];
                    no_err.push({message:"Account created. You can log in now"});
                    res.render("user/userlogin",{no_err});
                }
            );
            }
        );
        
    }
})


app.post("/user/userlogin",passport.authenticate("local",{
    successRedirect:"dashboard",
    failureRedirect:"userlogin",
    failureFlash:true
}));

app.post("/user/bookticket",async (req,res) =>{

    let {from,to,journeydate} = req.body;

    console.log(from,to,journeydate);

    let arr=[];
    arr['username']=req.session.user.username;

    pool.query(
        `SELECT * FROM trains natural join fares 
        WHERE departure = $1 AND destination = $2 AND departuredate = $3 and seats>0`,
        [from, to, journeydate],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log("database connected");
          console.log(results.rows);
      
          if (results.rows.length > 0) {
            console.log(results.rows.length);
            req.session.traininfo=results;
            res.render("user/bookticket", {results,arr});
          } 
          else {
            let error = [];
            pool.query(
                `select distinct departure from fares`,
                (err,results)=>{
                    if(err){
                        throw err;
                    }
                    console.log(results);
                    const resultsArray = Array.from(results.rows);
                    
                    error.push({ message: "Sorry, no trains available" });
                    res.render('user/dashboard',{results: resultsArray,arr,error});
                }
            );
          }
        }
    );
})

app.post("/user/confirmbook",async (req,res) =>{

    let {trainid} = req.body;
    console.log("trainID: ");

    console.log(trainid);

    let uid=req.session.user.userid;

    pool.query(
    `INSERT INTO reservation (trainid, userid)
    VALUES ($1, $2)
    RETURNING reservationid`,
    [trainid, uid],
    async (err, results) => {
            if (err) {
                throw err;
            }
            
            
            const reservationId = results.rows[0].reservationid;
            console.log("RID: "+reservationId);
            
            //Generate QR code
            let stjson=JSON.stringify(reservationId);
            qr.toFile("./public/img/qr.png",stjson,{
                width: 200,
                height: 200
            },function(err){
                if(err)
                throw err;
            });
            qr.toString(stjson,{type:"terminal"},function (err,code) {
                if(err){
                    throw err;
                }
                else{
                    console.log(code);
                    pool.query(
                        `update reservation
                        set qr_code=$1
                        where reservationid=$2
                        RETURNING reservationid`,
                        [code,reservationId],
                        async (err, results) => {
                            if (err) {
                                throw err;
                            }
                            else{
                                console.log("qr_code inserted");
                            }
                        }
                    );
                }
             });
                
            //Update train table to deduct a seat
            pool.query(
                `update trains set seats=seats-1
                where trainid=$1`,[trainid],
                (err,results)=>{
                    if(err){
                        throw err;
                    }
                }
            );

            //Update User account that deducts the fare of the train
            let uid=req.session.user.userid;
            pool.query(
                `select amount from trains natural join fares where trainid=$1`,[trainid],
                (err,results)=>{
                    if(err){
                        throw err;
                    }
                    console.log("Got amount: ");
                    let fare = results.rows[0].amount;
                    console.log(fare);

                    pool.query(
                        `select userbalance from users where userid=$1`,[uid],
                        (err,results)=>{
                            if(err){
                                throw err;
                            }
                            let userbalanace=results.rows[0].userbalance;
                            if(userbalanace<fare){
                                let error=[];
                                error.push({message:"Sorry!Not enough account balance.Please recharge your account."});
                                pool.query(
                                    `select distinct departure from fares`,
                                    (err,results)=>{
                                        if(err){
                                            throw err;
                                        }
                                        console.log(results);
                                        const resultsArray = Array.from(results.rows);
                                        res.render('user/dashboard',{results: resultsArray,error});
                                    }
                                );
                            } 
                            else{
                                pool.query(
                                    `update users set userbalance=userbalance-$1 where userid=$2`,[fare,uid],
                                    (err,results)=>{
                                        if(err){
                                            throw err;
                                        }
                                        console.log("User update completed");
                                    }
                                );
                                console.log("User update completed");
                            }
                        }
                    );
                }
            );

            let no_err=[];

            pool.query(
                `SELECT *
                FROM reservation natural join trains natural join users
                WHERE userid =$1 and avaiability=1
                order by reserve_time desc`,[uid],
                (err,results)=>{
                    if(err){
                        throw err;
                    }
                    console.log("database connected");
                    console.log(results.rows);

                    if(results.rows.length>0){
                        no_err.push({message:"Ticket Confirmed."});
                        res.render("user/tickethistory",{results});
                    }
                    else{
                        no_err.push({message:"Sorry you have no previous tickets"});
                        res.render("user/dashboard",{no_err});
                    }
                }
            );
        }
    );
})
app.post("/user/showqr",(req,res) =>{
    let {reservationid}=req.body;
    let stjson=JSON.stringify(reservationid);
    qr.toFile("./public/img/qr.png",stjson,{
        width: 500,
        height: 500
    },function(err){
        if(err)
            throw err;
    });
    pool.query(
        `SELECT *
        FROM reservation natural join trains natural join users
        WHERE reservationid =$1 and avaiability=1
        order by reserve_time desc`,[reservationid],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{  
                res.render('user/showqr',{results});
            }
        }
    );
    
})















//Admin Get Methods
app.get("/admin/adminlogin",checkAuthenticated,(req,res) =>{
    res.render('admin/adminlogin');
})

app.get("/admin/adminsignup", (req,res) =>{
    res.render('admin/adminsignup');
})
app.get("/admin/admindashboard", (req,res) =>{
    pool.query(
        `select * from branches`,
        (err,results)=>{
            if(err){
                throw err;
            }
            const resultsArray = Array.from(results.rows);
            pool.query(
                `select * from ordertype`,
                (err,result)=>{
                    if(err){
                        throw err;
                    }
                    
                    const resultArray = Array.from(result.rows);
                    res.render('admin/admindashboard',{results: resultsArray,result: resultArray});
                }
            );
        }
    );
})
app.get("/admin/addpizza", (req,res) =>{
    res.render('admin/addpizza');
})
app.get("/admin/addtopping", (req,res) =>{
    res.render('admin/addtopping');
})
app.get("/admin/addbranch", (req,res) =>{
    res.render('admin/addbranch');
})
app.get("/admin/addtrain", (req,res) =>{
    pool.query(
        `select distinct departure from fares`,
        (err,results)=>{
            if(err){
                throw err;
            }
            
            const resultsArray = Array.from(results.rows);
            res.render('admin/addtrain',{results: resultsArray});
        }
    );
})













// Admin Post Methods
app.post("/admin/adddeliveryman",async (req,res) =>{

    let {name,dtype,hidden_dtype,branch,hidden_branch,phone} = req.body;

    console.log(name,dtype,branch,phone);

    pool.query(
        `insert into deliveryman (typeid, name, branchid) 
        values($1,$2,$3) returning deliverymanid,name,typeid,branchid,avaiability;`,[dtype,name,branch],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                let no_err=[];
                no_err.push({message:"Delivery man has been inserted"});
                pool.query(
                    `select * from branches`,
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        const resultsArray = Array.from(results.rows);
                        pool.query(
                            `select * from ordertype`,
                            (err,result)=>{
                                if(err){
                                    throw err;
                                }
                                
                                const resultArray = Array.from(result.rows);
                                res.render('admin/admindashboard',{results: resultsArray,result: resultArray});
                            }
                        );
                    }
                );
            }
        }
    );
    
})
app.post("/admin/addpizza",async (req,res) =>{

    let {pizzaname,details,price} = req.body;

    console.log(pizzaname,details,price);
    
    pool.query(
        `Insert into pizzas (pizzaname, details, price)
        values ($1,$2,$3) returning pizzaname,details,price`,[pizzaname,details,price],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                let no_err=[];
                no_err.push({message:"Pizza has been inserted"});
                res.render('admin/addpizza',{no_err});
            }
        }
    );
})
app.post("/admin/addtopping",async (req,res) =>{

    let {toppingname,details,price} = req.body;

    console.log(toppingname,details,price);
    
    pool.query(
        `Insert into toppings (toppingname, details, price)
        values ($1,$2,$3) returning toppingname,details,price`,[toppingname,details,price],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                let no_err=[];
                no_err.push({message:"topping has been inserted"});
                res.render('admin/addtopping',{no_err});
            }
        }
    );
})
app.post("/admin/adminsignup",async (req,res) =>{

    let {masterkey,adminname,adminnid,adminemail,adminphone,adminpassword,cadminpassword} = req.body;

    console.log(masterkey,adminname,adminnid,adminemail,adminphone,adminpassword,cadminpassword);
    
    let error=[];

    if(adminpassword!=cadminpassword){
        error.push({message: "Passwords do not match"});
        res.render('admin/adminsignup',{error});
    }
    else if(masterkey!="1234"){
        error.push({message: "Incorrect masterkey.Please contact authority"});
        res.render('admin/adminsignup',{error});
    }
    else{
        const adminotp = Math.floor(1000 + Math.random() * 9000);

        pool.query(
            `select * from admins where adminemail=$1`,[adminemail],
            (err,results)=>{
                if(err){
                    throw err;
                }
                console.log("database connected");
                console.log(results.rows);

                if(results.rows.length>0){
                    error.push({message: "Email already exists"});
                    res.render("admin/adminsignup",{error});
                }
                else{
                    let message="Your otp varification code is ";
                    let subject="Verify your account";
                    sendMail(adminemail,adminotp,subject,message);
                    res.render('admin/adminregister',{adminname,adminnid,adminemail,adminphone,adminpassword,adminotp});
                }
            }
        );
    }
})

app.post("/admin/adminregister",async (req,res) =>{
    let {adminname,adminnid,adminemail,adminphone,adminpassword,adminotp,adminvarcode} = req.body;
    let error=[];
    if(adminotp!=adminvarcode){
        error.push({message:"Invalid varification code"});
        res.render("admin/adminregister",{error});
    }
    else{
        let hash=await bcrypt.hash(adminpassword,10);
        console.log(hash);
        pool.query(
            `INSERT INTO admins (adminname,adminnid,adminemail,adminphone,adminpassword)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING adminname,adminnid,adminemail,adminphone,adminpassword`,
            [adminname,adminnid,adminemail,adminphone,hash],
            (err, results) => {
            if (err) {
                throw err;
            }
                console.log(results.rows);
                console.log("Data inserted");
                req.flash("success_msg", "You are now registered admin. Please log in");

                let no_err=[];
                no_err.push({message:"Account created. You can log in now as an admin"});
                res.render("admin/adminlogin",{no_err});
            }
        );
    }
})



app.post("/admin/adminlogin",async (req,res) =>{
    let {adminemail,adminpassword} = req.body;
    console.log("admin email: "+adminemail);
    console.log("admin password: "+adminpassword);

    let error=[];
    pool.query(
        `select * from admins where adminemail=$1`,
        [adminemail],
        (err, results) => {
          if (err) {
            throw err;
          }
          console.log(results.rows);
  
          if (results.rows.length > 0) {
            const admin = results.rows[0];
  
            bcrypt.compare(adminpassword, admin.adminpassword, (err, isMatch) => {
              if (err) {
                console.log(err);
              }
              if (isMatch) {
                req.session.admin=results;
                res.render("admin/admindashboard");
              } 
              else {
                //password is incorrect
                error.push({message:"Incorrect Passowrd"});
                res.render("admin/adminlogin",{error});
              }
            });
          } 
          else {
            // No user
            console.log("no user");
            error.push({message:"No admins found with this email"});
            res.render("admin/adminlogin",{error});

          }
        }
      );
})



















//API
function checkIndexAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("/user/dashboard");
    }
    next();
}
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect("dashboard");
    }
    next();
}
  
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("user/userlogin");
}




app.listen(port, () =>{
    console.log(`Server listening port http://localhost:${port}`);
})