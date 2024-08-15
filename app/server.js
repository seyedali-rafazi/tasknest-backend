const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
// const allRoutes = require("./router/router");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const createError = require("http-errors");
const path = require("path");
const { allRoutes } = require("./router/router");
dotenv.config();
class Application {
  #app = express();
  #PORT = process.env.PORT || 5000;
  #DB_URI = process.env.APP_DB;

  constructor() {
    this.createServer();
    this.connectToDB();
    this.configServer();
    this.initClientSession();
    this.configRoutes();
    this.errorHandling();
  }
  createServer() {
    this.#app.listen(this.#PORT, () =>
      console.log(`listening on port ${this.#PORT}`)
    );
  }
  connectToDB() {
    console.log("DB_URI:", this.#DB_URI); // Log the value of this.#DB_URI

    // Hardcoded connection string for testing
    const connectionString =
      "mongodb+srv://seyedalirafazi80:U0CuJJlCyLk6Otis@cluster0.pfqeu.mongodb.net/freelancerApp";

    mongoose
      .connect(connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((res) => console.log("MongoDB connected!!"))
      .catch((err) => console.log("Failed to connect to MongoDB", err));
  }
  configServer() {
    this.#app.use(
      cors({
        credentials: true,
        origin: [
          "https://takhasossazan.liara.run",
          "https://hire-freelancer-react.onrender.com",
          "http://localhost:3000",
        ],
      })
    );
    this.#app.use(express.json());
    this.#app.use(express.urlencoded({ extended: true }));
    this.#app.use(express.static(path.join(__dirname, "..")));
  }
  initClientSession() {
    this.#app.use(cookieParser(process.env.COOKIE_PARSER_SECRET_KEY));
  }
  configRoutes() {
    this.#app.use("/api", allRoutes);
  }
  errorHandling() {
    this.#app.use((req, res, next) => {
      next(createError.NotFound("آدرس مورد نظر یافت نشد"));
    });
    this.#app.use((error, req, res, next) => {
      const serverError = createError.InternalServerError();
      const statusCode = error.status || serverError.status;
      const message = error.message || serverError.message;
      return res.status(statusCode).json({
        statusCode,
        message,
      });
    });
  }
}

module.exports = Application;
