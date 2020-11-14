const { expect } = require('chai')
const knex = require('knex')
const supertest = require('supertest')
const app = require('../src/app')
const {makeBookmarksArray, makeMaliciousBookmark} = require('./bookmarks.fixtures')

describe('Bookmarks Endpoints', () => {
    let db
    before('set up knex and clean', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
        db('bookmarks').truncate()
    })
    after('disconnect from db', () => db.destroy())
    afterEach('cleanup', () => db('bookmarks').truncate())
    describe('GET /bookmarks endpoint', () => {
        context('Given bookmarks table has no data', () => {
            it('returns an empty array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, [])
            })
        })
        context('Given bookmarks table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('seed table', () => {
                return db('bookmarks').insert(testBookmarks)
            })
            it('returns the bookmarks array', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200, testBookmarks)
            })
        })
        context('Given a malicious xss bookmark', () => {
            const {maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()
            beforeEach('seed with malicious bookmark', () => {
                return db('bookmarks').insert(maliciousBookmark)
            })
            it('Returns the sanitized bookmark', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedBookmark.title)
                        expect(res.body[0].description).to.eql(expectedBookmark.description)
                    })

            })
        })
    })
    describe('GET /bookmarks/:id endpoint', () => {
        context('Given bookmarks table has no data', () => {
            it('returns not found error', () => {
                return supertest(app)
                    .get('/bookmarks/3')
                    .expect(404)
            })
        })
        context('Given bookmarks table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('seed table', () => {
                return db('bookmarks').insert(testBookmarks)
            })
            it('returns the correct bookmark if it exists', () => {
                return supertest(app)
                    .get('/bookmarks/1')
                    .expect(200, testBookmarks[0])
            })
            it('returns 404 if the id does not exist', () => {
                return supertest(app)
                    .get('/bookmarks/12')
                    .expect(404)
            })
        })
    })
    describe('POST /bookmarks endpoint', () => {
        context('Given a malicious xss attack', () => {
            const {maliciousBookmark, expectedBookmark} = makeMaliciousBookmark()
            it('Sanitizes the xss attack', () => {
                return supertest(app)
                    .post('/bookmarks')
                    .send(maliciousBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedBookmark.title)
                        expect(res.body.description).to.eql(expectedBookmark.description)
                    })

            })
        })
        it('Posts a bookmark and returns the bookmark', () => {
            const testBookmarks = makeBookmarksArray()
            const testBookmark = {
                title: testBookmarks[0].title,
                url: testBookmarks[0].url,
                description: testBookmarks[0].description,
                rating: testBookmarks[0].rating
            }
            return supertest(app)
                .post('/bookmarks')
                .send(testBookmark)
                .expect(201)
                .then(res => {
                    expect(res.body).to.eql(testBookmarks[0])
                })
        })
    })
    describe('DELETE /bookmarks/:id endpoint', () => {
        context('Given bookmarks table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('seed table', () => {
                return db('bookmarks').insert(testBookmarks)
            })
            it('returns 404 if bookmark does not exist', () => {
                return supertest(app)
                    .delete('/bookmarks/15')
                    .expect(404, {
                        error: {message: 'Bookmark not found.'}
                    })
            })
            it('successfully deletes the bookmark if it exists', () => {
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== 2)
                return supertest(app)
                    .delete('/bookmarks/2')
                    .expect(204)
                    .then(() => {
                        supertest(app)
                            .get('bookmarks')
                            .expect(200, expectedBookmarks)
                    })

            })
        })
    })
})