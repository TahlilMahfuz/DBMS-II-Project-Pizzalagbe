const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbconfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  console.log("User Passport Config Started");
  console.log("Initialized");

  const authenticateUser = (email, password, done) => {
    console.log(email, password);
    pool.query(
      `select * from customers where customeremail=$1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          const user = results.rows[0];

          bcrypt.compare(password, user.customerpassword, (err, isMatch) => {
            if (err) {
              console.log(err);
            }
            if (isMatch) {
              return done(null, user);
            } else {
              //password is incorrect
              return done(null, false, { message: "Password is incorrect" });
            }
          });
        } 
        else {
          // No user
          console.log("no user");
          return done(null, false, {
            message: "No user with that email address"
          });
        }
      }
    );
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );
  passport.serializeUser((user, done) => done(null, user.customerid));

  passport.deserializeUser((userid, done) => {
    pool.query(`SELECT * FROM customers WHERE customerid = $1`, [userid], (err, results) => {
      if (err) {
        return done(err);
      }
      return done(null, results.rows[0]);
    });
  });
}

module.exports = initialize;