const { gql } = require('apollo-server');

//Schemas
const typeDefs = gql`
	type Usuario {
		id: ID
		nombre: String
		apellido: String
		email: String
		creado: String
		nivel: String
		status: String
	}

	type Token {
		token: String
	}

	type Producto {
		id: ID
		codigo: String
		nombre: String
		existencia: Int
		precio: Float
		creado: String
		status: String
	}

	type Cliente {
		id: ID
		nombre: String
		apellido: String
		empresa: String
		email: String
		telefono: String
		vendedor: ID
	}

	type PedidoGrupo {
		id: ID
		cantidad: Int
		nombre: String
		precio: Float
	}

	type Pedido {
		id: ID
		pedido: [PedidoGrupo]
		total: Float
		cliente: Cliente
		vendedor: ID
		creado: String
		estado: EstadoPedido
	}

	type TopCliente {
		total: Float
		cliente: [Cliente]
	}

	type TopVendedor {
		total: Float
		vendedor: [Usuario]
	}

	input UsuarioInput {
		nombre: String!
		apellido: String!
		email: String!
		password: String!
	}

	input AutenticarInput {
		email: String!
		password: String!
	}

	# input productos
	input ProductoInput {
		nombre: String!
		existencia: Int!
		precio: Float!
	}
	# codigo: String linea excluida

	# input clientes
	input ClienteInput {
		nombre: String!
		apellido: String!
		empresa: String!
		email: String!
		telefono: String!
	}

	# input pedidos
	input PedidoProductoInput {
		id: ID!
		cantidad: Int!
		nombre: String
		precio: Float
	}

	enum EstadoPedido {
		PENDIENTE
		COMPLETADO
		CANCELADO
		FACTURADO
		COBRADO
	}

	input PedidoInput {
		pedido: [PedidoProductoInput]
		total: Float
		cliente: ID
		estado: EstadoPedido
	}

	type Query {
		# usuarios
		obtenerUsuario(token: String!): Usuario
		obtenerUsuarioDesdeFront: Usuario
		obtenerDatosUsuario(token: String!): Usuario

		#productos
		obtenerProductos: [Producto]
		obtenerProducto(id: ID!): Producto

		# clientes
		obtenerClientes: [Cliente]
		obtenerClientesVendedor: [Cliente]
		obtenerCliente(id: ID!): Cliente

		# pedidos
		obtenerPedidos: [Pedido]
		obtenerPedidosVendedor: [Pedido]
		obtenerPedido(id: ID!): Pedido
		obtenerPedidoEstado(estado: String!): [Pedido]

		# Busquedas avanzadas
		mejoresClientes: [TopCliente]
		mejoresVendedores: [TopVendedor]
		buscarProducto(texto: String!): [Producto]
	}

	type Mutation {
		# Usuarios
		nuevoUsuario(input: UsuarioInput): Usuario
		autenticarUsuario(input: AutenticarInput): Token

		# Productos
		nuevoProducto(input: ProductoInput): Producto
		actualizarProducto(id: ID!, input: ProductoInput): Producto
		eliminarProducto(id: ID!): String

		# Clientes
		nuevoCliente(input: ClienteInput): Cliente
		actualizarCliente(id: ID!, input: ClienteInput): Cliente
		eliminarCliente(id: ID!): String

		# Pedidos
		nuevoPedido(input: PedidoInput): Pedido
		actualizarPedido(id: ID!, input: PedidoInput): Pedido
		eliminarPedido(id: ID!): String
	}
`;

module.exports = typeDefs;
