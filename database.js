if (process.env.NODE_ENV != "production") {
  require('dotenv').config();
}

const mongoose = require('mongoose');

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

module.exports = mongoose;

