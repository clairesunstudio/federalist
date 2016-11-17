var AWS = require('aws-sdk'),
    env = require("../../services/environment")(),
    cfenv = require('cfenv'),
    sqsKey = env.FEDERALIST_AWS_BUILD_KEY,
    sqsSecret = env.FEDERALIST_AWS_BUILD_SECRET,
    appEnv = cfenv.getAppEnv(),
    rds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-rds`),
    AWS_S3_CREDS = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-s3`),
    redisCreds = appEnv.getServiceCreds(`federalist-${process.env.APP_ENV}-redis`);

var _ = require('underscore');
var session = {
  cookie: {
    secure: true
  },
  proxy: true,
  secret: env.FEDERALIST_SESSION_SECRET
};

/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {
  grunt: {
    _hookTimeout: 60 * 1000
  }
};

// If running in Cloud Foundry with a service database available, use it
if (rds) {
  module.exports.connections = {
    postgres: {
      adapter: 'sails-postgresql',
      database: rds.db_name,
      host: rds.host,
      user: rds.username,
      password: rds.password,
      port: rds.port,
      poolSize: 2,
      ssl: false
    }
  };
  module.exports.models = {
    connection: 'postgres'
  };
} else {
  throw new Error('No database credentials found.');
}

// If running in Cloud Foundry with an S3 credential service available
if (sqsKey && sqsSecret && AWS_S3_CREDS) {
  module.exports.SQS = new AWS.SQS({
    accessKeyId: sqsKey,
    secretAccessKey: sqsSecret,
    region: 'us-east-1'
  });

  module.exports.S3 = new AWS.S3({
    accessKeyId: AWS_S3_CREDS.access_key_id,
    secretAccessKey: AWS_S3_CREDS.secret_access_key,
    region: AWS_S3_CREDS.region
  });
} else {
  throw new Error('No SQS or S3 credentials found.');
}

// If running in Cloud Foundry with a redis service
if (redisCreds) {
  session = _.extend({}, session, {
    adapter: 'redis',
    host: redisCreds.hostname,
    port: redisCreds.port,
    db: 0,
    pass: redisCreds.password
  });
} else {
  throw new Error('No redis credentials found.');
}

module.exports.session = session;
