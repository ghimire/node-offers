node-offers
============ 
@author: ghimire  
@version: v1.0.0  
  
Offers and Deals Platform written in Node.js    
  
INSTALLATION  
============  
1. Install packages from package.json  
2. Copy config.js.sample to config.js  
  
To enable storing images and logos to S3, set `S3_STORAGE` to `true` and `AWS_KEY`, `AWS_SECRET` and `AWS_BUCKET` to their correct values in _config.js_.   
  
To start,  
`$ node app.js`
  
For development it is recommended to use nodemon package (sudo npm -g install nodemon):  
`$ nodemon app.js`