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

/*@ here we include contactRouter @*/
const Contact = require('./routes/Contact')
app.use('/contact', Contact)
/*@ here we include contactRouter @*/

/*@ here we include userRouter @*/
const User = require('./routes/User')
app.use('/user', User)
/*@ here we include userRouter @*/

/*@ here we include profileRouter @*/
const Profile = require('./routes/Profile')
app.use(`/Profile`, Profile)
/*@ here we include profileRouter @*/

/*@ here we include courseRouter @*/
const Explore = require('./routes/Explore')
app.use('/explore', Explore)
/*@ here we include courseRouter @*/

/*@ here we include courseRouter @*/
const Courses = require('./routes/Courses')
app.use('/courses', Courses)
/*@ here we include courseRouter @*/

/*@ here we include bookRouter @*/
const Book = require('./routes/Book')
app.use('/book', Book)
/*@ here we include bookRouter @*/

/*@ here we include courseRouter @*/
const Course = require('./routes/Course')
app.use('/course', Course)
/*@ here we include courseRouter @*/

/*@ here we include chatRouter @*/
const Chat = require('./routes/Chat')
app.use(`/chat`, Chat)
/*@ here we include chatRouter @*/

/*@ here we include roleRouter @*/
const Setting = require('./routes/Setting')
app.use('/settings', Setting)
/*@ here we include courseRouter @*/

/*@ here we include coursesRouter @*/
const Notification = require('./routes/Notification')
app.use('/notifications', Notification)
/*@ here we include coursesRouter @*/

/*@ here we include roleRouter @*/
const Dashboard = require('./routes/Dashboard')
app.use('/dashboard', Dashboard)
/*@ here we include courseRouter @*/

/*@ Handle Error-404 @*/
app.get('*', (req, res, next) => {
    res.redirect('/');
    next()
})
/*@ Handle Error-404 @*/

// setup event listener
const User_model = require('./models/User')
const Course_model = require('./models/Course')
const Chat_model = require('./models/Chat')
const UsersService = require('./UsersService')
const userService = new UsersService()
app.set('userService', userService);
io.on('connection', socket => {
    
    socket.on('join', (data) => {
        userService.addUser({ socketID: socket.id, userID: data })
        console.log("After Connected");
        console.log(userService.getAllUsers());
    })
    socket.on('disconnect', () => {
        userService.removeUser(socket.id);
        console.log("After Disconnected");
        console.log(userService.getAllUsers());
    })

    // Join to the Room
    socket.on('joinRoom', async (data) => {
        try {
            console.log(`Room ID is ${ data.roomID }`)
            socket.join(data.roomID);
        } catch(err) {
            socket.emit('error', {
                statusCode: 500,
                msgDev: err.message,
                msgUser: 'Something went wrong'
            })
        }
    })

    socket.on('chatMessage', async (data) => {
        try {
            const { roomID, userID, message } = data;
            if(!roomID || !userID || !message) {
                socket.emit('error', {
                    statusCode: 400,
                    msgDev: 'One of the sent data is empty',
                    msgUser: 'One of the sent data is empty'
                })
            }
            const course = await Course_model.findById({ _id: roomID });
            const user = await User_model.findById({ _id: userID });

            if(!course || !user) {
                socket.emit('error', {
                    statusCode: 404,
                    msgDev: 'The Course or user is not found on our system',
                    msgUser: 'Something went wrong'
                })
            }
            if(course.users.includes(user._id) || course.instructorID.equals(user._id)) {
                const messageContent = await new Chat_model({ roomID: course._id, userID: user._id, message: message  }).save()
                await Chat_model.populate(messageContent, { path:"userID" });
                io.to(messageContent.roomID).emit('chatMessage', messageContent)
            }
        } catch(err) {
            socket.emit('error', {
                statusCode: 500,
                msgDev: err.message,
                msgUser: 'Something went wrong'
            })
        }
    });

})
const port = process.env.PORT || 3000;
http.listen(port, () => {
    console.log('Running on Port: 3000')
})


