import createError from 'http-errors';
import express from "express"
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from "morgan"
import indexRouter from "./routes/index.js"
import usersRouter from "./routes/users.js"
import catalogRouter from "./routes/catalog.js"
import mongoose from 'mongoose';
import dotenv from 'dotenv'
import compression from 'compression'
import helmet from 'helmet'
import RateLimit from 'express-rate-limit'

var app = express()
dotenv.config()
const __dirname = path.resolve()

//Set up mongoose connection
mongoose.set("strictQuery", false)
main().catch(err => console.log(err))

async function main() {
  console.log('connection initializing...')
  await mongoose.connect(process.env.MONGODB_KEY)
  console.log('connection successful')
}

const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20
})

app.use(limiter)
app.use(compression())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "code.jquery.com", "cdn.jsdelivr.net"],
    }
  })
)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter)
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
