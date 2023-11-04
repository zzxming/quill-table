const pathLib = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'production',
	entry: {
		'table.js': './src/index.js',
		table: './src/assets/style/index.less',
		'demo.js': './src/demo.js',
	},
	output: {
		path: pathLib.resolve(__dirname, './dist'),
		filename: '[name]',
		library: 'TableModule',
		libraryExport: 'default',
		libraryTarget: 'umd',
	},
	optimization: {
		minimize: true,
	},
	externals: {
		quill: {
			commonjs: 'quill',
			commonjs2: 'quill',
			amd: 'quill',
			root: 'Quill',
		},
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[name].[id].css',
		}),
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				use: {
					loader: 'babel-loader',
				},
				exclude: /node_modules/,
			},
			{
				test: /\.(html|svg)$/,
				use: [
					{
						loader: 'html-loader',
						options: {
							minimize: true,
						},
					},
				],
			},
			{
				test: /\.less$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
				exclude: /node_modules/,
			},
		],
	},
};
