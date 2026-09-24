import mongoose from "mongoose";
const dbConnection = async () => {
    try {
        const connectionDB = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connected!! ${connectionDB.connection.host}`)
    } catch (error) {
        console.log("mongoDB Connection Error" , error)
        process.exit(1);
    }
}

export default dbConnection