const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer")


//user create service
const create = async (userdata) => {
  const { name, email, password, location } = userdata;

  try {
    const weatherData = await getWeatherDataFromAPI(location);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await new User({
      name,
      email,
      password: hashedPassword,
      location,
      weatherData: [weatherData],
    }).save();

    return user;
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw error;
  }
};


// Get all users
const getAllUsers = async () => {

    const users = await User.find();
    return users;
  
};

//update user location service
const update = async (id, data) => {
  try {
    let user = await User.findByIdAndUpdate(id, data);
    user = await User.findById(id);

    return user;
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//get weather service
const getWeatherDataFromAPI = async (location) => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const weatherData = await response.json();

    const temperature = weatherData.main.temp;
    const weatherCondition = weatherData.weather[0].main;
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    const fullDate = `${year}-${month < 10 ? "0" : ""}${month}-${
      day < 10 ? "0" : ""
    }${day}`;

    return { temperature, weatherCondition, date: fullDate, location };
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    throw new Error("Unable to fetch weather data");
  }
};

//get weather from  given date
const getUserByWeatherDate = async (date) => {
  try {
    const users = await User.find();

    const usersWithFilteredData = users.map((user) => {
      const filteredWeatherData = user.weatherData.filter(
        (data) => data.date === date
      );

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        location: user.location,
        weatherData: filteredWeatherData,
      };
    });

    return usersWithFilteredData;
  } catch (error) {
    throw new Error("Error retrieving users by date");
  }
};


//send weather report service
const sendWeatherReportToAllUsers = async () => {
  try {
    // Create a Nodemailer transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const allUsers = await getAllUsers();
    allUsers.forEach(async (user) => {
      let weatherData = await getWeatherDataFromAPI(user?.location);

      // Compose the email
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: user?.email,
        subject: "Hourly Weather Report",
        text: `Hourly Weather Report:\nTemperature: ${weatherData.temperature}\nWeather Condition: ${weatherData.weatherCondition}`,
      };

      // Send the email
      transporter.sendMail(mailOptions);
    });

    console.log("Hourly weather reports sent successfully!");
  } catch (error) {
    console.error("Error sending hourly weather report:", error.message);
  }
};


// find user by email
const getUserByEmail = async (email) => {
  try {
    const userdata = await User.findOne({ email: email });

    if (!userdata) {
      // User not found
      return null;
    }
    return userdata;

  } catch (error) {
    console.error("Error getting user:", error.message);
    throw new Error("Internal Server Error");
  }
};
//comparePassword
const comparePassword = async (password, hashedPassword) => {
  try {
    console.log("password", password)
    console.log("hashedPassword", hashedPassword)
    const isMatch = await bcrypt.compare(password, hashedPassword)
    console.log("isMatch", isMatch)
    return isMatch
  } catch (error) {
    console.error("Error comparing password:", error.message);
    throw new Error("Internal Server Error");
  }
}

module.exports = {
  create,
  update,
  getAllUsers,
  getWeatherDataFromAPI,
  getUserByWeatherDate,
  sendWeatherReportToAllUsers,
  getUserByEmail,
  comparePassword

};
