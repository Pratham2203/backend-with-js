import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.COUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary=async (localfilepath)=>{
    try {
        if(!localfilepath) return null
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:"auto"
        })
        console.log("file uploaded on cloudinary ",response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localfilepath)    // remove locally saved temporary file as the uploaded operation got failed
        return null;
    }
}