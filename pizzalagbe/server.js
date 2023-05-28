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
    if(req.session.admin){
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
    else{
        res.render('index');
    }
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
    pool.query(
        `select * from branches`,
        (err,results)=>{
            if(err){
                throw err;
            }
            
            const resultsArray = Array.from(results.rows);
            res.render('user/usersignup',{results:resultsArray});
        }
    );
})

app.get("/userlogout", (req, res) => {
    req.logout(req.user, err => {
      if(err) return next(err);
      req.session.destroy();
      res.redirect("/user/userlogin");
    });
});
app.get("/user/orderpizza", (req,res) =>{
    pool.query(
        `select * from pizzas`,
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                pool.query(
                    `select * from toppings`,
                    (err,result)=>{
                        if(err){
                            throw err;
                        }
                        else{
                            pool.query(
                                `select * from ordertype`,
                                (err,resul)=>{
                                    if(err){
                                        throw err;
                                    }
                                    
                                    pool.query(
                                        `select * from branches`,
                                        (err,resu)=>{
                                            if(err){
                                                throw err;
                                            }
                                            
                                            const resultsArray = Array.from(results.rows);
                                            const resultArray = Array.from(result.rows);
                                            const resulArray = Array.from(resul.rows);
                                            const resuArray = Array.from(resu.rows);
                                            res.render('user/orderpizza',{resu:resuArray,resul:resulArray,result:resultArray,results:resultsArray});
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            }
        }
    );
})
app.get("/user/cart", (req, res) => {
    let userid = req.session.user.customerid;
    pool.query(
        `SELECT *,
        CASE
            WHEN status = 0 THEN 'Preparing'
            WHEN status = 1 THEN 'Ready'
            WHEN status = 2 THEN 'Deliveryman in progress'
            WHEN status = 3 THEN 'Delivered'
        END AS status_text
        FROM orders
        NATURAL JOIN orderpizzatopping
        NATURAL JOIN customers
        NATURAL JOIN ordertype
        NATURAL JOIN branches
        WHERE customerid = $1 AND status < 4`, [userid],
        (err, results) => {
            if (err) {
                throw err;
            }

            const resultsArray = Array.from(results.rows);
            res.render('user/cart', { results: resultsArray });
        }
    );
});



















// Delivery Man Get Methods
app.get("/deliveryman/deliverymanlogin", (req, res) => {
    res.render('deliveryman/deliverymanlogin');
});






// Delivery Man Post Methods
app.post("/deliveryman/deliverymanlogin", (req, res) => {
    let { deliverymanid, deliverymanpassword } = req.body;
    pool.query(
        `select * from deliveryman where deliverymanid = $1`, [deliverymanid],
        (err, results) => {
            if (err) {
                throw err;
            } else if (results.rows.length > 0) {
                console.log('The password is'+deliverymanpassword);
                console.log('The database password is'+results.rows[0].password);
                if (deliverymanpassword === results.rows[0].password) {
                    const deliveryman=results.rows[0];
                    req.session.deliveryman=deliveryman;
                    pool.query(
                        `select * from orders natural join ordertype natural join customers natural join branches where status=1 and typeid=1`,
                        (err, results) => {
                            if (err) {
                                throw err;
                            }
                            else{
                                const resultsArray = Array.from(results.rows);
                                console.log(results);
                                res.render('deliveryman/deliverymandashboard',{results:resultsArray});
                            }
                
                        }
                    );
                } 
                else {
                    let error = [];
                    error.push({ message: "Incorrect Password" });
                    res.render('deliveryman/deliverymanlogin', { error });
                }
            } else {
                let error = [];
                error.push({ message: "No deliveryman exists with this email." });
                res.render('deliveryman/deliverymanlogin', { error });
            }
        }
    );
});







































//POST METHODS
app.post("/user/orderpizza", (req, res) => {
    let userid = req.session.user.customerid;
    let { pizzas, toppings, ordertype, branch, address } = req.body;
    console.log(pizzas, toppings, branch, ordertype, address,userid);


    pool.query(
        'CALL place_order($1, $2, $3, $4, $5, $6)',
        [pizzas, toppings, branch, ordertype, address, userid],
        (err, results) => {
            if (err) {
                throw err;
            }
            else{
                let no_err=[];
                no_err.push({message:"Order has been placed and added to cart."});
                res.render('user/dashboard',{no_err});
            }

        }
    );
});
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

















//Admin Get Methods
app.get("/admin/adminlogin",checkAuthenticated,(req,res) =>{
    res.render('admin/adminlogin');
})
app.get("/admin/addordertype",checkAuthenticated,(req,res) =>{
    res.render('admin/addordertype');
})

app.get("/admin/adminsignup", (req,res) =>{
    pool.query(
        `select * from branches`,
        (err,results)=>{
            if(err){
                throw err;
            }
            
            const resultsArray = Array.from(results.rows);
            res.render('admin/adminsignup',{results: resultsArray});
        }
    );
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
});
app.get("/admin/showorders", (req,res) =>{
    console.log(req.session.admin);
    pool.query(
        `select *
        from orders natural join orderpizzatopping natural join customers natural join ordertype natural join branches natural join admins
        where status=0 and branchid=$1`,[req.session.admin.branchid],
        (err,results)=>{
            if(err){
                throw err;
            }
            const resultsArray = Array.from(results.rows);
            res.render('admin/showorders',{results: resultsArray});
        }
    );
});













// Admin Post Methods
app.post("/admin/ready", (req,res) =>{
    let {orderid}=req.body;
    console.log("The orderid name is : "+orderid);
    pool.query(
        `update orders set status=status+1 where orderid=$1`,[orderid],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                pool.query(
                    `select *
                    from orders natural join orderpizzatopping natural join customers natural join ordertype natural join branches
                    where status=0`,
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        let no_err=[];
                        no_err.push({message:"Order is ready and added to the delivery section."});
                        const resultsArray = Array.from(results.rows);
                        res.render('admin/showorders',{results: resultsArray,no_err});
                    }
                );
            }
        }
    );
})
app.post("/admin/delete", (req,res) =>{
    let {orderid}=req.body;
    console.log("The orderid name is : "+orderid);
    pool.query(
        `update orders set status=5 where orderid=$1`,[orderid],
        (err,results)=>{
            if(err){
                throw err;
            }
            else{
                pool.query(
                    `select *
                    from orders natural join orderpizzatopping natural join customers natural join ordertype natural join branches
                    where status=0`,
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        let error=[];
                        error.push({message:"Order has been deleted"});
                        const resultsArray = Array.from(results.rows);
                        res.render('admin/showorders',{results: resultsArray,error});
                    }
                );
            }
        }
    );
})
app.post("/admin/addbranch", (req,res) =>{
    let {branch}=req.body;
    console.log("The branch name is : "+branch);
    pool.query(
        `select * from branches where branchname=$1`,[branch],
        (err,results)=>{
            if(err){
                throw err;
            }
            else if(results.rows.length>0){
                let error=[];
                error.push({message:"This branch already exists."});
                res.render('admin/addbranch',{error});
            }
            else{
                pool.query(
                    `insert into branches (branchname) values($1)`,[branch],
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        else{
                            let no_err=[];
                            no_err.push({message:"Branch Inserted successfully."});   
                            res.render('admin/addbranch',{no_err});
                        }
                    }
                );
            }
        }
    );
})
app.post("/admin/addordertype", (req,res) =>{
    let {ordertype}=req.body;
    pool.query(
        `select * from ordertype where type=$1`,[ordertype],
        (err,results)=>{
            if(err){
                throw err;
            }
            else if(results.rows.length>0){
                let error=[];
                error.push({message:"This type already exists."});
                res.render('admin/addordertype',{error});
            }
            else{
                pool.query(
                    `insert into ordertype (type) values($1)`,[ordertype],
                    (err,results)=>{
                        if(err){
                            throw err;
                        }
                        else{
                            let no_err=[];
                            no_err.push({message:"Ordetype Inserted successfully."});   
                            res.render('admin/addordertype',{no_err});
                        }
                    }
                );
            }
        }
    );
})
app.post("/admin/adddeliveryman",async (req,res) =>{

    let {name,dtype,hidden_dtype,branch,hidden_branch,phone} = req.body;

    console.log(name,dtype,branch,phone);

    pool.query(
        `Insert into deliveryman (typeid,name,branchid,phone)
        values ($1,$2,$3,$4) returning deliverymanid,typeid,name,branchid,avaiability,phone`,[dtype,name,branch,phone],
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
                                res.render('admin/admindashboard',{results: resultsArray,result: resultArray,no_err});
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

    let {masterkey,adminname,branchid,adminemail,adminphone,adminpassword,cadminpassword} = req.body;

    console.log(masterkey,adminname,branchid,adminemail,adminphone,adminpassword,cadminpassword);
    
    let error=[];

    if(adminpassword!=cadminpassword){
        error.push({message: "Passwords do not match"});
        pool.query(
            `select * from branches`,
            (err,results)=>{
                if(err){
                    throw err;
                }
                
                const resultsArray = Array.from(results.rows);
                res.render('admin/adminsignup',{results: resultsArray,error});
            }
        );
    }
    else if(masterkey!="1234"){
        error.push({message: "Incorrect masterkey.Please contact authority"});
        pool.query(
            `select * from branches`,
            (err,results)=>{
                if(err){
                    throw err;
                }
                
                const resultsArray = Array.from(results.rows);
                res.render('admin/adminsignup',{results: resultsArray,error});
            }
        );
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
                    pool.query(
                        `select * from branches`,
                        (err,results)=>{
                            if(err){
                                throw err;
                            }
                            
                            const resultsArray = Array.from(results.rows);
                            res.render('admin/adminsignup',{results: resultsArray,error});
                        }
                    );
                }
                else{
                    let message="Your otp varification code is ";
                    let subject="Verify your account";
                    sendMail(adminemail,adminotp,subject,message);
                    res.render('admin/adminregister',{adminname,branchid,adminemail,adminphone,adminpassword,adminotp});
                }
            }
        );
    }
})

