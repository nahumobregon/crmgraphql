const mongoose = require('mongoose');

const ProductoSchema = mongoose.Schema({
	codigo: {
		type: String,
		required: false,
		trim: true,
		unique: true,
	},
	nombre: {
		type: String,
		required: true,
		trim: true,
	},
	existencia: {
		type: Number,
		required: true,
		trim: true,
	},
	precio: {
		type: Number,
		required: true,
		trim: true,
	},
	creado: {
		type: Date,
		default: Date.now(),
	},
	status: {
		type: String,
		required: true,
		default: 'Activo',
	},
});

ProductoSchema.index({ nombre: 'text' });

module.exports = mongoose.model('Producto', ProductoSchema);
