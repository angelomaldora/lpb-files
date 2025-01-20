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

app.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM public.users");
    console.log(rows); // Log all users
    res.render("index", { users: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post("/users/register", async (req, res) => {
  const { name, email, password, password2 } = req.body;
  const errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  } else if (password.length < 6) {
    errors.push({ message: "Password must be at least 6 characters long" });
  } else if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    return res.render("register", { errors, name, email, password, password2 });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await pool.query("SELECT * FROM public.users WHERE email = $1", [email]);

    if (existingUser.rows.length > 0) {
      return res.render("register", { message: "Email already registered" });
    }

    await pool.query(
      "INSERT INTO public.users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );
    req.flash("success_msg", "You are now registered. Please log in");
    res.redirect("/users/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
