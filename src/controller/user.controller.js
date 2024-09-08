import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../Models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    // find user from model with userId
    const user = await User.findById(userId);

    //get function from user modal
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // store refreshToken in User Model
    user.refreshToken = refreshToken;

    // save it in the user modal
    await user.save({ validateBeforeSave: false });

    // return
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// register User
const registerUser = asyncHandler(async (req, res) => {
  // Get user info from frontEnd
  const { fullName, email, username, password } = req.body;

  console.log("email", email);
  console.log("fullName", fullName);
  console.log("username", username);

  // Check if all fields are provided
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Create entry in DB
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    password, // This will be hashed automatically by the pre-save middleware
  });

  // Remove password and refresh token fields from response
  const createdUser = await User.findById(user._id).select(
    "-password -_refreshToken"
  );

  // Check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Return response
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  // req data from body
  const { email, password } = req.body;

  // email and password check
  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "Email and password are required");
  }

  // find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // check if the password is correct
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -_refreshToken"
  );

  // cookie options
  const options = {
    httpOnly: true,
    secure: true, // should be set to `true` in production for secure HTTPS cookies
  };

  // send the response with tokens in cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, //this will removes the field from documnet
      },
    },
    {
      new: true, // new will return the updated value to User
    }
  );

  //set options for cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
