import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from user

    const { fullName, username, email, password } = req.body;

    // validation - not empty

    if (
        [fullName, username, email, password].some(
            (item) => item?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already exists: username, email

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists!");
    }

    // check for images, check for avatar

    const avatarImageLocalPath = req.files?.avatar[0]?.path;
    // console.log("req.files in user controller", req.files);

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.lenght > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarImageLocalPath) {
        throw new ApiError(400, "Avatar Image is required");
    }

    // upload the avatar to cloudinary

    const avatar = await uploadOnCloudinary(avatarImageLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar Image is required");
    }

    // create user object - create entry in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    // remove password and refresh token from response

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // check for user creation

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // return response

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User Registered Successfully!!")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // get login data

    const { username, email, password } = req.body;

    if (!username || !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // check if user exists or not

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // match password

    const isPasswordValidated = await user.isPasswordCorrect(password);

    if (!isPasswordValidated) {
        throw new ApiError(404, "Invalid User Credentials");
    }

    // generate access and refresh token

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -token"
    );

    // send cookies

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User Logged in Successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req,res)=>{

    await User.findByIdAndUpdate(req.user._id,{
        $set:{refreshToken:undefined}
    })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(200, {}, "User Logged Out")

})

export { registerUser, loginUser, logoutUser};
