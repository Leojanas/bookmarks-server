require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')
const winston = require('winston')
const {v4: uuid} = require('uuid')
const {bookmarks} = require('./store')
const BookmarksService = require('./bookmarks-service')

const app = express()

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'info.log' })
  ]
})

if (NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';


app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json())

/*app.use(function validateBearerToken(req, res, next) {
  const apiToken = process.env.API_TOKEN
  const authToken = req.get('Authorization')

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    return res.status(401).json({ error: 'Unauthorized request' })
  }
  next()
})*/

app.get('/', (req,res)=>{
    res.send('Hello, world!')
})

app.get('/bookmarks', (req,res, next)=>{
  const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
      })
      .catch(next)
})

app.get('/bookmarks/:id', (req,res, next)=>{
  const {id} = req.params;
  const knexInstance = req.app.get('db')
  BookmarksService.getBookmarkById(knexInstance, id)
    .then(bookmark => {
      if(!bookmark){
        logger.error(`Bookmark with id ${id} not found.`)
        return res.status(404).json({"error": "Not Found"})
      }
      res.json(bookmark)
    })
    .catch(next)
})

app.post('/bookmarks', (req,res)=>{
    const {title, url, rating, desc} = req.body;
    if(!title){
      logger.error('Title required')
      return res.status(400).json({"error": "Invalid Data"})
    }
    if(!rating){
      logger.error('Rating required')
      return res.status(400).json({"error": "Invalid Data"})
    }
    if(!url){
      logger.error('Url required')
      return res.status(400).json({"error": "Invalid Data"})
    }
    if(!desc){
      logger.error('Description required')
      return res.status(400).json({"error": "Invalid Data"})
    }
    const id = uuid();
    const bookmark = {
      id,
      title,
      url,
      rating,
      desc
    }
    bookmarks.push(bookmark)
    logger.info(`Bookmark with id ${id} created.`)
    res
      .status(201)
      .location(`http://localhost:8000/list/${id}`)
      .json({id});
})

app.delete('/bookmarks/:id', (req, res)=> {
    const {id} = req.params;
    const bookmark = bookmarks.find(b => b.id == id);
    console.log(bookmark)
    if(!bookmark){
      logger.error(`Bookmark with id ${id} not found.`)
      return res.status(404).json({"error": "Not Found"})
    }
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);
    bookmarks.splice(id,1);
    logger.info(`Bookmark with id ${id} deleted.`)
    res 
      .status(204)
      .end()
})

app.use(function errorHandler(error, req, res, next) {
   let response
   if (NODE_ENV === 'production') {
      response = { error: { message: 'server error' } }
    }else{
         console.error(error)
         response = { message: error.message, error }
    }
    res.status(500).json(response)
})

module.exports = app