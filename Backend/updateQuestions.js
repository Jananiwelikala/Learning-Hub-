const mongoose = require('mongoose');
require('dotenv').config();

async function updateQuestionData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update documents that have 'type' field to use 'questionType'
    const result = await mongoose.connection.db.collection('assessmentquestions').updateMany(
      { type: { $exists: true } },
      [
        {
          $set: {
            questionType: '$type',
            prompt: '$questionText',
            examYear: { $toInt: '$year' },
            maxMarks: '$marks'
          }
        },
        {
          $unset: ['type', 'questionText', 'year', 'marks']
        }
      ]
    );

    console.log('Updated documents:', result.modifiedCount);

    // Verify the updates
    const updatedQuestions = await mongoose.connection.db.collection('assessmentquestions').find({}).limit(3).toArray();
    console.log('Sample updated question:');
    console.log(JSON.stringify(updatedQuestions[0], null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateQuestionData();