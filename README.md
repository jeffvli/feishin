# Sonixd (rewrite)

Repository for the rewrite of [Sonixd](https://github.com/jeffvli/sonixd).

## Development

This project is built off of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate) v4.6.0.

### Developing with Docker Compose

1. Copy and rename the `example.env.dev` to `.env.dev` and make any changes necessary
2. **Run the server**: Use `npm run docker:up` to build and run the dev server
   1. Prisma studio available on `http://localhost:5555`
   2. Server available on `http://localhost:9321`
   3. Default login credentials are `admin/admin`
3. **Run the client**: Use `npm run start` to run the dev Electron client

To package the application:

```bash
npm run package
```

## License

[GNU General Public License v3.0 ©](https://github.com/jeffvli/sonixd-rewrite/blob/dev/LICENSE)
