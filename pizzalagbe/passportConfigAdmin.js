const LocalStrategy = require("passport-local").Strategy;
const { pool } = require("./dbconfig");
const bcrypt = require("bcrypt");

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await pool.query(
        'SELECT * FROM users WHERE useremail = $1',
        [email]
      );
      if (user.rows.length > 0) {
        const isMatch = await bcrypt.compare(
          password,
          user.rows[0].userpassword
        );
        if (isMatch) {
          return done(null, user.rows[0]);
        } else {
          return done(null, false, { message: 'Password is incorrect' });
        }
      } else {
        return done(null, false, { message: 'No user with that email address' });
      }
    } catch (err) {
      return done(err);
    }
  };

  const authenticateAdmin = async (email, password, done) => {
    try {
      const admin = await pool.query(
        'SELECT * FROM admins WHERE adminemail = $1',
        [email]
      );
      if (admin.rows.length > 0) {
        const isMatch = await bcrypt.compare(
          password,
          admin.rows[0].adminpassword
        );
        if (isMatch) {
          return done(null, admin.rows[0]);
        } else {
          return done(null, false, { message: 'Password is incorrect' });
        }
      } else {
        return done(null, false, { message: 'No admin with that email address' });
      }
    } catch (err) {
      return done(err);
    }
  };

  passport.use(
    'user',
    new LocalStrategy({ usernameField: 'email' }, authenticateUser)
  );

  passport.use(
    'admin',
    new LocalStrategy({ usernameField: 'email' }, authenticateAdmin)
  );

  passport.serializeUser((user, done) => {
    done(null, { id: user.userid || user.adminid, type: user.userid ? 'user' : 'admin' });
  });

  passport.deserializeUser(async (data, done) => {
    const { id, type } = data;
    const table = type === 'user' ? 'users' : 'admins';
    const idField = type === 'user' ? 'userid' : 'adminid';
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = $1`, [id]);
      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
