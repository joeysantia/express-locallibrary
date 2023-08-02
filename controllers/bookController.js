import Book from "../models/book.js";
import Author from "../models/author.js"
import Genre from "../models/genre.js"
import BookInstance from "../models/bookinstance.js"
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import debug from 'debug'

const bookDebug = debug('book')

const index = asyncHandler(async (req, res, next) => {
    const [
        numBooks,
        numBookInstances,
        numAvailableBookInstances,
        numAuthors,
        numGenres
    ] = await Promise.all([
        Book.countDocuments({}).exec(),
        BookInstance.countDocuments({}).exec(),
        BookInstance.countDocuments({ status: "Available" }).exec(),
        Author.countDocuments({}).exec(),
        Genre.countDocuments({}).exec()
    ])

    res.render("index", {
        title: "Local Library Home",
        book_count: numBooks,
        book_instance_count: numBookInstances,
        book_instance_available_count: numAvailableBookInstances,
        author_count: numAuthors,
        genre_count: numGenres
    })
})

const book_list = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();
    
  res.render("book_list", { title: "Book List", book_list: allBooks });
});

const book_detail = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate("author").populate("genre").exec(),
        BookInstance.find({ book: req.params.id }).exec()
    ])

    if (book === null) {
        bookDebug(`id not found on detail: ${req.params.id}`)
        const err = new Error("Book not found")
        err.status = 404
        return next(err)
    }

    res.render("book_detail", {
        title: book.title,
        book: book, 
        book_instances: bookInstances
    })
})

const book_create_get = asyncHandler(async (req, res, next) => {
    const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec()
    ])

    res.render("book_form", {
        title: "Create Book",
        authors: allAuthors,
        genres: allGenres,
        book: null,
        errors: null,
    })
})

const book_create_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") {
                req.body.genre = []
            } else {
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },

    body('title', "Title must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "ISBN must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*").escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
        })

        if (!errors.isEmpty()) {
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec()
            ])

            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = 'true'
                }
            }
            res.render("book_form", {
                title: "Create Book",
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array(),
            })
        } else {
            await book.save()
            res.redirect(book.url)
        }
    })
]

const book_delete_get = asyncHandler(async (req, res, next) => {
    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).exec(),
        BookInstance.find({ book: req.params.id }, "imprint status").exec()
    ])

    if (book === null) {
        res.redirect('/catalog/books')
    }

    res.render("book_delete", {
        title: "Delete Book",
        book: book,
        book_instances: bookInstances
    })
})

const book_delete_post = asyncHandler(async (req, res, next) => {

    const [book, bookInstances] = await Promise.all([
        Book.findById(req.params.id).populate("author").exec(),
        BookInstance.find({ book: req.params.id }, "imprint status").exec()
    ])

    if (bookInstances.length > 0) {
        res.render("book_delete", {
            title: "Delete Book",
            book: book,
            book_instances: bookInstances
        })
        return;
    } else {
        console.log(req.body.bookid, book._id)
        await Book.findByIdAndDelete(req.body.bookid)
        res.redirect('/catalog/books')
    }
})

const book_update_get = asyncHandler(async (req, res, next) => {
    const [book, allAuthors, allGenres] = await Promise.all([
        Book.findById(req.params.id).populate("author").populate("genre").exec(),
        Author.find().exec(),
        Genre.find().exec()
    ])

    if (book === null) {
        bookDebug(`id not found on update: ${req.params.id}`)
        const err = new Error("Book not found")
        err.status = 404
        return next(err)
    }

    for (const genre of allGenres) {
        for (const book_g of book.genre) {
            if (genre._id.toString() === book_g._id.toString()) {
                genre.checked = "true"
            }
        }
    }


    res.render("book_form", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres, 
        book: book,
        errors: []
    })
})

const book_update_post = [
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === 'undefined') {
                req.body.genre = []
            } else {
                req.body.genre = new Array(req.body.genre)
            }
        }
        next()
    },

    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 }).
        escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "ISBN must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*").escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)

        const book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
            _id: req.params.id
        })

        if (!errors.isEmpty()) {
            const [allAuthors, allGenres] = await Promise.all([
                Author.find().exec(),
                Genre.find().exec()
            ])

            for (const genre of allGenres) {
                if (book.genre.indexOf(genre._id) > -1) {
                    genre.checked = "true"
                }
            }

            res.render("book_form", {
                title: "Update Book",
                authors: allAuthors,
                genres: allGenres,
                book: book,
                errors: errors.array()
            })
            return
        } else {
            const the_book = await Book.findByIdAndUpdate(req.params.id, book, {})
            res.redirect(the_book.url)
        }
    }),
]

export default {
    index,
    book_list,
    book_detail,
    book_create_get,
    book_create_post,
    book_delete_get, 
    book_delete_post,
    book_update_get,
    book_update_post,
}
