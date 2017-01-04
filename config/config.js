var config = {

  development: {
    server: {
      port: 8080,
      cluster: 1
    },
    database: {
      servers: [
        { host: 'rdb.codeunbug.com', port: 28015 }
      ],
      db: 'g2g'
    },
    oauth: {
      local: {
        provider: 'local'
      },
      facebook: {
        provoider: 'facebook',
        clientId: '1438197499538604',
        clientSecret: 'd39bcc969fab3f784ec24c301535b7a4',
        callbackURL: 'http://localhost:8080/oauth/facebook/callback'
      },
      google: {
        provoider: 'google',
        clientId: '464475406694-skti62k23di8uemcanuc6h6ah5nnl55a.apps.googleusercontent.com',
        clientSecret: '24WehldQ1ZPo2hXCXmxI_FFg',
        callbackURL: 'http://localhost:8080/oauth/google/callback'
      }
    },
    java: true
  },

  production: {
    server: {
      port: 8080,
      cluster: 1
    },
    database: {
      servers: [
        { host: 'rdb.codeunbug.com', port: 28015 }
      ],
      db: 'oauth'
    },
    oauth: [
      {
        provider: 'local'
      },
      {
        provoider: 'facebook',
        clientId: '1438197499538604',
        clientSecret: 'd39bcc969fab3f784ec24c301535b7a4',
        callbackURL: 'http://localhost:8080/oauth/facebook/callback'
      },
      {
        provoider: 'google',
        clientId: '464475406694-skti62k23di8uemcanuc6h6ah5nnl55a.apps.googleusercontent.com',
        clientSecret: '24WehldQ1ZPo2hXCXmxI_FFg',
        callbackURL: 'http://localhost:8080/oauth/google/callback'
      }
    ]
  }

};

module.exports = config[process.env.NODE_ENV || 'development'];