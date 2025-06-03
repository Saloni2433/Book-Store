const express = require('express');

const port = 9000;

const app = express();

const db = require('./config/database');

const Book = require('./models/table');

const path = require('path');

const fs = require('fs');

const multer = require('multer');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Multer configuration
const fileUpload = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const imageUpload = multer({
    storage: fileUpload
}).single('image');

// Routes
app.get('/', (req, res) => {
    Book.find({}).then((books) => {
        return res.render('form', {
            books: books
        });
    });
});

app.post('/insertData', imageUpload, (req, res) => {
    let updateId = req.body.updateId;
    const { title, author, isbn, publishDate, price, rating, genre, description, language, pageCount } = req.body;

    if (updateId) {
        if (req.file) {
            Book.findById(updateId).then((oldBook) => {
                if (oldBook && oldBook.image) {
                    try {
                        fs.unlinkSync(oldBook.image);
                    } catch (err) {
                        console.log(err);
                    }
                }
                let image = req.file.path;
                Book.findByIdAndUpdate(updateId, {
                    title,
                    author,
                    isbn,
                    publishDate,
                    price,
                    rating,
                    genre,
                    description,
                    language,
                    pageCount,
                    image
                }).then(() => {
                    console.log("Book Updated Successfully...");
                    return res.redirect('/');
                });
            });
        } else {
            Book.findByIdAndUpdate(updateId, {
                title,
                author,
                isbn,
                publishDate,
                price,
                rating,
                genre,
                description,
                language,
                pageCount
            }).then(() => {
                console.log("Book Updated Successfully...");
                return res.redirect('/');
            });
        }
    } else {
        Book.create({
            title,
            author,
            isbn,
            publishDate,
            price,
            rating,
            genre,
            description,
            language,
            pageCount,
            image: req.file.path
        }).then(() => {
            console.log("Book Added Successfully");
            return res.redirect('/');
        });
    }
});

app.get('/deleteData/:id', (req, res) => {
    let id = req.params.id;

    Book.findById(id).then((book) => {
        if (book && book.image) {
            try {
                fs.unlinkSync(book.image);
            } catch (err) {
                console.log(err);
            }
        }
        return Book.findByIdAndDelete(id);
    }).then(() => {
        console.log("Book Deleted Successfully..");
        return res.redirect('/');
    });
});

app.get('/updateData', (req, res) => {
    let id = req.query.id;

    Book.findById(id).then((book) => {
        return res.render('update', { book });
    });
});

// Start server
app.listen(port, () => {
    console.log("Server running at http://localhost:" + port);
});