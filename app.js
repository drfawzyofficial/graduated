/*@ here we include express-framework @*/
const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http) 
app.set("io", io);
/*@ here we include express-framework @*/

/*@ here we include third-party middleware => responseTime @*/
const responseTime = require('response-time')
app.use(responseTime())
/*@ here we include third-party middleware => responseTime @*/

/*@ here we include third-party middleware => Morgan @*/
const morgan = require('morgan')
app.use(morgan('dev'))
/*@ here we include third-party middleware => Morgan @*/

/*@ here we include third-party middleware => Cookie-Parser @*/
const cookieParser = require('cookie-parser')
app.use(cookieParser())
/*@ here we include third-party middleware => Cookie-Parser @*/

/*@ here we connect to DB @*/
require('./Connection/mongoose')
/*@ here we connect to DB @*/

/*@ here we include static-files @*/
const path = require('path');
app.use('/assets', express.static(path.join(__dirname, 'assets')));
/*@ here we include static-files @*/

/*@ Passport Configuration @*/
require('./config/passport')
/*@ Passport Configuration @*/


/*@ here we set-up body-parser @*/
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
/*@ here we set-up body-parser @*/


/*@ here we set-up template-engine @*/
app.set('view engine', 'ejs')
/*@ here we set-up template-engine @*/

// session as flash needs to session
const session = require('express-session')
app.use(session({
    secret: 'mySecret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 259200000054564564564645 }
}))
// falsh 
const flash = require('connect-flash')
app.use(flash())

/*@ here is special @*/

/*@ Passport middleware @*/
const passport = require('passport')
app.use(passport.initialize())
app.use(passport.session())
/*@ Passport middleware @*/


/*@ Global variables @*/
app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    res.locals.errors = req.flash('errors')
    res.locals.user = req.user || null
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
    next()
})
/*@ Global variables @*/


/*@ here we include homeRouter @*/
const Index = require('./routes/Index')
app.use('/', Index)
/*@ here we include homeRouter @*/

/*@ here we include aboutRouter @*/
const About = require('./routes/About')
app.use('/about', About)
/*@ here we include aboutRouter @*/

/*@ here we include contactRouter @*/
const Contact = require('./routes/Contact')
app.use('/contact', Contact)
/*@ here we include contactRouter @*/

/*@ here we include terms @*/
const Terms = require('./routes/Terms')
app.use('/terms', Terms)
/*@ here we include terms @*/

/*@ here we include privacy @*/
const Privacy = require('./routes/Privacy')
app.use('/privacy', Privacy)
/*@ here we include privacy @*/

/*@ here we include userRouter @*/
const User = require('./routes/User')
app.use('/user', User)
/*@ here we include userRouter @*/


/*@ here we include profileRouter @*/
const Profile = require('./routes/Profile')
app.use(`/Profile`, Profile)
/*@ here we include profileRouter @*/

/*@ here we include courseRouter @*/
const Course = require('./routes/Course')
app.use('/course', Course)
/*@ here we include courseRouter @*/

/*@ here we include faqRouter @*/
const Faq = require('./routes/Faq')
app.use('/faq', Faq)
/*@ here we include faqRouter @*/

/*@ here we include roleRouter @*/
const Setting = require('./routes/Setting')
app.use('/settings', Setting)
/*@ here we include courseRouter @*/

/*@ here we include coursesRouter @*/
const Courses = require('./routes/Courses')
app.use('/courses', Courses)
/*@ here we include coursesRouter @*/

/*@ here we include roleRouter @*/
const Dashboard = require('./routes/Dashboard')
app.use('/dashboard', Dashboard)
/*@ here we include courseRouter @*/

/*@ here we include chatRouter @*/
const chatRouter = require('./routes/chatRouter')
app.use(`/chat`, chatRouter)
/*@ here we include chatRouter @*/

/*@ here we include chatRouter @*/
const chatRouterA = require('./routes/chatroute')
app.use(`/fetchData`, chatRouterA)
/*@ here we include chatRouter @*/

/*@ Handle Error-404 @*/
// app.get('*', (req, res, next) => {
//     res.render('English/Error')
//     next()
// })
/*@ Handle Error-404 @*/

//setup event listener
// const User = require('./models/user')
// const Course = require('./models/Course')
const Chat = require('./models/chat')
const UsersService = require('./UsersService')
const userService = new UsersService()
io.on('connection', socket => {
    socket.on('join', data => {
      userService.addUser({ socketID: socket.id, userID: data })
      console.log('After Connected')
      console.log(userService.getAllUsers())
    })
    socket.on('disconnect', () => {
      userService.removeUser(socket.id)
      console.log('After Disconnected')
      console.log(userService.getAllUsers())
    })
    socket.on('sendMessage', async data => {
      if(data.message.trim().length === 0) {
        socket.emit('emptyMessage', 'Message cannot be empty')
      } else {
      let user = await User.findById({ _id: data.senderID })
      io.sockets.emit('received', { user: user, message: data.message })
      new Chat({ 
        message: data.message, 
        courseID: data.courseID, 
        senderID: data.senderID 
      }).save((err, result) => {
        if(err) console.log(err.message)
        else console.log(`${result} has been saved to mongoDB successfully`)
      })
    }
    })


   
  
    //Someone is typing
    // socket.on('typing', data => {
    //   socket.broadcast.emit('notifyTyping', {
    //     user: data.user,
    //     message: data.message
    //   })
    // })
  
    //when soemone stops typing
  //   socket.on('stopTyping', () => {
  //     socket.broadcast.emit('notifyStopTyping')
  //   })
  
  //   socket.on('chat message', function(msg) {  
  //     socket.broadcast.emit('received', { message: msg })
  //   })
  // })
})
http.listen(3000, () => {
    console.log('Running on Port: 3000')
})

