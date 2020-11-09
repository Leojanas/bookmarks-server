function makeBookmarksArray() {
    return [
      {
        id: 1,
        title: 'Google',
        url: 'www.google.com',
        description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
        rating: 5 
      },
      {
        id: 2,
        title: 'Weather',
        url: 'www.weather.com',
        description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
        rating: 3 
      },
      {
        id: 3,
        title: 'Wikipedia',
        url: 'www.wikipedia.com',
        description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
        rating: 4 
      },
    ];
  }
  
  module.exports = {
    makeBookmarksArray,
  }