import Genre from "../models/genre.js";
import Book from "../models/book.js"
import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import debug from "debug";

const genreDebug = debug('genre')

const genre_list = asyncHandler(async (req, res, next) => {
    const allGenres = await Genre.find({}).sort({ name: 1}).exec()

    res.render("genre_list", {
        title: "Genre List",
        genre_list: allGenres
    })
})

const genre_detail = asyncHandler(async (req, res, next) => {
    const [genre, booksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec()
    ])

    if (genre === null) {
        genreDebug(`id not found on detail: ${req.params.id}`)
        const err = new Error("Genre not found")
        err.status = 404
        return next(err)
    }

    res.render("genre_detail", {
        title: "Genre Detail",
        genre: genre,
        genre_books: booksInGenre
    })
})

const genre_create_get = asyncHandler((req, res, next) => {
    res.render("genre_form", { title: "Create Genre", genre: undefined, errors: undefined })
})

const genre_create_post = [
    body("name", "Genre name must contain at least 3 characters")
        .trim()
        .isLength({ min: 3})
        .escape(),

    asyncHandler(async (req, res, next) => {
        const errors = validationResult(req)
        const genre = new Genre({ name: req.body.name })

        if (!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Create Genre",
                genre: genre, 
                errors: errors.array()
            })
            return;
        } else {
            const genreExists = await Genre.findOne({ name: req.body.name }).exec()

            if (genreExists) {
                res.redirect(genreExists.url)
            } else {
                await genre.save()
                res.redirect(genre.url)
            }
        }
    })
]

const genre_delete_get = asyncHandler(async (req, res, next) => {
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id).exec(),
        Book.find({ genre: req.params.id }, "title summary").exec()
    ])

    if (genre === null) {
        res.redirect("/catalog/genres")
    }

    res.render("genre_delete", {
        title: "Delete Genre",
        genre: genre,
        genre_books: allBooksInGenre
    })
})

const genre_delete_post = asyncHandler(async (req, res, next) => {
    const [genre, allBooksInGenre] = await Promise.all([
        Genre.findById(req.params.id),
        Book.find({ genre: req.params.id }).exec()
    ])

    if (allBooksInGenre.length > 0) {
        res.render("genre_delete", {
            title: "Delete Genre",
            genre: genre,
            genre_books: allBooksInGenre
        })
        return
    } else {
        await Genre.findByIdAndDelete(req.body.genreid)
        res.redirect("/catalog/genres")
    }
})

const genre_update_get = asyncHandler(async (req, res, next) => {
    const genre = await Genre.findById(req.params.id)

    if (genre === undefined) {
        genreDebug(`id not found on update: ${req.params.id}`)
        const err = new Error("Genre not found.")
        err.status = 404
        return next(err)
    }

    res.render("genre_form", {
        title: "Update Genre",
        genre: genre,
        errors: []
    })
})

const genre_update_post = [
    body("name", "Genre name must contain at lead 3 characters.")
        .trim()
        .isLength({ min: 3 })
        .escape(),

    asyncHandler( async (req, res, next) => {
        const errors = validationResult(req)

        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        })

        if (!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Update Genre",
                genre: genre,
                errors: errors.array()
            })
            return;
        } else {
            const the_genre = await Genre.findByIdAndUpdate(req.params.id, genre, {})
            res.redirect(the_genre.url)
        }
    })

]

export default {
    genre_list,
    genre_detail,
    genre_create_get,
    genre_create_post,
    genre_delete_get, 
    genre_delete_post,
    genre_update_get,
    genre_update_post,
}
