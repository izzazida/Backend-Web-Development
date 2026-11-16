'use strict';

const { Worker } = require('bullmq');
const { connection } = require('./queue');
const { transporter } = require('./email');

const worker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'otp') {
      const { email, otp } = job.data;

      await transporter.sendMail({
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Email Verification OTP',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`
      });

      console.log(`OTP email sent to ${email}`);
      return { ok: true };
    }

    return { ok: true };
  },
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  }
);

worker.on('completed', (job) => {
  console.log(`completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`failed: ${job.id}`, err.message);
});

module.exports = worker;