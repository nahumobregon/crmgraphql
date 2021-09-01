const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
const Producto = require('../models/Producto');

const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');

require('dotenv').config({ path: 'variables.env' });

const crearToken = (usuario, secreta, expiresIn) => {
	//console.log(usuario);
	const { id, email, nombre, apellido, activo, status, nivel } = usuario;

	return jwt.sign(
		{ id, email, nombre, apellido, activo, status, nivel },
		secreta,
		{
			expiresIn,
		}
	);
};

//Resolvers
const resolvers = {
	Query: {
		obtenerUsuario: async (_, { token }) => {
			const usuarioId = await jwt.verify(token, process.env.SECRETA);
			return usuarioId;
		},
		obtenerUsuarioDesdeFront: async (_, {}, ctx) => {
			return ctx.usuario;
		},
		obtenerDatosUsuario: async (_, { token }) => {
			const usuarioId = await jwt.verify(token, process.env.SECRETA);
			return usuarioId;
		},
		obtenerProductos: async () => {
			try {
				const productos = await Producto.find({});
				return productos;
			} catch (error) {
				console.log(error);
			}
		},
		obtenerProducto: async (_, { id }) => {
			//revisar que el producto existante
			const producto = await Producto.findById(id);
			if (!producto) {
				throw new Error('Producto no encontrado');
			}
			return producto;
		},
		obtenerClientes: async () => {
			try {
				const clientes = await Cliente.find({});
				return clientes;
			} catch (error) {
				console.log(error);
			}
		},
		obtenerClientesVendedor: async (_, {}, ctx) => {
			console.log('imprimiendo ctx');
			console.log(ctx.usuario.id.toString());
			try {
				const clientes = await Cliente.find({
					vendedor: ctx.usuario.id.toString(),
				});
				return clientes;
			} catch (error) {
				console.log(error);
			}
		},
		obtenerCliente: async (_, { id }, ctx) => {
			// Revisar si el cliente existe o no
			const cliente = await Cliente.findById(id);

			if (!cliente) {
				throw new Error('Cliente no encontrado');
			}

			// Quien lo creo puede verlo
			if (cliente.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales');
			}

			return cliente;
		},
		obtenerPedidos: async () => {
			try {
				const pedidos = await Pedido.find({});
				return pedidos;
			} catch (error) {
				console.log(error);
			}
		},
		obtenerPedidosVendedor: async (_, {}, ctx) => {
			try {
				console.log(ctx);

				const pedidos = await Pedido.find({
					vendedor: ctx.usuario.id.toString(),
				}).populate('cliente');
				// if (!pedidos) {
				// 	return { data: 'null' };
				// }
				return pedidos;
			} catch (error) {
				console.log(error);
			}
		},
		obtenerPedido: async (_, { id }, ctx) => {
			//verificar si el pedido existe
			const pedido = await Pedido.findById(id);
			if (!pedido) {
				throw new Error('El pedido no existe');
			}

			//Verificar si el pedido es de la persona que lo consulta
			if (pedido.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No puedes consultar este pedido');
			}

			//retornar el resultado
			return pedido;
		},
		obtenerPedidoEstado: async (_, { estado }, ctx) => {
			const pedidosPorEstatus = await Pedido.find({
				vendedor: ctx.usuario.id,
				estado: estado,
			});

			return pedidosPorEstatus;
		},
		mejoresClientes: async () => {
			const clientes = await Pedido.aggregate([
				{ $match: { estado: 'COMPLETADO' } },
				{
					$group: {
						_id: '$cliente',
						total: { $sum: '$total' },
					},
				},
				{
					$lookup: {
						from: 'clientes',
						localField: '_id',
						foreignField: '_id',
						as: 'cliente',
					},
				},
				{
					$sort: { total: -1 },
				},
			]);

			return clientes;
		},
		mejoresVendedores: async () => {
			const vendedores = await Pedido.aggregate([
				{ $match: { estado: 'AUTORIZADO' } },
				{
					$group: {
						_id: '$vendedor',
						total: { $sum: '$total' },
					},
				},
				{
					$lookup: {
						from: 'usuarios',
						localField: '_id',
						foreignField: '_id',
						as: 'vendedor',
					},
				},
				{
					$limit: 3,
				},
				{
					$sort: { total: -1 },
				},
			]);

			return vendedores;
		},
		buscarProducto: async (_, { texto }) => {
			const productos = await Producto.find({
				$text: { $search: texto },
			}).limit(10);
			return productos;
		},
	},
	Mutation: {
		nuevoUsuario: async (_, { input }) => {
			//console.log(input);
			const { email, password } = input;

			//revisar si el usuario ya esta registrado
			const existeUsuario = await Usuario.findOne({ email });

			if (existeUsuario) {
				throw new Error('El usuario ya esta registrado');
			}

			//hashear password
			const salt = await bcryptjs.genSalt(10);
			input.password = await bcryptjs.hash(password, salt);

			//guardar el usuario en la base de datos
			try {
				const usuario = new Usuario(input);
				usuario.save();
				return usuario;
			} catch (error) {
				console.log(error);
			}

			//return 'Usuario Creando';
		},
		autenticarUsuario: async (_, { input }) => {
			const { email, password } = input;
			//si el usuario existe
			const existeUsuario = await Usuario.findOne({ email });

			if (!existeUsuario) {
				throw new Error('El usuario no esta registrado');
			}

			//revisar si el paswword es correcto
			const passwordCorrecto = await bcryptjs.compare(
				password,
				existeUsuario.password
			);
			if (!passwordCorrecto) {
				throw new Error('El password es incorrecto');
			}

			//Crear Token
			return {
				token: crearToken(existeUsuario, process.env.SECRETA, '24h'),
			};
		},
		nuevoProducto: async (_, { input }) => {
			try {
				const nuevoProducto = new Producto(input);

				//almacenar en la base de datos para
				const producto = await nuevoProducto.save();
				return producto;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarProducto: async (_, { id, input }) => {
			//revisar que el producto existante
			let producto = await Producto.findById(id);
			if (!producto) {
				throw new Error('Producto no encontrado');
			}

			//guardarlo en la base de datos
			producto = await Producto.findOneAndUpdate({ _id: id }, input, {
				new: true,
			});

			return producto;
		},
		eliminarProducto: async (_, { id }) => {
			//revisar si el producto existe
			const producto = await Producto.findById(id);
			if (!producto) {
				throw new Error('Producto no existe ');
			}

			//eliminarlo de la base de datos
			await Producto.findOneAndDelete({ _id: id });

			return 'Producto Eliminado';
		},
		nuevoCliente: async (_, { input }, ctx) => {
			//verificar si ya existe el Cliente
			//console.log(input);
			//console.log(ctx);
			const { email } = input;
			const existeCliente = await Cliente.findOne({ email: email });
			if (existeCliente) {
				throw new Error('Cliente registrado con anterioridad');
			}
			const nuevoCliente = new Cliente(input);

			//asignar el vendedor
			//nuevoCliente.vendedor = '61185ad7106d9754b8f339cf';
			nuevoCliente.vendedor = ctx.usuario.id;

			//guardarlo en la base de datos
			try {
				const cliente = await nuevoCliente.save();
				return cliente;
			} catch (error) {
				console.log(error);
			}
		},
		actualizarCliente: async (_, { id, input }, ctx) => {
			//Verificar si existe el cliente
			let cliente = await Cliente.findById(id);
			if (!cliente) {
				throw new Error('El cliente no existe');
			}
			//Verificar si el vendedor es quien edita el cliente
			if (cliente.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales');
			}
			//guardar el cliente
			cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
				new: true,
			});
			return cliente;
		},
		eliminarCliente: async (_, { id }, ctx) => {
			//Verificar si el cliente existe
			let cliente = await Cliente.findById(id);
			if (!cliente) {
				throw new Error('El cliente no existe');
			}

			//Verificar si lo esta eliminando quien lo creó
			if (cliente.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales');
			}

			//Eliminar cliente
			await Cliente.findOneAndDelete({ _id: id });

			return 'Cliente eliminado con exito';
		},
		nuevoPedido: async (_, { input }, ctx) => {
			const { cliente: id } = input;
			//verificar si el cliente existe

			let cliente = await Cliente.findById(id);
			if (!cliente) {
				throw new Error('El cliente no existe');
			}

			//verificar si el cliente pertenece al vendedor
			if (cliente.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes las credenciales');
			}

			//revisar que el stock exista
			// usar un "for asincrono" para el uso corrcto de throw new Error
			for await (const articulo of input.pedido) {
				const { id } = articulo;

				let producto = await Producto.findById(id);

				if (articulo.cantidad > producto.existencia) {
					throw new Error(
						`El articulo: ${producto.nombre} excede la cantidad disponible`
					);
				} else {
					// si hay existencia suficiente , restar cantidad a la existencia
					producto.existencia = producto.existencia - articulo.cantidad;
					await producto.save();
				}
			}
			//crear el nuevo pedido
			const nuevoPedido = new Pedido(input);

			//asignarle el vendedor
			nuevoPedido.vendedor = ctx.usuario.id;

			//guardarlo en la base de datos
			const pedidoGuardado = await nuevoPedido.save();
			return pedidoGuardado;
		},
		actualizarPedido: async (_, { id, input }, ctx) => {
			//si el pedido existe
			const existePedido = await Pedido.findById(id);
			if (!existePedido) {
				throw new Error('No existe el pedido');
			}
			//si el cliente existe
			const existeCliente = await Cliente.findById(input.cliente);
			if (!existeCliente) {
				throw new Error('No existe el cliente');
			}
			//si el cliente y el pedido pertenecen al vendedor
			if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes acceso a el pedido');
			}

			//revisar el stock
			//revisar que el stock exista
			// usar un "for asincrono" para el uso corrcto de throw new Error
			if (input.pedido) {
				for await (const articulo of input.pedido) {
					const { id } = articulo;

					let producto = await Producto.findById(id);

					if (articulo.cantidad > producto.existencia) {
						throw new Error(
							`El articulo: ${producto.nombre} excede la cantidad disponible`
						);
					} else {
						// si hay existencia suficiente , restar cantidad a la existencia
						producto.existencia = producto.existencia - articulo.cantidad;
						await producto.save();
					}
				}
			}

			//guardar el pedido
			const pedidoActualizado = await Pedido.findOneAndUpdate(
				{ _id: id },
				input,
				{ new: true }
			);
			return pedidoActualizado;
		},
		eliminarPedido: async (_, { id }, ctx) => {
			//verifcar si el pedido existe
			const existePedido = await Pedido.findById(id);
			if (!existePedido) {
				throw new Error('Pedido no existe');
			}
			//verificar si el pedido pertenece al vendedor
			if (existePedido.vendedor.toString() !== ctx.usuario.id) {
				throw new Error('No tienes acceso al pedido');
			}

			//eliminar el pedido
			await Pedido.findOneAndDelete({ _id: id });
			return 'Pedido Eliminado';
		},
	},
};

module.exports = resolvers;
