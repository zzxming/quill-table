const pathLib = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	mode: 'development',
	entry: {
		'table.js': './src/dist.js',
		table: './src/assets/style/index.less',
		'demo.js': './src/demo.js',
	},
	output: {
		path: pathLib.resolve(__dirname, './dist'),
		filename: '[name]',
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
				test: /(\.js)$/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/env'],
					},
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
