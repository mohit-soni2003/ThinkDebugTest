const express = require("express");
const connectDB = require("./config/dbconfig")
const cookieParser = require("cookie-parser");

require("dotenv").config();




const port =  process.env.PORT||3000;
const app = express()
connectDB();

app.use(express.json());    
app.use(cookieParser());

app.use("/auth",require("./routes/authRoutes"))
app.use("/user",require("./routes/userRoutes"))
app.use("/product",require("./routes/productRoutes"))
app.use("/admin",require("./routes/adminRoutes"))
app.use("/order",require("./routes/orderRoutes"))


app.get("/", (req,res)=>{
    res.send("WELCOME TO THE MOHIT SERVER")
})
app.get("/test", (req,res)=>{
    res.send("SERVER  IS RUNNING FINE ON THE TEST COMPLETED....")
})





app.listen(port,()=>{
    console.log(`Server is running fine on Port : ${port}`);
}) 