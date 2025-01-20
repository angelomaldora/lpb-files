const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const initializePassport = require("./passportConfig");

const app = express();
const PORT = process.env.PORT || 3000;

initializePassport(passport);

app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Route to display all users
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.users");
    res.render("index", { users: result.rows });
  } catch (err) {
    console.error(err);
    res.send("Error fetching users");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
