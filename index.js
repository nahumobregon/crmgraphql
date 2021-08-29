const { ApolloServer } = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });

//Conectar a la base de datos de datos
conectarDB();

//servidor
const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: ({ req }) => {
		//console.log(req.headers['authorization']);
		let token = req.headers['authorization'] || '';
		//console.log(token);
		let tokenlimpio = token.replace('Bearer ', '');
		//console.log(tokenlimpio);
		if (token) {
			try {
				const usuario = jwt.verify(tokenlimpio, process.env.SECRETA);
				//console.log('desde el backend');
				//console.log(usuario);
				return {
					usuario,
				};
			} catch (error) {
				console.log(error);
			}
		}
	},
});

//Arrancar el servidor
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
	console.log(`Servidor listo en URL ${url}`);
});
