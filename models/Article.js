// Require mongoose
var mongoose = require("mongoose");

var Note = require("./Note");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
    // 'title' is required and of type string
    title: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    // 'link' is required and of type string
    saved: {
        type: Boolean,
        required: false
    },
    // 'note' is an object that stores a Note id
    // The ref property links the ObjectId to the Note model
    // Allows us to populate the Article with an associated Note
    notes: [{
        type: Schema.Types.ObjectId,
        ref: "Note"
    }]
});

// This creates our model from the above Schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;