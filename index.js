const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./utils/dbConnection'); 
const publicApiRoutes = require('./routes/publicApiRoutes');
const { trackDeposits } = require('./controllers/commentController');
const { trackMarketValue } = require('./controllers/tokenCoinController');

 
connectDatabase();
 

const app = express ();
app.use(cors({
    origin: "*", // Replace with your allowed origins
}));
app.use(express.json());
const PORT = process.env.PORT || 3000;


setInterval(() => {
        trackDeposits()
        trackMarketValue()
}, 15000);

app.use("/api/cpump",  publicApiRoutes);


 
app.listen(PORT, () => {
    console.log("Server Listening on PORT:", PORT);
});