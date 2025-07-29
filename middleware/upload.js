const upload = require('../config/upload'); 
console.log('upload:', upload);

const uploadEventImage = upload.single('image');

module.exports = uploadEventImage;