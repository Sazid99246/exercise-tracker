const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => console.log("Database connected!")).catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  username: String,
  exercise: Array
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

let urlencodeParser = bodyParser.urlencoded({ extended: true });

app.post("/api/users", urlencodeParser, async (req, res) => {
  let paramUsername = req.body.username;

  try {
    let newUserDetails = new User({
      username: paramUsername
    });

    const userSaved = await newUserDetails.save();
    res.json({
      _id: userSaved._id,
      username: userSaved.username
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({}, "_id username");

  res.json(users);
});

app.post("/api/users/:_id/exercises", urlencodeParser, async (req, res) => {
  let user_id = req.params._id;
  let dateValue =
    req.body.date === "" || req.body.date === undefined
      ? new Date().toDateString()
      : new Date(req.body.date).toDateString();

  try {
    let exerciseObj = {
      description: req.body.description,
      duration: req.body.duration,
      date: dateValue
    };

    const exerciseDetails = await User.findByIdAndUpdate(user_id, {
      $push: { exercise: exerciseObj }
    });
    let response = {
      _id: exerciseDetails._id,
      username: exerciseDetails.username
    };

    response["description"] = exerciseObj.description;
    response["duration"] = parseInt(exerciseObj.duration);
    response["date"] = new Date(exerciseObj.date).toDateString();
    res.json(response);
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users/:_id/exercises", urlencodeParser, async (req, res) => {
  try {
    const userExercise = await User.findById(req.params._id);

    res.json({
      username: userExercise.username,
      description: userExercise.description,
      duration: userExercise.duration,
      data: new Date(userExercise.date).toDateString(),
      _id: userExercise._id
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  let user_id = req.params._id;
  let { from, to, limit } = req.query;

  try {
    let userLogs = await User.findById(user_id);
    let exerciselogs;
    console.log(from, to);
    if (from && to) {
      console.log("im here");
      let filteredDates = userLogs.exercise.filter(item => {
        let convertedFrom = new Date(from).toDateString();
        let convertedTo = new Date(to).toDateString();

        return (
          Date.parse(item.date) >= Date.parse(convertedFrom) &&
          Date.parse(item.date) <= Date.parse(convertedTo)
        );
      });
      console.log(filteredDates);
      exerciselogs = filteredDates.map(data => {
        return {
          description: data.description,
          duration: parseInt(data.duration),
          date: new Date(data.date).toDateString()
        };
      });

      if (limit) {
        exerciselogs = userLogs.exercise
          .map(item => {
            return {
              description: item.description,
              duration: parseInt(item.duration),
              date: new Date(item.date).toDateString()
            };
          })
          .slice(0, limit);
      }
      console.log(exerciselogs, "tests");
    } else if (limit) {
      exerciselogs = userLogs.exercise
        .map(item => {
          return {
            description: item.description,
            duration: parseInt(item.duration),
            date: new Date(item.date).toDateString()
          };
        })
        .slice(0, limit);
    } else {
      console.log("else was loaded");

      exerciselogs = userLogs.exercise.map(item => {
        return {
          description: item.description,
          duration: parseInt(item.duration),
          date: new Date(item.date).toDateString()
        };
      });
    }

    console.log(exerciselogs);

    res.json({
      _id: userLogs._id,
      username: userLogs.username,
      count: userLogs.exercise.length,
      log: exerciselogs
    });
  } catch (err) {
    console.log(err);
  }
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
