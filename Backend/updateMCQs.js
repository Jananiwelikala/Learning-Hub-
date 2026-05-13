const mongoose = require('mongoose');
require('dotenv').config();

async function updateMCQData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // First, update documents with valid year values
    const validYearResult = await mongoose.connection.db.collection('mcqs').updateMany(
      { questionText: { $exists: true }, year: { $regex: /^\d+$/ } },
      [
        {
          $set: {
            question: '$questionText',
            correctOptionIndex: { $toInt: '$correctAnswer' },
            examYear: { $toInt: '$year' }
          }
        },
        {
          $unset: ['questionText', 'correctAnswer', 'year']
        }
      ]
    );

    console.log('Updated MCQ documents with valid years:', validYearResult.modifiedCount);

    // Then update documents with invalid year values (set to 2025)
    const invalidYearResult = await mongoose.connection.db.collection('mcqs').updateMany(
      { questionText: { $exists: true }, year: { $exists: true } },
      [
        {
          $set: {
            question: '$questionText',
            correctOptionIndex: { $toInt: '$correctAnswer' },
            examYear: 2025
          }
        },
        {
          $unset: ['questionText', 'correctAnswer', 'year']
        }
      ]
    );

    console.log('Updated MCQ documents with invalid years:', invalidYearResult.modifiedCount);

    // Verify the updates
    const updatedMCQs = await mongoose.connection.db.collection('mcqs').find({}).limit(3).toArray();
    console.log('Sample updated MCQ:');
    console.log(JSON.stringify(updatedMCQs[0], null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateMCQData();