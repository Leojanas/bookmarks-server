const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const {makeBookmarksArray} = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', () => {
    let db
    before('set up knex', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
    })
    after('disconnect from db', () => db.destroy())
    before('clean the table', () => db('bookmarks').truncate())
    afterEach('cleanup', () => db('bookmarks').truncate())
    describe('GET /bookmarks endpoint', () => {
        context('Given bookmarks table has no data', () => {
            it('returns an empty array', () => {
                supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })
        context('Given bookmarks table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('seed table', () => {
                db('bookmarks').insert(testBookmarks)
            })
            it('returns the bookmarks array', () => {
                supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })
    })
    describe('GET /bookmarks/:id endpoint', () => {
        context('Given bookmarks table has no data', () => {
            it('returns not found error', () => {
                supertest(app)
                    .get('/bookmarks/3')
                    .expect(404)
            })
        })
        context('Given bookmarks table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('seed table', () => {
                db('bookmarks').insert(testBookmarks)
            })
            it('returns the correct bookmark if it exists', () => {
                supertest(app)
                    .get('./bookmarks/1')
                    .expect(200, testBookmarks[0])
            })
            it('returns 404 if the id does not exist', () => {
                supertest(app)
                    .get('./bookmarks/12')
                    .expect(404)
            })
        })
    })
})