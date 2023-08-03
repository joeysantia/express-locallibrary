import BookInstance from "../models/bookinstance.js";
import Book from "../models/book.js"
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import debug from "debug";

const bookinstanceDebug = debug("bookinstance")

const bookinstance_list = asyncHandler(async (req, res, next) => {
    const allBookInstances = await BookInstance.find().populate("book").exec()

    res.render("bookinstance_list", {
        title: "Book Instance List",
        bookinstance_list: allBookInstances
    })
})

const bookinstance_detail = asyncHandler(async (req, res, next) => {
    
    const bookInstance = await BookInstance.findById(req.params.id)
        .populate("book")
        .exec()

    if (bookInstance === null) {
        bookinstanceDebug(`id not found on detail: ${req.params.id}`)
        let err = new Error("Book copy not found")
        err.status = 404
        return next(err)
    }

    res.render("bookinstance_detail", {
        title: "Book:",
        bookinstance: bookInstance
    })
    
})

const bookinstance_create_get = asyncHandler(async (req, res, next) => {
    const allBooks = await Book.find({}, "title").exec()

    res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        bookinstance: null,
        errors: null,
        selected_book: null  
    })
})

const bookinstance_create_post = [
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    
    asyncHandler(async (req, res, next) => {

        const errors = validationResult(req)

        console.log(req.body.due_back)

        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        })

        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").exec()

            res.render("bookinstance_form", {
                title: "Create BookInstance",
                book_list: allBooks,
                selected_book: bookinstance.book._id,
                errors: errors.array(),
                bookinstance: bookinstance,
            })
            return;
        } else {
            await bookinstance.save()
            res.redirect(bookinstance.url)
        }

    })

]


const bookinstance_delete_get = asyncHandler(async (req, res, next) => {
    const bookInstance = await BookInstance.findById(req.params.id)

    if (bookInstance === null) {
        res.redirect('/catalog/bookinstances')
    }
    
    res.render("bookinstance_delete", {
        title: "Delete Book Instance",
        bookinstance: bookInstance
    })
})

const bookinstance_delete_post = asyncHandler(async (req, res, next) => {
    await BookInstance.findByIdAndDelete(req.body.bookinstanceid)
    res.redirect('/catalog/bookinstances')
})

const bookinstance_update_get = asyncHandler(async (req, res, next) => {
    const [bookinstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).exec(),
        Book.find({}, "title").exec()
    ])

    if (bookinstance === null) {
        bookinstanceDebug(`id not found on update: ${req.params.id}`)
        const err = new Error("The BookInstance was not found.")
        err.status = 404
        return next(err)
    }

    res.render("bookinstance_form", {
        title: "Update BookInstance",
        book_list: allBooks,
        bookinstance: bookinstance,
        selected_book: bookinstance.book._id,
        errors: []
    })
})

const bookinstance_update_post = [
    body("book", "Book must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    asyncHandler(async (req, res, next) => {

        const errors = validationResult(req)


        const bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id
        })

        if (!errors.isEmpty()) {
            const allBooks = await Book.find({}, "title").exec()

            res.render("bookinstance_form", {
                title: "Update BookInstance",
                bookinstance: bookinstance, 
                selected_book: bookinstance.book._id,
                book_list: allBooks,
                errors: errors.array()
            })
            return; 
        } else {
            const the_bookinstance = await BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {})
            res.redirect(the_bookinstance.url)

        }
    })
]

export default {
    bookinstance_list,
    bookinstance_detail,
    bookinstance_create_get,
    bookinstance_create_post,
    bookinstance_delete_get, 
    bookinstance_delete_post,
    bookinstance_update_get,
    bookinstance_update_post,
}
