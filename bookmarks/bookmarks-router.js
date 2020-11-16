const express = require('express')
const bookmarksService = require('./bookmarks-service')
const logger = require('../src/logger')
const xss = require('xss')
const { isWebUri } = require('valid-url')
const path = require('path')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const sanitizeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: Number(bookmark.rating)
})

bookmarksRouter
    .route('/')
    .get((req,res, next) => {
        bookmarksService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                res.json(bookmarks.map(sanitizeBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req,res,next) => {
        for(const field of ['title', 'url', 'rating']){
            if(!req.body[field]){
                logger.error(`${field} is required.`)
                return res.status(400).send({
                    error: {message: 'Invalid data'}
                })
            }
        }
        const {title, url, description, rating} = req.body
        const ratingNum = Number(rating)
        if(!Number.isInteger(ratingNum)|| 0 > ratingNum || 5 < ratingNum){
            logger.error(`Number must be integer between 0 and 5 inclusive.`)
            return res.status(400).send({
                error: {message: 'Invalid data.'}
            })
        }
        if(!isWebUri(url)){
            logger.error(`Url must be a valid url.`)
            return res.status(400).send({
                error: {message: 'Invalid data.'}
            })
        }
        const newBookmark = {title, url, description, rating}
        bookmarksService.insertBookmark(req.app.get('db'), newBookmark)
            .then(bookmark => {
                logger.info(`Bookmark with id ${bookmark.id} created.`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
                    .json(sanitizeBookmark(bookmark))
            })
            .catch(next)
    })

bookmarksRouter
    .route('/:id')
    .all((req,res,next) => {
        const {id} = req.params
        bookmarksService.getBookmarkById(req.app.get('db'), id)
        .then(bookmark => {
            if(!bookmark){
                logger.error(`Bookmark with id ${id} not found.`)
                return res.status(404).json({"error": {"message": "Bookmark not found."}})
            }
            res.bookmark = bookmark
            next()
        })
        .catch(next)
    })
    .get((req,res, next) => {
        res.json(sanitizeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        const {id} = req.params
        bookmarksService.deleteBookmark(req.app.get('db'), id)
            .then(() => {
                logger.info(`Bookmark with id ${id} deleted.`)
                res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const {title, url, description, rating} = req.body
        const updates = {title, url, description, rating}
        const numberOfFields = Object.values(updates).filter(Boolean).length
        if(numberOfFields == 0){
            return res.status(400).json({
                error: {message: 'Invalid data, must contain fields to update.'}
            })
        }
        bookmarksService.updateBookmark(req.app.get('db'), req.params.id, updates)
            .then(() => {
                logger.info(`Bookmark with id ${req.params.id} updated.`)
                res.status(204).end()
            })
    })

module.exports = bookmarksRouter