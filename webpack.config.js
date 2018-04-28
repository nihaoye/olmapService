const path = require('path');
module.exports = {
    entry:'./src/index.js',
    output:{
        filename:'olsv.js',
        path:path.resolve('dist')
    }
};