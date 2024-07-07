import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({ 
    cloud_name : 'dttsluj6o', 
    api_key : '191424391976646', 
    api_secret : 'Ub4i1Q65NlvKJkpflO5E7et355c'
  });

const uploadOnCloudinary=async (localfilepath)=>{
    try {
        if(!localfilepath){
            return null
        } 
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localfilepath)
        return response;
    } catch (error) {
        console.log("error in uploading files to cloudinary : ",error)
        fs.unlinkSync(localfilepath)    // remove locally saved temporary file as the uploaded operation got failed
        return null;
    }
}
export {uploadOnCloudinary}
