const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require('express-session');
const collection = require("./config");
const cors = require('cors');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.name) {
        next();
    } else {
        res.redirect('/login');
    }
}

const orderSchema = new mongoose.Schema({
    userName: String, 
    items: [
        {
            itemName: String,
            price: Number,
        },
    ],
    total: Number,
    orderTime: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', orderSchema);

// Admin Authentication State
let adminLoggedIn = false;

// Routes

app.get('/', (req, res) => {
    res.render('index');
});

// Signup page route
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Handle user signup
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).send(`
                <h1>User with this email already exists!</h1>
                <b><a href="/signup">Sign Up Again</a></b>
            `);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await collection.create({
            name,
            email,
            password: hashedPassword,
        });

        console.log('User created:', user);
        res.redirect('/login');
    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).send(`
            <h1>Signup Failed</h1>
            <b><a href="/signup">Try Again</a></b>
        `);
    }
});

// Login page route
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle user login
app.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const checkUser = await collection.findOne({ name });
        if (!checkUser) {
            return res.status(404).send(`
                <h1>User Not Found</h1>
                <b><a href="/login">Try Again</a></b>
            `);
        }

        const passwordCheck = await bcrypt.compare(password, checkUser.password);
        if (passwordCheck) {
            req.session.name = name;
            res.redirect('/home');
        } else {
            res.status(401).send(`
                <center><h1>Wrong Password!</h1>
                <b><a href="/login">Try Again</a></b></center>
            `);
        }
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).send(`
            <center><h1>Login Failed</h1>
            <b><a href="/login">Try Again</a></b></center>
        `);
    }
});

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Home route
app.get('/home', isAuthenticated, (req, res) => {
    const name = req.session.name;
    res.render('home', { name });
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send(`
                <center><h1>Failed to Logout</h1>
                <b><a href="/home">Try Again</a></b></center>
            `);
        }
        res.redirect('/');
    });
});

// Cart routes
app.post('/cart', async (req, res) => {
    const { username, itemName, price } = req.body;

    if (!username || !itemName || !price) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const order = new Order({ username, itemName, price });
    try {
        await order.save();
        res.status(201).json({ message: 'Item added to cart!', order });
    } catch (err) {
        console.error('Error saving item:', err);
        res.status(500).json({ message: 'Failed to add item to cart' });
    }
});

app.get('/cart', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const userOrders = await Order.find({ username }).sort({ orderTime: -1 });
        res.json(userOrders);
    } catch (err) {
        console.error('Error fetching cart items:', err);
        res.status(500).json({ message: 'Failed to fetch cart items' });
    }
});

// Admin login route
app.get('/admin', (req, res) => {
    res.render('admin');
});
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin@123') {
        return res.render('admin-dashboard', { username });
    } else {
        res.status(401).render('admin', { error: 'Invalid username or password!' });
    }
});


// Admin dashboard route
app.get('/admin/dashboard', (req, res) => {
    if (!adminLoggedIn) {
        return res.status(403).send(`   
            <h1>Unauthorized Access!</h1>
            <b><a href="/admin">Admin Login</a></b>
        `);
    }
    res.render('admin');
});


// Get all orders for admin
app.get('/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});


// Admin logout route
app.get('/admin/logout', (req, res) => {
    adminLoggedIn = false;
    res.redirect('/admin');
});


// Contact Us, About Us, and Menu routes
app.get('/contactus', isAuthenticated, (req, res) => {
    res.render("contactus");
});

app.get('/aboutus', isAuthenticated, (req, res) => {
    res.render('aboutus');
});

app.get('/menu', isAuthenticated, (req, res) => {
    const userName = req.session.name;
    console.log('Logged-in user:', userName);
    res.render('menu', { user: { name: userName } }); 
});


app.post('/api/orders', async (req, res) => {
    try {
        const { cart, total } = req.body;

        if (!cart || cart.length === 0) {
            return res.status(400).json({ message: "Cart is empty!" });
        }

        const newOrder = new Order({
            items: cart,
            totalPrice: total,
            orderTime: new Date(),
        });

        await newOrder.save();

        res.status(201).json({ message: "Order placed successfully!" });
    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).json({ message: "Failed to place order." });
    }
});


// Place an order
app.post('/order', async (req, res) => {
    const { userName, items, total } = req.body;

    if (!userName || !items.length || total <= 0) {
        return res.status(400).json({ message: 'Invalid order details' });
    }

    try {
        const order = new Order({ userName, items, total });
        await order.save();
        res.status(200).json({ message: 'Order placed successfully' });
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ message: 'Failed to place order' });
    }
});

app.delete('/admin/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        await Order.findByIdAndDelete(orderId);
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Failed to delete order:', error);
        res.status(500).json({ message: 'Failed to delete order' });
    }
});

// 404 route
app.use((req, res) => {
    res.status(404).render("404");
});

// Start the server
const port = 8383;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});