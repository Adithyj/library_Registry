require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
            console.error("❌ Error Fetching Collections: ", err);
        } else {
            console.log("📂 Collections: ", collections);
        }
        mongoose.connection.close();
    });
})
.catch((err) => console.error("❌ MongoDB Connection Error: ", err));