app.post("/admin/adminregister",async (req,res) =>{
    let {adminname,branchid,adminemail,adminphone,adminpassword,adminotp,adminvarcode} = req.body;
    let error=[];
    if(adminotp!=adminvarcode){
        error.push({message:"Invalid varification code"});
        res.render("admin/adminregister",{error});
    }
    else{
        let hash=await bcrypt.hash(adminpassword,10);
        console.log(hash);
        pool.query(
            `INSERT INTO admins (adminname,branchid,adminemail,adminphone,adminpassword)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING adminname,branchid,adminemail,adminphone,adminpassword`,
            [adminname,branchid,adminemail,adminphone,hash],
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

app.post("/admin/adminlogin", async (req, res) => {
    let { adminemail, adminpassword } = req.body;
    console.log("admin email: " + adminemail);
    console.log("admin password: " + adminpassword);
  
    let error = [];
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
              pool.query(
                `select * from branches`,
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  const resultsArray = Array.from(results.rows);
                  pool.query(
                    `select * from ordertype`,
                    (err, result) => {
                      if (err) {
                        throw err;
                      }
  
                      const resultArray = Array.from(result.rows);
                      req.session.admin = admin; // Save admin data in session
                      res.render('admin/admindashboard', { results: resultsArray, result: resultArray });
                    }
                  );
                }
              );
            } else {
              // Password is incorrect
              error.push({ message: "Incorrect Password" });
              res.render("admin/adminlogin", { error });
            }
          });
        } else {
          // No user
          console.log("no user");
          error.push({ message: "No admins found with this email" });
          res.render("admin/adminlogin", { error });
        }
      }
    );
  });



















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