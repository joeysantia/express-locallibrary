import { body, validationResult } from "express-validator";
import Author from "../models/author.js";
import Book from "../models/book.js"
import asyncHandler from "express-async-handler";
import debug from 'debug'

const authorDebug = debug("author")

const author_list = asyncHandler(async (req, res, next) => {
    const allAuthors = await Author.find().sort({ family_name: 1}).exec()

    res.render("author_list", {
        title: "Author List",
        author_list: allAuthors
    })
})

const author_detail = asyncHandler(async (req, res, next) => {
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ])

    if (author === null) {
        authorDebug(`id not found on detail: ${req.params.id}`)
        const err = new Error("Author not found")
        err.status = 404;
        return next(err)
    }

    res.render("author_detail", {
        title: "Author Detail",
        author: author,
        author_books: allBooksByAuthor
    })
})

const author_create_get = asyncHandler(async (req, res, next) => {
    res.render("author_form", {
        title: "Create Author",
        author: null,
        errors: null
    })
})

const author_create_post = [
    body("first_name")
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

    asyncHandler(async (req, res, next) => {

        const errors = validationResult(req)

        const author = new Author({
            first_name: req.body.first_name,
            family_name: req.body.family_name,
            date_of_birth: req.body.date_of_birth,
            date_of_death: req.body.date_of_death
        })

        if (!errors.isEmpty()) {
            res.render('author_form', {
                title: "Create Author",
                author: author,
                errors: errors.array()
            })
            return
        } else {
            await author.save()
            res.redirect(author.url)
        }
    })
]

const author_delete_get = asyncHandler(async (req, res, next) => {
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ])

    if (author === null) {
        res.redirect("/catalog/authors")
    }

    res.render("author_delete", {
        title: "Delete Author",
        author: author,
        author_books: allBooksByAuthor
    })
})

const author_delete_post = asyncHandler(async (req, res, next) => {
    const [author, allBooksByAuthor] = await Promise.all([
        Author.findById(req.params.id).exec(),
        Book.find({ author: req.params.id }, "title summary").exec()
    ])

    if (allBooksByAuthor.length > 0) {
        res.render("author_delete", { 
            title: "Delete Author",
            author: author,
            author_books: allBooksByAuthor
        })
        return
    } else {
        await Author.findByIdAndRemove(req.body.authorid)
        res.redirect("/catalog/authors")
    }
})

const author_update_get = asyncHandler(async (req, res, next) => {
    const author = await Author.findById(req.params.id).exec()
    
    if (author === null) {
        // No results.
        authorDebug(`id not found on update: ${req.params.id}`);
        const err = new Error("Author not found");
        err.status = 404;
        return next(err);
      }

    res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: []
    })
})

const author_update_post = [
    body("first_name")
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters."),
    body("family_name")
        .trim()
        .isLength({ min: 1})
        .escape()
        .withMessage("Family name must be specified.")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters."),
    body("date_of_birth", "Invalid date of birth")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),
    body("date_of_death", "Invalid date of death")
        .optional({ values: "falsy" })
        .isISO8601()
        .toDate(),

        asyncHandler(async (req, res, next) => {

            const errors = validationResult(req)

    
            const author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            })

            console.log(author.date_of_birth, author.date_of_death)

    
            if (!errors.isEmpty()) {
                res.render('author_form', {
                    title: "Update Author",
                    author: author,
                    errors: errors.array()
                })
                return
            } else {
                const the_author = await Author.findByIdAndUpdate(req.params.id, author, {})
                res.redirect(the_author.url)       
            }
        })
]

export default {
    author_list,
    author_detail,
    author_create_get,
    author_create_post,
    author_delete_get, 
    author_delete_post,
    author_update_get,
    author_update_post,
}
