 // Require mongoose
var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// using the Schema constructor, create a new NoteSchema object
// Similar to a Sequelize model
var NoteSchema = new Schema({
   body: {
       type: String
   },
   article: {
       type: Schema.Types.ObjectId,
       ref: "Article"
   }
});

// This creates our model from the above schema, using mongoose's model method
var Note = mongoose.model("Note", NoteSchema);

// Export the note model
module.exports = Note;