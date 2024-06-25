import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const generateAccessAndRefreshTokens=async(userId)=>
{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}
const registerUser=asyncHandler(async (req,res)=>{
    //get user details from frontend
    //validation-not empty
    //check if user already exist - username and email
    //check for images and avatar
    //upload them to cloudinary
    //create user object- create entry in db
    //remove pw and refresh token field from response
    //check for user creation 
    //return res
    const {fullName,email,username,password}=req.body

    if(
        [fullName,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username}, {email}]
    })
    if(existedUser) {
        throw new ApiError(409,"User with username or email already exist!!!")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path;
    }
    if(!avatarLocalPath) {throw new ApiError(400,"Avatar issss required")}
    
    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!avatar) {throw new ApiError(400,"Avatar is required")}

    const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser=await User.findById(user._id).select(         //mongoDb itself adds an _id field to every entry
        "-password -refreshToken"                                   // - means not take this field , take rest all
    )  

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }     
    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})
const loginUser=asyncHandler(async (req,res)=>{
    //req body->username and password
    //usename or email
    //find the user
    //password check
    //generate access and refresh tokens 
    //send cookies
    const {email,username,password}=req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }
    const user=await User.findOne({
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials!!!")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,              //so that cookies can be modified by servers only
        secure:true
    }
    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )

})
const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

export {registerUser,loginUser,logoutUser}